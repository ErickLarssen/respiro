import { useLiveQuery } from 'dexie-react-hooks'
import type { Mes } from '../domain/tipos'
import { carregarPlanoDoMes, type PlanoDoMes } from './carregarPlanoDoMes'

export type { PlanoDoMes } from './carregarPlanoDoMes'

/**
 * O plano do mês, recalculado sempre que a config, as contas, as categorias, os
 * planos salvos ou os gastos mudam no banco.
 * undefined enquanto carrega; null se ainda não há config (primeiro uso).
 */
export function usePlanoDoMes(mes: Mes): PlanoDoMes | null | undefined {
  return useLiveQuery(() => carregarPlanoDoMes(mes), [mes])
}
