import { CircleCheck, TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'motion/react'
import { useEffect, useEffectEvent } from 'react'
import { fadeRapido, molaFirme } from '../../ui/movimento'

// Aviso flutuante no topo (docs/08-design.md, seção 7.8): "Gasto anotado: R$ 35,00 em Lazer".
// Some sozinho em 2,6 s; arrastar para cima também fecha.

const DURACAO_MS = 2600
const ARRASTE_PARA_FECHAR = -24 // px para cima

export interface DadosAviso {
  id: number // muda a cada aviso novo, para o mesmo texto aparecer de novo
  texto: string
  tom: 'ok' | 'atencao'
}

interface AvisoProps {
  aviso: DadosAviso | null
  onFechar: () => void
}

export default function Aviso({ aviso, onFechar }: AvisoProps) {
  const reduzirMovimento = useReducedMotion()
  // useEffectEvent: o timer usa sempre o onFechar mais novo, sem reiniciar a contagem.
  const fechar = useEffectEvent(onFechar)

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(fechar, DURACAO_MS)
    return () => clearTimeout(timer)
  }, [aviso])

  function aoSoltar(_: unknown, info: PanInfo) {
    if (info.offset.y < ARRASTE_PARA_FECHAR || info.velocity.y < -300) onFechar()
  }

  const Icone = aviso?.tom === 'atencao' ? TriangleAlert : CircleCheck

  return (
    // A região "status" fica sempre na página: assim o leitor de tela anuncia cada aviso novo.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[calc(12px+env(safe-area-inset-top))] z-50 flex justify-center"
    >
      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.id}
            className="vidro pointer-events-auto flex max-w-[360px] items-center gap-3 rounded-full py-3 pr-5 pl-4 text-[14px]"
            initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={reduzirMovimento ? fadeRapido : molaFirme}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0 }}
            onDragEnd={aoSoltar}
          >
            <Icone
              aria-hidden="true"
              size={20}
              strokeWidth={1.75}
              className={`shrink-0 ${aviso.tom === 'atencao' ? 'text-warn' : 'text-ok'}`}
            />
            <span>{aviso.texto}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
