import { useLiveQuery } from 'dexie-react-hooks'
import { listarCategorias } from '../data/repositorio'
import type { Categoria } from '../domain/tipos'

/** Categorias pela ordem. undefined enquanto carrega. */
export function useCategorias(): Categoria[] | undefined {
  return useLiveQuery(listarCategorias)
}
