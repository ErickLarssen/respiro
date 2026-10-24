import { describe, expect, it } from 'vitest'
import { projecao } from '../projecao'
import { categorias, config, contas } from './dadosDeTeste'

describe('projecao', () => {
  const meses = projecao(config, contas, categorias, '2026-10')

  it('tem 12 meses, de outubro/2026 a setembro/2027', () => {
    expect(meses).toHaveLength(12)
    expect(meses[0]?.mes).toBe('2026-10')
    expect(meses[11]?.mes).toBe('2027-09')
  })

  it('acumula 593404 em 12 meses (caso da seção 6)', () => {
    expect(meses.at(-1)?.acumulado).toBe(593404)
  })

  it('cada mês usa o plano daquele mês', () => {
    expect(meses[0]).toMatchObject({ mes: '2026-10', contasFixas: 114199, reserva: 5192, acumulado: 5192 })
    expect(meses[1]).toMatchObject({ mes: '2026-11', contasFixas: 84499, reserva: 34892, acumulado: 40084 })
    expect(meses[8]).toMatchObject({ mes: '2027-06', reserva: 77592 })
  })

  it('aceita outro número de meses', () => {
    expect(projecao(config, contas, categorias, '2026-10', 3)).toHaveLength(3)
  })
})

describe('projecao com plano por mês e colchão', () => {
  const planejados = [
    { mes: '2026-10', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 0 },
    { mes: '2026-11', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 5000 },
  ]
  const comMeta = { ...config, metaColchao: 12000 }

  it('a reserva cai enquanto o colchão enche e volta quando ele bate a meta', () => {
    const meses = projecao(comMeta, contas, categorias, '2026-10', 5, { planejados })
    expect(meses.map((m) => [m.mes, m.reserva, m.colchao, m.saldoColchao])).toEqual([
      ['2026-10', 5192, 0, 0],
      ['2026-11', 29892, 5000, 5000],
      ['2026-12', 33092, 5000, 10000],
      ['2027-01', 36092, 2000, 12000],
      ['2027-02', 38092, 0, 12000],
    ])
  })

  it('começando depois do início, o saldo do colchão já vem dos meses anteriores', () => {
    const meses = projecao(comMeta, contas, categorias, '2027-01', 2, { planejados })
    expect(meses.map((m) => [m.mes, m.colchao, m.saldoColchao, m.acumulado])).toEqual([
      ['2027-01', 2000, 12000, 36092],
      ['2027-02', 0, 12000, 36092 + 38092],
    ])
  })

  it('o plano salvo de um mês muda a reserva daquele mês em diante', () => {
    const comDezembro = [...planejados, { mes: '2026-12', desejos: { higiene: 10000, churrasco: 30000, lazer: 8000, roupas: 5209 }, colchao: 5000 }]
    const meses = projecao(comMeta, contas, categorias, '2026-12', 2, { planejados: comDezembro })
    // Churrasco de 180,00 para 300,00: 120,00 a menos na reserva de dezembro e de janeiro
    expect(meses.map((m) => m.reserva)).toEqual([33092 - 12000, 36092 - 12000])
  })
})

describe('projecao com a fatura do cartão', () => {
  it('a fatura de cada mês sai da reserva daquele mês', () => {
    const faturas = { '2026-11': 9000, '2026-12': 30000 }
    const meses = projecao(config, contas, categorias, '2026-10', 3, { faturas })
    expect(meses.map((m) => [m.mes, m.fatura, m.reserva])).toEqual([
      ['2026-10', 0, 5192],
      ['2026-11', 9000, 34892 - 9000],
      ['2026-12', 30000, 38092 - 30000],
    ])
  })
})
