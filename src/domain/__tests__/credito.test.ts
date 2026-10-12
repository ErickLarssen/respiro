import { describe, expect, it } from 'vitest'
import { contasNoCredito, gastoNoCredito, limiteLivre } from '../credito'
import type { Conta, FormaPagamento, Gasto } from '../tipos'

function gasto(data: string, valor: number, forma: FormaPagamento): Gasto {
  return { id: `${data}-${valor}-${forma}`, data, valor, categoriaId: 'lazer', forma, criadoEm: `${data}T12:00:00Z` }
}

const claudePro: Conta = { id: 'claude', nome: 'Claude Pro', valor: 11600, tipo: 'recorrente', pagaNoCredito: true, ordem: 1 }
const notebook: Conta = {
  id: 'notebook',
  nome: 'Notebook',
  valor: 39500,
  tipo: 'parcela',
  ultimaParcela: '2027-05',
  pagaNoCredito: true,
  ordem: 2,
}
const luz: Conta = { id: 'luz', nome: 'Luz', valor: 15000, tipo: 'recorrente', ordem: 3 } // não é no crédito

describe('gastoNoCredito', () => {
  it('soma só as compras no crédito do mês', () => {
    const gastos = [
      gasto('2026-10-05', 3500, 'credito'),
      gasto('2026-10-20', 1500, 'credito'),
      gasto('2026-10-06', 9999, 'pix'),
      gasto('2026-11-01', 9999, 'credito'),
    ]
    expect(gastoNoCredito(gastos, '2026-10')).toBe(5000)
  })

  it('sem compras no crédito, é zero', () => {
    expect(gastoNoCredito([], '2026-10')).toBe(0)
  })
})

describe('contasNoCredito', () => {
  it('parcela no crédito ocupa todas as parcelas que faltam', () => {
    // Outubro/2026: faltam 8 parcelas do notebook (out a mai) → 8 × 395,00
    expect(contasNoCredito([notebook], '2026-10')).toBe(8 * 39500)
    expect(contasNoCredito([notebook], '2027-05')).toBe(39500)
    expect(contasNoCredito([notebook], '2027-06')).toBe(0)
  })

  it('recorrente no crédito ocupa só a cobrança do mês', () => {
    expect(contasNoCredito([claudePro], '2026-10')).toBe(11600)
  })

  it('ignora contas que não são pagas no crédito', () => {
    expect(contasNoCredito([luz], '2026-10')).toBe(0)
  })
})

describe('limiteLivre', () => {
  it('desconta compras do mês e contas no crédito', () => {
    const livre = limiteLivre({
      limite: 500000,
      gastos: [gasto('2026-10-05', 3500, 'credito'), gasto('2026-10-06', 2000, 'pix')],
      contas: [claudePro, notebook, luz],
      mes: '2026-10',
    })
    // 5000,00 − 35,00 − 116,00 − 8 × 395,00
    expect(livre).toBe(500000 - 3500 - 11600 - 316000)
  })

  it('pode ficar negativo quando o limite estoura', () => {
    expect(limiteLivre({ limite: 10000, gastos: [], contas: [claudePro], mes: '2026-10' })).toBe(-1600)
  })
})
