import Dexie, { type EntityTable } from 'dexie'
import { mesDeInicio } from '../domain/colchao'
import { planejamentoInicial } from '../domain/planejamento'
import type { Categoria, Config, Conta, Gasto, MesPlanejado } from '../domain/tipos'

// O banco de dados do aparelho (IndexedDB, via Dexie). Schema: docs/04-modelo-de-dados.md
// Só a pasta src/data/ importa este arquivo.

export type BancoRespiro = Dexie & {
  config: EntityTable<Config, 'id'>
  contas: EntityTable<Conta, 'id'>
  categorias: EntityTable<Categoria, 'id'>
  gastos: EntityTable<Gasto, 'id'>
  planosDoMes: EntityTable<MesPlanejado, 'mes'>
}

export const db = new Dexie('respiro') as BancoRespiro

// Cada string lista a chave primária e os campos com índice (os que usamos para buscar ou ordenar).
db.version(1).stores({
  config: 'id',
  contas: 'id, ordem',
  categorias: 'id, ordem',
  gastos: 'id, data, categoriaId', // índice em data para filtrar o mês
})

// Versão 2: plano de cada mês (valores das categorias + colchão).
// Migração: quem já usava o app ganha um plano salvo no mês em que começou, com
// os valores de hoje. Assim nada muda no que já estava sendo mostrado.
db.version(2)
  .stores({ planosDoMes: 'mes' })
  .upgrade(async (tx) => {
    const config = await tx.table<Config>('config').get('principal')
    if (!config) return // app ainda sem dados: nada a migrar
    const categorias = await tx.table<Categoria>('categorias').toArray()
    await tx.table<MesPlanejado>('planosDoMes').put(planejamentoInicial(categorias, mesDeInicio(config)))
  })
