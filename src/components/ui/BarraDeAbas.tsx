import { ChartPie, House, Plus, Receipt, Settings, type LucideIcon } from 'lucide-react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { useState } from 'react'
import { NavLink } from 'react-router'
import { fadeRapido, molaFirme } from '../../ui/movimento'

// Barra de abas flutuante (docs/08-design.md, seção 7.1): pílula de vidro solta das
// bordas, com uma "lente" que desliza até a aba ativa, e o botão "+" ao lado.

interface Aba {
  para: string
  rotulo: string
  Icone: LucideIcon
}

const ABAS: Aba[] = [
  { para: '/', rotulo: 'Início', Icone: House },
  { para: '/gastos', rotulo: 'Gastos', Icone: Receipt },
  { para: '/plano', rotulo: 'Plano', Icone: ChartPie },
  { para: '/ajustes', rotulo: 'Ajustes', Icone: Settings },
]

// Rolando para baixo mais que isso, a barra encolhe; para cima, volta.
const LIMIAR_ROLAGEM = 24
const FOLGA_PARA_VOLTAR = 6 // evita piscar com tremidas pequenas do dedo

interface BarraDeAbasProps {
  /** Mostra o botão "+" (Início e Gastos). */
  mostrarMais: boolean
  onMais: () => void
}

function vibrar() {
  navigator.vibrate?.(8) // só funciona no Android
}

export default function BarraDeAbas({ mostrarMais, onMais }: BarraDeAbasProps) {
  const reduzirMovimento = useReducedMotion()
  const transicao = reduzirMovimento ? fadeRapido : molaFirme

  const [compacta, setCompacta] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (atual) => {
    const anterior = scrollY.getPrevious() ?? 0
    if (atual > anterior && atual > LIMIAR_ROLAGEM) setCompacta(true)
    else if (anterior - atual > FOLGA_PARA_VOLTAR || atual <= LIMIAR_ROLAGEM) setCompacta(false)
  })

  const altura = compacta ? 52 : 64

  return (
    <>
      {/* `layout`: o Motion anima a troca de altura com transform (sem animar height) */}
      <motion.nav
        layout
        transition={transicao}
        aria-label="Navegação principal"
        className="vidro fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-4 right-[92px] z-40 flex p-1.5"
        style={{ height: altura, borderRadius: 32 }}
      >
        {ABAS.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === '/'}
            onClick={vibrar}
            className="relative flex flex-1 transition-transform duration-[120ms] active:scale-94"
          >
            {({ isActive }) => (
              <motion.span layout transition={transicao} className="relative grid flex-1 place-items-center">
                {isActive && (
                  <motion.span
                    layoutId="lente"
                    transition={transicao}
                    className="absolute inset-0 border border-line-strong bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]"
                    style={{ borderRadius: 26 }}
                  />
                )}
                <motion.span
                  layout="position"
                  transition={transicao}
                  className={`relative flex flex-col items-center gap-1 ${isActive ? 'text-fg' : 'text-fg-faint'}`}
                >
                  <span className="relative">
                    <Icone size={22} strokeWidth={1.75} aria-hidden="true" />
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]"
                      />
                    )}
                  </span>
                  <motion.span
                    initial={false}
                    animate={{ opacity: compacta ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                    // Geist, não Michroma: em 56px de aba, "AJUSTES" em Michroma não cabe (68px).
                    className={`text-[10.5px] leading-none font-semibold tracking-[0.06em] uppercase ${
                      compacta ? 'sr-only' : ''
                    }`}
                  >
                    {rotulo}
                  </motion.span>
                </motion.span>
              </motion.span>
            )}
          </NavLink>
        ))}
      </motion.nav>

      {/* Botão "+": abre o painel de anotar gasto */}
      <motion.button
        type="button"
        onClick={onMais}
        aria-label="Anotar gasto"
        aria-hidden={!mostrarMais}
        tabIndex={mostrarMais ? 0 : -1}
        initial={false}
        animate={{ scale: mostrarMais ? (compacta ? 52 / 64 : 1) : 0.6, opacity: mostrarMais ? 1 : 0 }}
        transition={transicao}
        className={`btn btn-primario fixed right-4 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 size-16 rounded-full p-0 ${
          mostrarMais ? '' : 'pointer-events-none'
        }`}
        style={{ originY: 1 }}
      >
        <Plus size={26} strokeWidth={2} aria-hidden="true" />
      </motion.button>
    </>
  )
}
