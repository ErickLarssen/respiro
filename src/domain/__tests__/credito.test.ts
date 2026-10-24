import { describe, expect, it } from 'vitest'
import {
  avisoCompraNoCredito,
  contaNoTeto,
  contasNoCredito,
  dataDeFechamento,
  dataDeVencimento,
  faturaConhecida,
  faturaDaCompra,
  faturaDoPlano,
  faturaNoBanco,
  gastoNoCredito,
  limiteLivre,
  limiteUsado,
  parcelasDaCompra,
} from '../credito'
import { calcularPlano } from '../plano'
import { resumoDoMes } from '../resumo'
import type { Cartao, Conta, FormaPagamento, Gasto } from '../tipos'
import { categorias, config, contas as contasIniciais } from './dadosDeTeste'

const R$ = 'R$ '

// Casos da seção 5.8: PicPay Card, fecha 12, vence 20, orçamento R$ 300, regra nova a partir de novembro.
const cartao: Cartao = { limite: 46800, diaFechamento: 12, diaVencimento: 20, orcamento: 30000, regraDesde: '2026-11' }

function gasto(data: string, valor: number, forma: FormaPagamento = 'credito', extra: Partial<Gasto> = {}): Gasto {
  return { id: `${data}-${valor}-${forma}`, data, valor, categoriaId: 'churrasco', forma, criadoEm: `${data}T12:00:00Z`, ...extra }
}

const compras = [
  gasto('2026-11-05', 8000),
  gasto('2026-11-12', 1000),
  gasto('2026-11-13', 5000),
  gasto('2026-11-20', 10000, 'credito', { parcelas: 3 }),
  gasto('2026-10-28', 4000), // regra anterior
]

describe('faturaDaCompra', () => {
  it('até o fechamento (inclusive) cai na fatura que vence no mês', () => {
    expect(faturaDaCompra('2026-11-05', cartao)).toBe('2026-11')
    expect(faturaDaCompra('2026-11-12', cartao)).toBe('2026-11')
  })

  it('depois do fechamento cai na fatura do mês seguinte', () => {
    expect(faturaDaCompra('2026-11-13', cartao)).toBe('2026-12')
    expect(faturaDaCompra('2026-12-31', cartao)).toBe('2027-01')
  })

  it('cartão que fecha depois do vencimento (fecha 25, vence 5)', () => {
    const outro = { ...cartao, diaFechamento: 25, diaVencimento: 5 }
    expect(faturaDaCompra('2026-11-25', outro)).toBe('2026-12') // fecha 25/nov, vence 5/dez
    expect(faturaDaCompra('2026-11-26', outro)).toBe('2027-01') // fecha 25/dez, vence 5/jan
    expect(dataDeFechamento('2026-12', outro)).toBe('2026-11-25')
  })

  it('datas de fechamento e vencimento da fatura', () => {
    expect(dataDeFechamento('2026-11', cartao)).toBe('2026-11-12')
    expect(dataDeVencimento('2026-11', cartao)).toBe('2026-11-20')
  })
})

describe('parcelasDaCompra', () => {
  it('à vista: uma parcela na fatura da compra', () => {
    expect(parcelasDaCompra(gasto('2026-11-05', 8000), cartao)).toEqual([{ fatura: '2026-11', valor: 8000 }])
  })

  it('em 3x: centavo a mais na primeira, uma por fatura', () => {
    expect(parcelasDaCompra(gasto('2026-11-20', 10000, 'credito', { parcelas: 3 }), cartao)).toEqual([
      { fatura: '2026-12', valor: 3334 },
      { fatura: '2027-01', valor: 3333 },
      { fatura: '2027-02', valor: 3333 },
    ])
  })
})

