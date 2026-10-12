import { montarData, montarMes } from '../domain/datas'
import type { DataISO } from '../domain/tipos'

/**
 * A data de hoje no fuso do aparelho, como "AAAA-MM-DD". É o único lugar do app
 * que lê o relógio: o domínio recebe "hoje" sempre como parâmetro.
 */
export function useHoje(): DataISO {
  const agora = new Date()
  return montarData(montarMes(agora.getFullYear(), agora.getMonth() + 1), agora.getDate())
}
