import { useLiveQuery } from 'dexie-react-hooks'
import type { Mes } from '../domain/tipos'
import { carregarPlanoDoMes, type PlanoDoMes } from './carregarPlanoDoMes'
import { useHoje } from './useHoje'

export type { FaturaVista, PlanoDoMes, ResumoCartao } from './carregarPlanoDoMes'

/**
 * O plano do mês, recalculado sempre que a config, as contas, as categorias, os
 * planos salvos ou os gastos mudam no banco.
 * undefined enquanto carrega; null se ainda não há config (primeiro uso).
 */
export function usePlanoDoMes(mes: Mes): PlanoDoMes | null | undefined {
  const hoje = useHoje()
  return useLiveQuery(() => carregarPlanoDoMes(mes, hoje), [mes, hoje])
}
