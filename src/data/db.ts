import Dexie, { type EntityTable } from 'dexie'
import type { Categoria, Config, Conta, Gasto } from '../domain/tipos'

// O banco de dados do aparelho (IndexedDB, via Dexie). Schema: docs/04-modelo-de-dados.md
// Só a pasta src/data/ importa este arquivo.

export type BancoRespiro = Dexie & {
  config: EntityTable<Config, 'id'>
  contas: EntityTable<Conta, 'id'>
  categorias: EntityTable<Categoria, 'id'>
  gastos: EntityTable<Gasto, 'id'>
}

export const db = new Dexie('respiro') as BancoRespiro

// Cada string lista a chave primária e os campos com índice (os que usamos para buscar ou ordenar).
db.version(1).stores({
  config: 'id',
  contas: 'id, ordem',
  categorias: 'id, ordem',
  gastos: 'id, data, categoriaId', // índice em data para filtrar o mês
})
