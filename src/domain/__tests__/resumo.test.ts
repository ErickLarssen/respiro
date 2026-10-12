import { describe, expect, it } from 'vitest'
import { calcularPlano } from '../plano'
import { estadoDaCategoria, gastoPorCategoria, resumoDoMes } from '../resumo'
import type { Gasto } from '../tipos'
import { categorias, config, contas } from './dadosDeTeste'

const planoOutubro = calcularPlano({
  renda: config.renda,
  reservaMinima: config.reservaMinima,
  contas,
  categorias,
  mes: '2026-10',
})

let proximoId = 0
function gasto(data: string, valor: number, categoriaId: string): Gasto {
  proximoId++
  return { id: `g${proximoId}`, data, valor, categoriaId, forma: 'pix', criadoEm: `${data}T12:00:00.000Z` }
}

describe('gastoPorCategoria', () => {
  it('soma por categoria só os gastos do mês pedido', () => {
    const gastos = [
      gasto('2026-10-01', 1000, 'lazer'),
      gasto('2026-10-31', 2500, 'lazer'),
      gasto('2026-10-05', 700, 'higiene'),
      gasto('2026-11-01', 9999, 'lazer'),
      gasto('2026-09-30', 9999, 'lazer'),
    ]
    expect(gastoPorCategoria(gastos, '2026-10')).toEqual({ lazer: 3500, higiene: 700 })
  })
})

describe('estadoDaCategoria', () => {
  it('ok abaixo de 80% do teto', () => {
    expect(estadoDaCategoria(10000, 7999)).toBe('ok')
  })

  it('atenção de 80% a 100%', () => {
    expect(estadoDaCategoria(10000, 8000)).toBe('atencao')
    expect(estadoDaCategoria(10000, 10000)).toBe('atencao')
  })

  it('estourou acima de 100%', () => {
    expect(estadoDaCategoria(10000, 10001)).toBe('estourou')
  })

  it('teto 0 com gasto é estourou; sem gasto é ok', () => {
    expect(estadoDaCategoria(0, 1)).toBe('estourou')
    expect(estadoDaCategoria(0, 0)).toBe('ok')
  })
})

describe('resumoDoMes', () => {
  it('caso da seção 4: outubro, hoje 11/10, Lazer 3500', () => {
    const resumo = resumoDoMes({
      plano: planoOutubro,
      gastos: [gasto('2026-10-11', 3500, 'lazer')],
      mes: '2026-10',
      hoje: '2026-10-11',
    })
    expect(resumo.tetoTotal).toBe(41209)
    expect(resumo.gastoTotal).toBe(3500)
    expect(resumo.restante).toBe(37709)
    expect(resumo.diasRestantes).toBe(21)
    expect(resumo.porDia).toBe(1795)

    const lazer = resumo.categorias.find((c) => c.id === 'lazer')
    expect(lazer).toEqual({ id: 'lazer', teto: 8000, gasto: 3500, restante: 4500, estado: 'ok' })
  })

  it('lista as categorias na ordem do plano', () => {
    const resumo = resumoDoMes({ plano: planoOutubro, gastos: [], mes: '2026-10', hoje: '2026-10-11' })
    expect(resumo.categorias.map((c) => c.id)).toEqual(['higiene', 'churrasco', 'lazer', 'roupas'])
  })

  it('junta "fora do plano" e categoria apagada numa linha extra no fim', () => {
    const resumo = resumoDoMes({
      plano: planoOutubro,
      gastos: [gasto('2026-10-02', 1500, 'fora'), gasto('2026-10-03', 500, 'categoria-apagada')],
      mes: '2026-10',
      hoje: '2026-10-11',
    })
    expect(resumo.categorias.at(-1)).toEqual({
      id: 'fora',
      teto: 0,
      gasto: 2000,
      restante: -2000,
      estado: 'estourou',
    })
    expect(resumo.gastoTotal).toBe(2000)
    expect(resumo.restante).toBe(41209 - 2000)
  })

  it('sem gastos fora do plano, não há linha extra', () => {
    const resumo = resumoDoMes({ plano: planoOutubro, gastos: [], mes: '2026-10', hoje: '2026-10-11' })
    expect(resumo.categorias).toHaveLength(4)
  })

  it('restante pode ficar negativo; o valor por dia fica 0', () => {
    const resumo = resumoDoMes({
      plano: planoOutubro,
      gastos: [gasto('2026-10-05', 50000, 'churrasco')],
      mes: '2026-10',
      hoje: '2026-10-11',
    })
    expect(resumo.restante).toBe(41209 - 50000)
    expect(resumo.porDia).toBe(0)
  })

  it('no último dia do mês, sobra 1 dia', () => {
    const resumo = resumoDoMes({ plano: planoOutubro, gastos: [], mes: '2026-10', hoje: '2026-10-31' })
    expect(resumo.diasRestantes).toBe(1)
    expect(resumo.porDia).toBe(41209)
  })

  it('em outro mês, não calcula valor por dia', () => {
    const resumo = resumoDoMes({ plano: planoOutubro, gastos: [], mes: '2026-10', hoje: '2026-11-03' })
    expect(resumo.porDia).toBeNull()
    expect(resumo.diasRestantes).toBeNull()
  })
})
