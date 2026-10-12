import { useLiveQuery } from 'dexie-react-hooks'
import { listarGastosDoMes } from '../data/repositorio'
import type { Gasto, Mes } from '../domain/tipos'

/** Gastos do mês, do mais recente para o mais antigo. undefined enquanto carrega. */
export function useGastosDoMes(mes: Mes): Gasto[] | undefined {
  return useLiveQuery(() => listarGastosDoMes(mes), [mes])
}
