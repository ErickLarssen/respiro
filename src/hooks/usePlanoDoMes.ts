import { useLiveQuery } from 'dexie-react-hooks'
import { listarCategorias, listarContas, obterConfig } from '../data/repositorio'
import { calcularPlano } from '../domain/plano'
import type { Categoria, Conta, Mes, Plano } from '../domain/tipos'

export interface PlanoDoMes {
  plano: Plano
  contas: Conta[] // pela ordem
  categorias: Categoria[] // pela ordem; a tela usa para mostrar nome e cor de cada teto
}

/**
 * O plano do mês, recalculado sempre que a config, as contas ou as categorias mudam.
 * undefined enquanto carrega; null se ainda não há config (primeiro uso).
 */
export function usePlanoDoMes(mes: Mes): PlanoDoMes | null | undefined {
  return useLiveQuery(async () => {
    const [config, contas, categorias] = await Promise.all([obterConfig(), listarContas(), listarCategorias()])
    if (!config) return null

    const plano = calcularPlano({
      renda: config.renda,
      reservaMinima: config.reservaMinima,
      contas,
      categorias,
      mes,
    })
    return { plano, contas, categorias }
  }, [mes])
}
