import { hojeNoAparelho } from '../data/relogio'
import type { DataISO } from '../domain/tipos'

/**
 * A data de hoje no fuso do aparelho, como "AAAA-MM-DD". O domínio recebe "hoje"
 * sempre como parâmetro; quem lê o relógio é só a camada do React e a dos dados.
 */
export function useHoje(): DataISO {
  return hojeNoAparelho()
}
