import { describe, expect, it } from 'vitest'
import dadosDoJson from '../../../docs/dados-iniciais.json'
import { lerBackup, montarBackup, nomeDoArquivo, resumoDoBackup, validarBackup } from '../backup'
import { dadosIniciais } from '../dadosIniciais'

const gasto = {
  id: 'g1',
  data: '2026-10-11',
  valor: 3500,
  categoriaId: 'lazer',
  forma: 'credito',
  criadoEm: '2026-10-11T12:00:00.000Z',
}

describe('montarBackup e nomeDoArquivo', () => {
  it('põe a versão no backup', () => {
    expect(montarBackup(dadosIniciais).versao).toBe(3)
  })

  it('nomeia o arquivo com a data', () => {
    expect(nomeDoArquivo('2026-10-12')).toBe('respiro-backup-2026-10-12.json')
  })
})

describe('resumoDoBackup', () => {
  it('conta contas, categorias e gastos', () => {
    expect(resumoDoBackup(dadosIniciais)).toBe('9 contas, 4 categorias, 0 gastos')
  })

  it('usa singular quando é um só', () => {
    expect(resumoDoBackup({ ...dadosIniciais, contas: [], categorias: dadosIniciais.categorias.slice(0, 1) })).toBe(
      '0 contas, 1 categoria, 0 gastos',
    )
  })
})

describe('validarBackup', () => {
  it('aceita um backup exportado pelo app (ida e volta)', () => {
    const exportado = JSON.parse(JSON.stringify(montarBackup({ ...dadosIniciais, gastos: [gasto] as never })))
    const resultado = validarBackup(exportado, '2026-10')
    expect(resultado).toEqual({ ok: true, dados: { ...dadosIniciais, gastos: [gasto] } })
  })

  it('aceita o próprio docs/dados-iniciais.json (que tem versão 1)', () => {
    expect(validarBackup(dadosDoJson, '2026-10').ok).toBe(true)
  })

  it('descarta campos desconhecidos', () => {
    const resultado = validarBackup({ ...dadosDoJson, gastos: [{ ...gasto, campoEstranho: 'x' }] }, '2026-10')
    expect(resultado.ok && resultado.dados.gastos[0]).toEqual(gasto)
  })

  it('recusa arquivo que não é backup', () => {
    expect(validarBackup([1, 2, 3], '2026-10')).toEqual({ ok: false, erro: 'Este arquivo não é um backup do Respiro.' })
    expect(validarBackup(null, '2026-10').ok).toBe(false)
  })

  it('recusa versão desconhecida', () => {
    expect(validarBackup({ ...dadosDoJson, versao: 4 }, '2026-10')).toEqual({
      ok: false,
      erro: 'Este backup é de uma versão que o app não conhece.',
    })
  })

  it('recusa valor com casas decimais (dinheiro é sempre em centavos)', () => {
    const quebrado = { ...dadosDoJson, gastos: [{ ...gasto, valor: 35.5 }] }
    expect(validarBackup(quebrado, '2026-10')).toEqual({ ok: false, erro: 'Gasto 1: "valor" precisa ser um valor em centavos.' })
  })

  it('recusa parcela sem última parcela', () => {
    const contas = [{ id: 'x', nome: 'X', valor: 100, tipo: 'parcela', ordem: 1 }]
    const resultado = validarBackup({ ...dadosDoJson, contas }, '2026-10')
    expect(resultado).toEqual({ ok: false, erro: 'Conta 1: falta o campo "ultimaParcela".' })
  })

  it('recusa forma de pagamento desconhecida', () => {
    const resultado = validarBackup({ ...dadosDoJson, gastos: [{ ...gasto, forma: 'boleto' }] }, '2026-10')
    expect(resultado).toEqual({ ok: false, erro: 'Gasto 1: forma de pagamento desconhecida.' })
  })

  it('recusa quando falta uma lista', () => {
    const semCategorias: Record<string, unknown> = { ...dadosDoJson }
    delete semCategorias.categorias
    expect(validarBackup(semCategorias, '2026-10')).toEqual({ ok: false, erro: 'O arquivo não tem a lista de categorias.' })
  })
})