describe('contaNoTeto', () => {
  it('Pix, débito e dinheiro sempre gastam o teto', () => {
    expect(contaNoTeto(gasto('2026-11-05', 100, 'pix'), cartao)).toBe(true)
  })

  it('crédito a partir de regraDesde não gasta o teto', () => {
    expect(contaNoTeto(gasto('2026-11-05', 100), cartao)).toBe(false)
  })

  it('crédito antes de regraDesde, ou sem cartão, segue a regra anterior', () => {
    expect(contaNoTeto(gasto('2026-10-28', 100), cartao)).toBe(true)
    expect(contaNoTeto(gasto('2026-11-05', 100), undefined)).toBe(true)
  })
})

describe('fatura', () => {
  it('fatura conhecida de novembro: 80 + 10 (a compra de 28/out é da regra anterior)', () => {
    expect(faturaConhecida(compras, cartao, '2026-11')).toBe(9000)
  })

  it('fatura conhecida de dezembro: 50 + primeira parcela', () => {
    expect(faturaConhecida(compras, cartao, '2026-12')).toBe(8334)
  })

  it('aberta: entra o orçamento (estimada)', () => {
    expect(faturaDoPlano(compras, cartao, '2026-11', '2026-11-01')).toEqual({ valor: 30000, estimada: true })
    expect(faturaDoPlano(compras, cartao, '2026-12', '2026-11-25')).toEqual({ valor: 30000, estimada: true })
  })

  it('no dia do fechamento ainda está aberta; no dia seguinte, entra o valor real', () => {
    expect(faturaDoPlano(compras, cartao, '2026-11', '2026-11-12').estimada).toBe(true)
    expect(faturaDoPlano(compras, cartao, '2026-11', '2026-11-13')).toEqual({ valor: 9000, estimada: false })
  })

  it('aberta acima do orçamento: entra o que já se sabe', () => {
    const muito = [gasto('2026-11-05', 40000)]
    expect(faturaDoPlano(muito, cartao, '2026-11', '2026-11-06')).toEqual({ valor: 40000, estimada: true })
  })

  it('antes de regraDesde, ou sem cartão, não há fatura no plano', () => {
    expect(faturaDoPlano(compras, cartao, '2026-10', '2026-10-24')).toEqual({ valor: 0, estimada: false })
    expect(faturaDoPlano(compras, undefined, '2026-11', '2026-11-01')).toEqual({ valor: 0, estimada: false })
  })

  it('fatura no banco inclui a regra anterior e as contas no crédito (informativo)', () => {
    const claude: Conta = { id: 'claude', nome: 'Claude Pro', valor: 11600, tipo: 'recorrente', pagaNoCredito: true, ordem: 1 }
    expect(faturaNoBanco(compras, [claude], cartao, '2026-11')).toEqual({
      total: 9000 + 4000 + 11600,
      regraAnterior: 4000,
      contas: 11600,
    })
  })
})

describe('limite', () => {
  it('em 21/nov (fatura de novembro já vencida): 15000 usados, 31800 livres', () => {
    expect(limiteUsado(compras, [], cartao, '2026-11-21')).toBe(15000)
    expect(limiteLivre(compras, [], cartao, '2026-11-21')).toBe(31800)
  })

  it('em 15/nov: a compra parcelada de 20/nov ainda não existe', () => {
    expect(limiteUsado(compras, [], cartao, '2026-11-15')).toBe(4000 + 9000 + 5000)
    expect(limiteLivre(compras, [], cartao, '2026-11-15')).toBe(28800)
  })

  it('no dia do vencimento a fatura ainda ocupa o limite', () => {
    expect(limiteUsado([gasto('2026-11-05', 8000)], [], cartao, '2026-11-20')).toBe(8000)
    expect(limiteUsado([gasto('2026-11-05', 8000)], [], cartao, '2026-11-21')).toBe(0)
  })

  it('contas no crédito também ocupam o limite (regra mantida)', () => {
    const notebook: Conta = {
      id: 'notebook',
      nome: 'Notebook',
      valor: 39500,
      tipo: 'parcela',
      ultimaParcela: '2027-05',
      pagaNoCredito: true,
      ordem: 2,
    }
    expect(contasNoCredito([notebook], '2026-10')).toBe(8 * 39500)
    expect(limiteUsado([], [notebook], cartao, '2026-10-24')).toBe(8 * 39500)
  })
})

