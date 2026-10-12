import { describe, expect, it } from 'vitest'
import {
  contaAtivaNoMes,
  parcelasRestantes,
  totalContasFixas,
  ultimaParcelaPorRestantes,
} from '../contas'
import { conta, contas } from './dadosDeTeste'

describe('contaAtivaNoMes', () => {
  it('recorrente está sempre ativa', () => {
    expect(contaAtivaNoMes(conta('internet'), '2030-01')).toBe(true)
  })

  it('parcela está ativa até a última parcela, inclusive', () => {
    expect(contaAtivaNoMes(conta('notebook'), '2027-05')).toBe(true)
    expect(contaAtivaNoMes(conta('notebook'), '2027-06')).toBe(false)
  })
})

describe('totalContasFixas', () => {
  it.each([
    ['2026-10', 114199], // todas ativas, inclusive a fatura de setembro
    ['2026-11', 84499], // acabaram o Facio e a fatura de setembro
    ['2026-12', 81299], // acabou o perfume
    ['2027-05', 81299], // última parcela do notebook
    ['2027-06', 41799], // sem o notebook; última da Shopee
    ['2027-07', 36999], // só recorrentes
  ])('%s → %i', (mes, esperado) => {
    expect(totalContasFixas(contas, mes)).toBe(esperado)
  })

  it('lista vazia soma zero', () => {
    expect(totalContasFixas([], '2026-10')).toBe(0)
  })
})

describe('parcelasRestantes', () => {
  it('conta a parcela do mês atual', () => {
    expect(parcelasRestantes(conta('notebook'), '2026-10')).toBe(8)
    expect(parcelasRestantes(conta('facio'), '2026-10')).toBe(1)
  })

  it('é zero depois da última parcela', () => {
    expect(parcelasRestantes(conta('facio'), '2026-11')).toBe(0)
  })

  it('recorrente não tem parcelas', () => {
    expect(parcelasRestantes(conta('internet'), '2026-10')).toBeNull()
  })
})

describe('ultimaParcelaPorRestantes', () => {
  it('converte parcelas restantes no mês da última', () => {
    expect(ultimaParcelaPorRestantes('2026-10', 8)).toBe('2027-05')
    expect(ultimaParcelaPorRestantes('2026-10', 1)).toBe('2026-10')
  })

  it('é o inverso de parcelasRestantes', () => {
    const ultima = ultimaParcelaPorRestantes('2026-10', 5)
    const parcela = { ...conta('perfume'), ultimaParcela: ultima }
    expect(parcelasRestantes(parcela, '2026-10')).toBe(5)
  })
})
