import type { Centavos } from './tipos'

// Estado de um gasto em relação a um teto: usado nas categorias e no orçamento do cartão.
// Regras: docs/03-regras-de-negocio.md, seções 4 e 5.6.

/** A partir de 80% do teto, entra em "atenção". Em %, para comparar só inteiros. */
const LIMITE_ATENCAO = 80

export type EstadoCategoria = 'ok' | 'atencao' | 'estourou'

export function estadoDaCategoria(teto: Centavos, gasto: Centavos): EstadoCategoria {
  if (gasto > teto) return 'estourou'
  if (teto > 0 && gasto * 100 >= teto * LIMITE_ATENCAO) return 'atencao'
  return 'ok'
}