describe('gastoNoCredito', () => {
  it('soma as compras no crédito feitas no mês', () => {
    expect(gastoNoCredito(compras, '2026-11')).toBe(8000 + 1000 + 5000 + 10000)
  })
})

describe('plano e resumo com o cartão', () => {
  it('a fatura entra como conta fixa e tudo continua somando a renda', () => {
    const plano = calcularPlano({ renda: config.renda, reservaMinima: config.reservaMinima, contas: contasIniciais, categorias, mes: '2026-11', fatura: 30000 })
    expect(plano.fatura).toBe(30000)
    expect(plano.sobra).toBe(160600 - 84499 - 30000)
    // 34892 − 30000 ficaria abaixo da reserva mínima (5000): os flexíveis são apertados para protegê-la
    expect(plano.situacao).toBe('apertado')
    expect(plano.tetos).toEqual({ higiene: 10000, churrasco: 17937, lazer: 7972, roupas: 5190 })
    expect(plano.reserva).toBe(5002)
    const tetos = Object.values(plano.tetos).reduce((a, b) => a + b, 0)
    expect(plano.contasFixas + plano.fatura + tetos + plano.colchao + plano.reserva).toBe(plano.renda)
  })

  it('déficit por causa da fatura diz isso', () => {
    const plano = calcularPlano({ renda: 100000, reservaMinima: 0, contas: [], categorias: [], mes: '2026-11', fatura: 110000 })
    expect(plano.mensagens).toEqual([`As contas fixas e a fatura do cartão passam da renda em ${R$}100,00.`])
  })

  it('crédito não gasta o teto, mas aparece em noCredito (caso da seção 5.8)', () => {
    const plano = calcularPlano({ renda: config.renda, reservaMinima: config.reservaMinima, contas: contasIniciais, categorias, mes: '2026-11' })
    const resumo = resumoDoMes({
      plano,
      gastos: [gasto('2026-11-05', 12000, 'pix'), gasto('2026-11-06', 8000)],
      mes: '2026-11',
      hoje: '2026-11-10',
      cartao,
    })
    expect(resumo.categorias.find((c) => c.id === 'churrasco')).toEqual({
      id: 'churrasco',
      teto: 18000,
      gasto: 12000,
      restante: 6000,
      estado: 'ok',
      noCredito: 8000,
    })
    expect(resumo.gastoTotal).toBe(12000)
    expect(resumo.gastoNoCredito).toBe(8000)
  })
})

describe('avisoCompraNoCredito', () => {
  it('confirmação com a fatura e o limite livre', () => {
    expect(avisoCompraNoCredito({ valor: 3500, nomeDaFatura: 'novembro', fatura: 3500, cartao, livre: 27700 })).toEqual({
      tom: 'ok',
      texto: `No crédito: ${R$}35,00 na fatura de novembro. Limite livre: ${R$}277,00`,
    })
  })

  it('fatura a partir de 80% do orçamento', () => {
    expect(avisoCompraNoCredito({ valor: 3500, nomeDaFatura: 'novembro', fatura: 26000, cartao, livre: 10000 })).toEqual({
      tom: 'atencao',
      texto: `Fatura de novembro: ${R$}260,00 de ${R$}300,00 do orçamento`,
    })
  })

  it('passou do limite tem prioridade', () => {
    expect(avisoCompraNoCredito({ valor: 3500, nomeDaFatura: 'novembro', fatura: 50000, cartao, livre: -1200 })).toEqual({
      tom: 'atencao',
      texto: `Passou do limite do cartão em ${R$}12,00`,
    })
  })
})
