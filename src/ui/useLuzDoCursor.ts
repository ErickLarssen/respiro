import { useEffect } from 'react'

// Luz do fundo que segue o mouse (ver "Luz que segue o mouse" em index.css).
// Só liga com mouse de verdade: no celular não há cursor "passando" pela tela.

const COM_MOUSE = '(hover: hover) and (pointer: fine)'

export function useLuzDoCursor() {
  useEffect(() => {
    if (!window.matchMedia(COM_MOUSE).matches) return

    const raiz = document.documentElement
    let quadro = 0
    let quadroAcender = 0
    let x = 0
    let y = 0

    function aplicar() {
      quadro = 0
      raiz.style.setProperty('--luz-x', `${x}px`)
      raiz.style.setProperty('--luz-y', `${y}px`)
      if (!raiz.hasAttribute('data-luz') && !quadroAcender) {
        // Primeira entrada: a posição já foi aplicada sem transição; no quadro
        // seguinte acende a luz e liga o "atraso suave" da posição.
        quadroAcender = requestAnimationFrame(() => {
          quadroAcender = 0
          raiz.setAttribute('data-luz', '')
          raiz.style.setProperty('--luz-forca', '1')
        })
      }
    }

    function apagar() {
      // Cancela o que estiver agendado, senão um quadro pendente reacenderia a luz.
      cancelAnimationFrame(quadro)
      cancelAnimationFrame(quadroAcender)
      quadro = 0
      quadroAcender = 0
      raiz.removeAttribute('data-luz')
      raiz.style.setProperty('--luz-forca', '0')
    }

    function aoMover(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      // No máximo uma atualização por quadro, por mais rápido que o mouse se mova.
      if (!quadro) quadro = requestAnimationFrame(aplicar)
    }

    function aoSairDaJanela(e: MouseEvent) {
      if (e.relatedTarget) return // só saiu de um elemento para outro
      apagar()
    }

    window.addEventListener('pointermove', aoMover, { passive: true })
    document.addEventListener('mouseout', aoSairDaJanela)
    return () => {
      window.removeEventListener('pointermove', aoMover)
      document.removeEventListener('mouseout', aoSairDaJanela)
      apagar()
    }
  }, [])
}
