import { useLiveQuery } from 'dexie-react-hooks'
import { obterConfig } from '../data/repositorio'
import type { Config } from '../domain/tipos'

export interface EstadoConfig {
  carregando: boolean
  config: Config | null // null = primeiro uso (ainda não há config salva)
}

/** A config do app. Atualiza a tela sozinho quando a config muda no banco. */
export function useConfig(): EstadoConfig {
  // useLiveQuery devolve undefined enquanto o banco ainda está respondendo.
  const config = useLiveQuery(obterConfig)
  return { carregando: config === undefined, config: config ?? null }
}
