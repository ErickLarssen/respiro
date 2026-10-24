import { montarData, montarMes } from '../domain/datas'
import type { DataISO } from '../domain/tipos'

/**
 * A data de hoje no fuso do aparelho, como "AAAA-MM-DD", para a camada de dados
 * (migrações do banco). As telas usam o hook useHoje; o domínio recebe "hoje" por parâmetro.
 */
export function hojeNoAparelho(): DataISO {
  const agora = new Date()
  return montarData(montarMes(agora.getFullYear(), agora.getMonth() + 1), agora.getDate())
}