describe('lerBackup', () => {
  it('lê o texto do arquivo', () => {
    expect(lerBackup(JSON.stringify(dadosDoJson), '2026-10').ok).toBe(true)
  })

  it('JSON quebrado vira erro amigável', () => {
    expect(lerBackup('{ isto não é json', '2026-10')).toEqual({
      ok: false,
      erro: 'Não deu para ler o arquivo. Escolha um backup .json do Respiro.',
    })
  })
})

describe('backup versão 2 (plano por mês e colchão)', () => {
  const plano = { mes: '2026-11', desejos: { higiene: 10000, churrasco: 25000 }, colchao: 5000 }

  it('backup da versão 1 ganha o plano do primeiro mês, com os valores das categorias', () => {
    const resultado = validarBackup(dadosDoJson, '2026-10') // docs/dados-iniciais.json é versão 1
    expect(resultado.ok && resultado.dados.planosDoMes).toEqual([
      { mes: '2026-10', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 0 },
    ])
  })

  it('lê os planos de cada mês e a meta do colchão', () => {
    const bruto = {
      ...dadosDoJson,
      versao: 2,
      config: { ...dadosDoJson.config, metaColchao: 30000 },
      planosDoMes: [plano],
    }
    const resultado = validarBackup(bruto, '2026-10')
    expect(resultado.ok && resultado.dados.planosDoMes).toEqual([plano])
    expect(resultado.ok && resultado.dados.config.metaColchao).toBe(30000)
  })

  it('versão 2 precisa da lista de planos', () => {
    expect(validarBackup({ ...dadosDoJson, versao: 2 }, '2026-10')).toEqual({
      ok: false,
      erro: 'O arquivo não tem a lista de planos dos meses.',
    })
  })

  it('recusa valor de categoria com casas decimais no plano do mês', () => {
    const quebrado = { ...dadosDoJson, versao: 2, planosDoMes: [{ ...plano, desejos: { higiene: 100.5 } }] }
    expect(validarBackup(quebrado, '2026-10')).toEqual({
      ok: false,
      erro: 'Plano do mês 1: "higiene" precisa ser um valor em centavos.',
    })
  })
})

describe('backup versão 3 (cartão de crédito)', () => {
  const cartao = { limite: 46800, diaFechamento: 12, diaVencimento: 20, orcamento: 30000, regraDesde: '2026-11' }

  it('lê o cartão e as parcelas das compras no crédito', () => {
    const bruto = {
      ...dadosDoJson,
      versao: 3,
      config: { ...dadosDoJson.config, cartao },
      planosDoMes: [],
      gastos: [{ ...gasto, parcelas: 3 }],
    }
    const resultado = validarBackup(bruto, '2026-10')
    expect(resultado.ok && resultado.dados.config.cartao).toEqual(cartao)
    expect(resultado.ok && resultado.dados.gastos[0]?.parcelas).toBe(3)
  })

  it('o limite de backups antigos vira o cartão, com a regra a partir do mês seguinte', () => {
    const antigo = { ...dadosDoJson, config: { ...dadosDoJson.config, limiteCartao: 46800 } }
    const resultado = validarBackup(antigo, '2026-10')
    expect(resultado.ok && resultado.dados.config.cartao).toEqual({ ...cartao, orcamento: 46800 })
    expect(resultado.ok && 'limiteCartao' in resultado.dados.config).toBe(false)
  })

  it('recusa dia de fechamento fora de 1 a 28', () => {
    const bruto = { ...dadosDoJson, versao: 3, planosDoMes: [], config: { ...dadosDoJson.config, cartao: { ...cartao, diaFechamento: 31 } } }
    expect(validarBackup(bruto, '2026-10')).toEqual({ ok: false, erro: 'Cartão: "diaFechamento" precisa ser um dia de 1 a 28.' })
  })

  it('recusa parcelas fora de 1 a 12', () => {
    const bruto = { ...dadosDoJson, versao: 3, planosDoMes: [], gastos: [{ ...gasto, parcelas: 30 }] }
    expect(validarBackup(bruto, '2026-10')).toEqual({ ok: false, erro: 'Gasto 1: "parcelas" precisa ser de 1 a 12.' })
  })
})
