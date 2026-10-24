import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { mesDaData, somarMeses } from '../../domain/datas'
import { dadosIniciais } from '../dadosIniciais'
import { hojeNoAparelho } from '../relogio'

// Simula o celular de quem já usava o app: um banco na versão 1 (sem planosDoMes,
// com o antigo limiteCartao). Ao abrir com o código novo, as migrações rodam em
// sequência (1 → 2 → 3): o plano do primeiro mês aparece com os valores que as
// categorias tinham, o limite vira o cartão, e nada mais pode mudar.

describe('migração do banco da versão 1 até a atual', () => {
  it('cria o plano do mês de início, converte o limite no cartão e mantém o resto', async () => {
    const antigo = new Dexie('respiro')
    antigo.version(1).stores({
      config: 'id',
      contas: 'id, ordem',
      categorias: 'id, ordem',
      gastos: 'id, data, categoriaId',
    })
    await antigo.table('config').put({ ...dadosIniciais.config, limiteCartao: 46800 })
    await antigo.table('contas').bulkPut(dadosIniciais.contas)
    await antigo.table('categorias').bulkPut(dadosIniciais.categorias)
    await antigo
      .table('gastos')
      .put({ id: 'g1', data: '2026-10-20', valor: 3500, categoriaId: 'lazer', forma: 'pix', criadoEm: '2026-10-20T10:00:00Z' })
    antigo.close()

    // Importa o banco novo só agora, depois de o antigo existir (como no celular)
    const { listarPlanosDoMes, lerTudo, obterConfig } = await import('../repositorio')
    expect(await listarPlanosDoMes()).toEqual([
      { mes: '2026-10', desejos: { higiene: 10000, churrasco: 18000, lazer: 8000, roupas: 5209 }, colchao: 0 },
    ])
    const config = await obterConfig()
    expect(config?.cartao).toEqual({
      limite: 46800,
      diaFechamento: 12,
      diaVencimento: 20,
      orcamento: 46800,
      regraDesde: somarMeses(mesDaData(hojeNoAparelho()), 1), // compras deste mês seguem a regra anterior
    })
    expect(config && 'limiteCartao' in config).toBe(false)

    const tudo = await lerTudo()
    expect(tudo.contas).toHaveLength(9)
    expect(tudo.categorias).toHaveLength(4)
    expect(tudo.gastos.map((g) => g.id)).toEqual(['g1'])
  })
})
