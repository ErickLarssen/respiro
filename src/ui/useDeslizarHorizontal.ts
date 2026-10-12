import { useRef, type PointerEvent } from 'react'

// Deslizar o dedo para os lados no conteúdo da tela (docs/08-design.md, seção 7.9).
// O elemento precisa de `touch-action: pan-y` (classe touch-pan-y): assim o navegador
// cuida da rolagem vertical e entrega os movimentos horizontais para nós.

const DISTANCIA_MINIMA = 60 // px
const PREDOMINIO_HORIZONTAL = 1.5 // dx precisa ser 1,5× maior que dy

export function useDeslizarHorizontal(aoDeslizar: (direcao: 1 | -1) => void) {
  const inicio = useRef<{ x: number; y: number } | null>(null)

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse') return // no computador, usa as setas
    inicio.current = { x: e.clientX, y: e.clientY }
  }

  function onPointerUp(e: PointerEvent) {
    const de = inicio.current
    inicio.current = null
    if (!de) return
    const dx = e.clientX - de.x
    const dy = e.clientY - de.y
    if (Math.abs(dx) < DISTANCIA_MINIMA || Math.abs(dx) < Math.abs(dy) * PREDOMINIO_HORIZONTAL) return
    // Dedo para a esquerda = avançar (próximo mês), como virar uma página.
    aoDeslizar(dx < 0 ? 1 : -1)
  }

  function onPointerCancel() {
    inicio.current = null
  }

  return { onPointerDown, onPointerUp, onPointerCancel }
}
