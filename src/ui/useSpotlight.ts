import type { PointerEvent } from 'react'

/**
 * Passa a posição do cursor (ou do dedo) para o CSS, nas variáveis --mx e --my.
 * O brilho radial do cartão e a borda do botão secundário usam essas variáveis.
 */
export function useSpotlight<T extends HTMLElement>() {
  function onPointerMove(e: PointerEvent<T>) {
    const caixa = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - caixa.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - caixa.top}px`)
  }
  // No celular não há "mover sem tocar": o brilho nasce no ponto do toque.
  return { onPointerMove, onPointerDown: onPointerMove }
}
