import { describe, expect, it } from 'vitest'
import { aSepararNoColchao, fraseExcessoDoPlano, gastosPorMes, simularMeses } from '../colchao'
import type { Config, Gasto, MesPlanejado } from '../tipos'
import { categorias, config, contas } from './dadosDeTeste'

const R$ = 'R$ '

// Outubro sem colchão (o plano de quando o app começou); de novembro em diante, R$ 50 por mês.
const planejados: MesPlanejado[] = [
  { mes: '2026-10', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 0 },
  { mes: '2026-11', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 5000 },
]

function simular(meta: number, gastos: Record<string, number> = {}, ate = '2027-02') {
  const comMeta: Config = { ...config, metaColchao: meta }
  return simularMeses({ config: comMeta, contas, categorias, planejados, gastosPorMes: gastos, de: '2026-10', ate })
}

describe('aSepararNoColchao', () => {
  it('separa o valor do mês enquanto não chega na meta', () => {
    expect(aSepararNoColchao(5000, 30000, 0)).toBe(5000)
  })

  it('separa só o que falta para a meta', () => {
    expect(aSepararNoColchao(5000, 12000, 10000)).toBe(2000)
  })

  it('com a meta batida (ou sem meta), não separa nada', () => {
    expect(aSepararNoColchao(5000, 12000, 12000)).toBe(0)
    expect(aSepararNoColchao(5000, 0, 0)).toBe(0)
  })
})

describe('gastosPorMes', () => {
  it('soma os gastos de cada mês', () => {
    const gasto = (data: string, valor: number): Gasto => ({
      id: data + valor,
      data,
      valor,
      categoriaId: 'lazer',
      forma: 'pix',
      criadoEm: data,
    })
    expect(gastosPorMes([gasto('2026-10-05', 100), gasto('2026-10-20', 50), gasto('2026-11-01', 7)])).toEqual({
      '2026-10': 150,
      '2026-11': 7,
    })
  })
})

describe('simularMeses', () => {
  it('acumula o colchão mês a mês e para ao bater a meta (meta R$ 120)', () => {
    const meses = simular(12000)
    expect(meses.map((m) => [m.mes, m.colchao.separado, m.colchao.saldoFinal, m.plano.reserva])).toEqual([
      ['2026-10', 0, 0, 5192], // outubro: sem colchão no plano
      ['2026-11', 5000, 5000, 29892], // 34892 − 5000
      ['2026-12', 5000, 10000, 33092], // 38092 − 5000
      ['2027-01', 2000, 12000, 36092], // só faltavam 2000 para a meta
      ['2027-02', 0, 12000, 38092], // meta batida: o dinheiro volta para a reserva
    ])
  })

  it('sem meta, não há colchão', () => {
    const meses = simular(0)
    expect(meses.every((m) => m.colchao.separado === 0 && m.colchao.saldoFinal === 0)).toBe(true)
    expect(meses[1]?.plano.reserva).toBe(34892)
  })

  it('o excesso sobre os tetos sai do colchão', () => {
    // Novembro: gastou 432,09, ou seja, 20,00 além dos 412,09 de tetos
    const meses = simular(30000, { '2026-11': 41209 + 2000 })
    const novembro = meses[1]
    expect(novembro?.excesso).toBe(2000)
    expect(novembro?.colchao).toEqual({ saldoInicial: 0, separado: 5000, usado: 2000, saldoFinal: 3000 })
    // Dezembro parte de 3000 e separa mais 5000
    expect(meses[2]?.colchao).toEqual({ saldoInicial: 3000, separado: 5000, usado: 0, saldoFinal: 8000 })
  })

  it('o colchão cobre até o que tem; o resto sai da reserva', () => {
    const meses = simular(30000, { '2026-11': 41209 + 7000 })
    expect(meses[1]?.colchao).toEqual({ saldoInicial: 0, separado: 5000, usado: 5000, saldoFinal: 0 })
  })

  it('gastar abaixo dos tetos não mexe no colchão', () => {
    const meses = simular(30000, { '2026-11': 20000 })
    expect(meses[1]?.colchao.usado).toBe(0)
    expect(meses[1]?.excesso).toBe(0)
  })
})

describe('fraseExcessoDoPlano', () => {
  it('sem colchão, sai da reserva (texto de sempre)', () => {
    const semColchao = { saldoInicial: 0, separado: 0, usado: 0, saldoFinal: 0 }
    expect(fraseExcessoDoPlano(2000, semColchao)).toBe(
      `Você passou do plano em ${R$}20,00. Isso sai da reserva deste mês.`,
    )
  })

  it('colchão cobre tudo', () => {
    expect(fraseExcessoDoPlano(2000, { saldoInicial: 0, separado: 5000, usado: 2000, saldoFinal: 3000 })).toBe(
      `Você passou do plano em ${R$}20,00. Isso sai do colchão, que fica com ${R$}30,00.`,
    )
  })

  it('colchão cobre uma parte e o resto sai da reserva', () => {
    expect(fraseExcessoDoPlano(7000, { saldoInicial: 0, separado: 5000, usado: 5000, saldoFinal: 0 })).toBe(
      `Você passou do plano em ${R$}70,00: ${R$}50,00 saem do colchão e ${R$}20,00 da reserva deste mês.`,
    )
  })
})
