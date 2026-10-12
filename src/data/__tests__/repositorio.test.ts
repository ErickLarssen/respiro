import 'fake-indexeddb/auto' // IndexedDB de mentira, na memória, para rodar no Vitest
import { beforeEach, describe, expect, it } from 'vitest'
import { calcularPlano } from '../../domain/plano'
import { dadosIniciais } from '../dadosIniciais'
import {
  adicionarGasto,
  apagarCategoria,
  apagarGasto,
  apagarTudo,
  comecarDoZero,
  listarCategorias,
  listarContas,
  listarGastosDoMes,
  obterConfig,
  salvarConta,
  salvarGasto,
  substituirTudo,
} from '../repositorio'

beforeEach(async () => {
  await apagarTudo()
})

describe('primeiro uso', () => {
  it('começa sem config', async () => {
    expect(await obterConfig()).toBeNull()
  })

  it('"Começar com meus dados" carrega tudo e o plano de outubro dá R$ 51,92', async () => {
    await substituirTudo(dadosIniciais)

    const config = await obterConfig()
    const contas = await listarContas()
    const categorias = await listarCategorias()
    expect(config?.renda).toBe(160600)
    expect(contas).toHaveLength(9)
    expect(categorias).toHaveLength(4)

    const plano = calcularPlano({
      renda: config?.renda ?? 0,
      reservaMinima: config?.reservaMinima ?? 0,
      contas,
      categorias,
      mes: '2026-10',
    })
    expect(plano.reserva).toBe(5192)
  })

  it('"Começar do zero" cria só a config zerada', async () => {
    await substituirTudo(dadosIniciais)
    await comecarDoZero('2026-10-11')

    expect(await obterConfig()).toEqual({
      id: 'principal',
      renda: 0,
      diaUtilSalario: 5,
      reservaMinima: 0,
      criadoEm: '2026-10-11',
    })
    expect(await listarContas()).toEqual([])
    expect(await listarCategorias()).toEqual([])
  })
})

describe('contas e categorias', () => {
  it('lista as contas pela ordem, não pela ordem em que foram salvas', async () => {
    await salvarConta({ id: 'b', nome: 'B', valor: 100, tipo: 'recorrente', ordem: 2 })
    await salvarConta({ id: 'a', nome: 'A', valor: 100, tipo: 'recorrente', ordem: 1 })
    expect((await listarContas()).map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('apagar uma categoria mantém os gastos dela', async () => {
    await substituirTudo(dadosIniciais)
    await adicionarGasto({ data: '2026-10-11', valor: 3500, categoriaId: 'lazer', forma: 'pix' })
    await apagarCategoria('lazer')

    expect((await listarCategorias()).map((c) => c.id)).not.toContain('lazer')
    expect(await listarGastosDoMes('2026-10')).toHaveLength(1)
  })
})

describe('gastos', () => {
  it('gera id e horário de criação ao anotar', async () => {
    const gasto = await adicionarGasto({ data: '2026-10-11', valor: 3500, categoriaId: 'lazer', forma: 'pix' })
    expect(gasto.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(gasto.criadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('lista só os gastos do mês, do primeiro ao último dia', async () => {
    for (const data of ['2026-09-30', '2026-10-01', '2026-10-31', '2026-11-01']) {
      await adicionarGasto({ data, valor: 100, categoriaId: 'lazer', forma: 'pix' })
    }
    const datas = (await listarGastosDoMes('2026-10')).map((g) => g.data)
    expect(datas).toEqual(['2026-10-31', '2026-10-01'])
  })

  it('no mesmo dia, o anotado por último vem primeiro', async () => {
    const base = { data: '2026-10-11', valor: 100, categoriaId: 'lazer', forma: 'pix' } as const
    await salvarGasto({ ...base, id: 'antigo', criadoEm: '2026-10-11T10:00:00.000Z' })
    await salvarGasto({ ...base, id: 'novo', criadoEm: '2026-10-11T18:00:00.000Z' })
    expect((await listarGastosDoMes('2026-10')).map((g) => g.id)).toEqual(['novo', 'antigo'])
  })

  it('edita e apaga', async () => {
    const gasto = await adicionarGasto({ data: '2026-10-11', valor: 3500, categoriaId: 'lazer', forma: 'pix' })
    await salvarGasto({ ...gasto, valor: 4000 })
    expect((await listarGastosDoMes('2026-10'))[0]?.valor).toBe(4000)

    await apagarGasto(gasto.id)
    expect(await listarGastosDoMes('2026-10')).toEqual([])
  })
})
