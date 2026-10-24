import 'fake-indexeddb/auto' // IndexedDB de mentira, na memória, para rodar no Vitest
import { beforeEach, describe, expect, it } from 'vitest'
import { calcularPlano } from '../../domain/plano'
import { dadosIniciais } from '../dadosIniciais'
import {
  adicionarCategoriaNoPlano,
  adicionarGasto,
  apagarCategoria,
  apagarGasto,
  apagarMesPlanejado,
  apagarTudo,
  comecarDoZero,
  lerTudo,
  listarCategorias,
  listarContas,
  listarGastosDoMes,
  listarGastosEntre,
  listarPlanosDoMes,
  obterConfig,
  salvarConta,
  salvarGasto,
  salvarMesPlanejado,
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

describe('lerTudo', () => {
  it('devolve tudo o que está salvo, gastos por data', async () => {
    await substituirTudo(dadosIniciais)
    await adicionarGasto({ data: '2026-10-20', valor: 100, categoriaId: 'lazer', forma: 'pix' })
    await adicionarGasto({ data: '2026-10-02', valor: 200, categoriaId: 'lazer', forma: 'pix' })
    const tudo = await lerTudo()
    expect(tudo.config.renda).toBe(160600)
    expect(tudo.contas).toHaveLength(9)
    expect(tudo.gastos.map((g) => g.data)).toEqual(['2026-10-02', '2026-10-20'])
  })

  it('sem config, não há o que exportar', async () => {
    await expect(lerTudo()).rejects.toThrow('Ainda não há dados para exportar.')
  })
})

describe('plano de cada mês', () => {
  it('"Começar com meus dados" já cria o plano de outubro', async () => {
    await substituirTudo(dadosIniciais)
    expect(await listarPlanosDoMes()).toEqual([
      { mes: '2026-10', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 0 },
    ])
  })

  it('salva e apaga o plano de um mês', async () => {
    await substituirTudo(dadosIniciais)
    await salvarMesPlanejado({ mes: '2026-12', desejos: { churrasco: 30000 }, colchao: 5000 })
    expect((await listarPlanosDoMes()).map((p) => p.mes)).toEqual(['2026-10', '2026-12'])
    await apagarMesPlanejado('2026-12')
    expect((await listarPlanosDoMes()).map((p) => p.mes)).toEqual(['2026-10'])
  })

  it('categoria nova entra no plano a partir do mês escolhido, não antes', async () => {
    await substituirTudo(dadosIniciais)
    const presentes = { id: 'presentes', nome: 'Presentes', desejo: 999, essencial: false, cor: 'c5', ordem: 5 } as const
    await adicionarCategoriaNoPlano(presentes, 20000, '2026-12')

    const planos = await listarPlanosDoMes()
    expect(planos.map((p) => [p.mes, p.desejos.presentes])).toEqual([
      ['2026-10', undefined], // outubro não muda
      ['2026-12', 20000], // dezembro ganha um plano próprio, com a categoria nova
    ])
    // A categoria fica com desejo 0: meses sem plano salvo (antes de outubro) não ganham esse gasto
    expect((await listarCategorias()).find((c) => c.id === 'presentes')?.desejo).toBe(0)
  })

  it('o backup lê e devolve os planos', async () => {
    await substituirTudo(dadosIniciais)
    await salvarMesPlanejado({ mes: '2026-11', desejos: { lazer: 12000 }, colchao: 3000 })
    expect((await lerTudo()).planosDoMes.map((p) => p.mes)).toEqual(['2026-10', '2026-11'])
  })

  it('lista os gastos de um período', async () => {
    for (const data of ['2026-09-30', '2026-10-01', '2026-11-15', '2026-12-01']) {
      await adicionarGasto({ data, valor: 100, categoriaId: 'lazer', forma: 'pix' })
    }
    const gastos = await listarGastosEntre('2026-10-01', '2026-11-30')
    expect(gastos.map((g) => g.data).sort()).toEqual(['2026-10-01', '2026-11-15'])
  })
})
