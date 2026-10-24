import { describe, expect, it } from 'vitest'
import { incluirCategoriaNosPlanos, planejamentoDoMes, planejamentoInicial } from '../planejamento'
import type { MesPlanejado } from '../tipos'
import { categorias } from './dadosDeTeste'

const outubro: MesPlanejado = {
  mes: '2026-10',
  desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 },
  colchao: 0,
}
const dezembro: MesPlanejado = {
  mes: '2026-12',
  desejos: { higiene: 12000, churrasco: 25000, lazer: 15000, roupas: 0 },
  colchao: 5000,
}

describe('planejamentoDoMes', () => {
  it('usa o plano do próprio mês', () => {
    expect(planejamentoDoMes([outubro, dezembro], categorias, '2026-12')).toEqual({
      desejos: dezembro.desejos,
      colchao: 5000,
      origem: '2026-12',
    })
  })

  it('mês sem plano copia o último mês planejado antes dele', () => {
    expect(planejamentoDoMes([outubro, dezembro], categorias, '2026-11').origem).toBe('2026-10')
    const marco = planejamentoDoMes([outubro, dezembro], categorias, '2027-03')
    expect(marco.origem).toBe('2026-12')
    expect(marco.colchao).toBe(5000)
    expect(marco.desejos.churrasco).toBe(25000)
  })

  it('não depende da ordem da lista', () => {
    expect(planejamentoDoMes([dezembro, outubro], categorias, '2027-01').origem).toBe('2026-12')
  })

  it('antes de qualquer plano salvo, usa os valores das categorias', () => {
    expect(planejamentoDoMes([outubro], categorias, '2026-09')).toEqual({
      desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 },
      colchao: 0,
      origem: null,
    })
  })

  it('categoria que não estava no plano do mês fica com 0', () => {
    const semLazer: MesPlanejado = { mes: '2026-11', desejos: { higiene: 10000 }, colchao: 0 }
    expect(planejamentoDoMes([semLazer], categorias, '2026-11').desejos).toEqual({
      higiene: 10000,
      churrasco: 0,
      lazer: 0,
      roupas: 0,
    })
  })
})

describe('planejamentoInicial', () => {
  it('transforma os valores das categorias no plano do mês', () => {
    expect(planejamentoInicial(categorias, '2026-10')).toEqual(outubro)
  })
})

describe('incluirCategoriaNosPlanos', () => {
  const nova = { id: 'presentes', desejo: 20000 }

  it('entra no plano do mês e dos meses seguintes, não dos anteriores', () => {
    const resultado = incluirCategoriaNosPlanos([outubro, dezembro], categorias, nova, '2026-12')
    expect(resultado).toEqual([{ ...dezembro, desejos: { ...dezembro.desejos, presentes: 20000 } }])
  })

  it('cria o plano do mês a partir do que valia nele, se ele ainda não existia', () => {
    const resultado = incluirCategoriaNosPlanos([outubro, dezembro], categorias, nova, '2026-11')
    expect(resultado).toEqual([
      { mes: '2026-11', desejos: { ...outubro.desejos, presentes: 20000 }, colchao: 0 },
      { ...dezembro, desejos: { ...dezembro.desejos, presentes: 20000 } },
    ])
  })
})
