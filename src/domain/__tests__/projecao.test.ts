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
    expect(meses[0]).toEqual({ mes: '2026-10', contasFixas: 114199, reserva: 5192, acumulado: 5192 })
    expect(meses[1]).toEqual({ mes: '2026-11', contasFixas: 84499, reserva: 34892, acumulado: 40084 })
    expect(meses[8]).toMatchObject({ mes: '2027-06', reserva: 77592 })
  })

  it('aceita outro número de meses', () => {
    expect(projecao(config, contas, categorias, '2026-10', 3)).toHaveLength(3)
  })
})
