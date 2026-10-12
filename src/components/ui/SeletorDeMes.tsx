import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { mesCurto, mesPorExtenso, somarMeses } from '../../domain/datas'
import type { Mes } from '../../domain/tipos'

// Seletor de mês (docs/08-design.md, seção 7.9): pílula de vidro com ‹ OUT 2026 ›.
// Ao trocar, o mês velho sai para um lado e o novo entra pelo outro.

interface SeletorDeMesProps {
  mes: Mes
  mesAtual: Mes
  onTrocar: (mes: Mes) => void
}

export default function SeletorDeMes({ mes, mesAtual, onTrocar }: SeletorDeMesProps) {
  const reduzirMovimento = useReducedMotion()

  // Direção da animação: +1 indo para o futuro, −1 para o passado.
  // Guardamos o mês anterior em estado e comparamos durante a renderização.
  const [anterior, setAnterior] = useState(mes)
  const [direcao, setDirecao] = useState(1)
  if (mes !== anterior) {
    setDirecao(mes > anterior ? 1 : -1)
    setAnterior(mes)
  }

  const deslocamento = reduzirMovimento ? 0 : 12 * direcao
  const ehMesAtual = mes === mesAtual

  return (
    <div className="flex items-center justify-center gap-2">
      <nav aria-label="Mês" className="vidro flex h-11 items-center rounded-full px-1">
        <button
          type="button"
          onClick={() => onTrocar(somarMeses(mes, -1))}
          aria-label="Mês anterior"
          className="grid size-11 place-items-center rounded-full text-fg-muted active:scale-94"
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div className="relative grid w-[104px] place-items-center overflow-hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false} custom={deslocamento}>
            <motion.span
              key={mes}
              custom={deslocamento}
              initial={{ opacity: 0, x: deslocamento }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -deslocamento }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[12px] tracking-[0.14em] uppercase"
            >
              <span className="sr-only">{mesPorExtenso(mes)}</span>
              <span aria-hidden="true">{mesCurto(mes)}</span>
            </motion.span>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => onTrocar(somarMeses(mes, 1))}
          aria-label="Próximo mês"
          className="grid size-11 place-items-center rounded-full text-fg-muted active:scale-94"
        >
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </nav>

      {!ehMesAtual && (
        <button
          type="button"
          onClick={() => onTrocar(mesAtual)}
          className="vidro flex h-11 items-center gap-2 rounded-full px-4 font-display text-[10px] tracking-[0.14em] uppercase"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
          Hoje
        </button>
      )}
    </div>
  )
}
