import type { Transition } from 'motion/react'

// Molas da biblioteca Motion (docs/08-design.md, seção 6).
// Mola = animação com física: acelera e desacelera como um objeto de verdade.

/** Indicador da aba, botões, avisos. */
export const molaFirme = { type: 'spring', stiffness: 520, damping: 40 } as const satisfies Transition

/** Painel, cartões. */
export const molaSuave = { type: 'spring', stiffness: 300, damping: 32 } as const satisfies Transition

/** Troca usada no lugar das molas quando o usuário pede movimento reduzido. */
export const fadeRapido = { duration: 0.12 } as const satisfies Transition
