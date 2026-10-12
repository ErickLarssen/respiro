import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { mesAbreviado } from '../../domain/datas'
import { formatarBRL } from '../../domain/dinheiro'
import type { MesProjetado } from '../../domain/projecao'
import type { Mes } from '../../domain/tipos'
import { fadeRapido, molaFirme } from '../../ui/movimento'

// Gráfico da projeção (docs/08-design.md, seção 7.11): uma barra fina por mês com a
// reserva planejada. Losango verde = mês em que uma parcela deixou de existir (a reserva sobe).
// Tocar numa barra mostra a dica "jun/27 · R$ 775,92 · acumulado R$ 3.462,28".

const ALTURA = 140 // px da área das barras

interface GraficoProjecaoProps {
  meses: MesProjetado[]
  mesAtual: Mes
  /** Para cada mês, os nomes das parcelas que acabaram no mês anterior. */
  liberacoes: Record<Mes, string[]>
}

export default function GraficoProjecao({ meses, mesAtual, liberacoes }: GraficoProjecaoProps) {
  const reduzirMovimento = useReducedMotion()
  const [escolhido, setEscolhido] = useState<Mes | null>(null)
  const maior = Math.max(...meses.map((m) => m.reserva), 0)
  const dica = meses.find((m) => m.mes === escolhido)

  return (
    <div className="flex flex-col gap-3">
      {/* Dica de vidro (fica sempre no lugar para o gráfico não pular) */}
      <div className="min-h-11" aria-live="polite">
        <AnimatePresence mode="wait">
          {dica && (
            <motion.p
              key={dica.mes}
              initial={{ opacity: 0, y: reduzirMovimento ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={reduzirMovimento ? fadeRapido : molaFirme}
              className="vidro w-fit rounded-full px-4 py-2.5 font-mono text-[12px]"
            >
              {mesAbreviado(dica.mes)} · {formatarBRL(dica.reserva)} · acumulado {formatarBRL(dica.acumulado)}
              {liberacoes[dica.mes]?.length ? (
                <span className="text-ok"> · acabou: {liberacoes[dica.mes]?.join(', ')}</span>
              ) : null}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="relative" style={{ height: ALTURA }}>
        {/* Grade: três linhas, com valores */}
        {[1, 0.5, 0].map((fracao) => (
          <div
            key={fracao}
            aria-hidden="true"
            className="absolute right-16 left-0 border-t border-line"
            style={{ bottom: fracao * ALTURA }}
          >
            <span className="absolute -top-2 -right-16 w-14 text-right font-mono text-[10px] leading-none text-fg-faint">
              {formatarBRL(Math.round(maior * fracao))}
            </span>
          </div>
        ))}

        {/* Barras */}
        <div className="absolute inset-y-0 right-16 left-0 flex items-end gap-1">
          {meses.map((m, i) => {
            const atual = m.mes === mesAtual
            const marcado = (liberacoes[m.mes]?.length ?? 0) > 0
            const altura = maior > 0 ? (m.reserva / maior) * 100 : 0
            return (
              <button
                key={m.mes}
                type="button"
                onClick={() => setEscolhido(escolhido === m.mes ? null : m.mes)}
                aria-pressed={escolhido === m.mes}
                aria-label={`${mesAbreviado(m.mes)}: reserva de ${formatarBRL(m.reserva)}, acumulado ${formatarBRL(m.acumulado)}${
                  marcado ? `. Acabou: ${liberacoes[m.mes]?.join(', ')}` : ''
                }`}
                className="relative flex h-full flex-1 items-end justify-center"
              >
                <span
                  className="grafico-barra block w-full max-w-3 rounded-t-[4px]"
                  style={{
                    height: `${altura}%`,
                    background: 'var(--accent)',
                    opacity: atual || escolhido === m.mes ? 1 : 0.7,
                    boxShadow: atual ? '0 0 12px var(--accent-glow)' : undefined,
                    animationDelay: `${i * 30}ms`,
                  }}
                />
                {marcado && (
                  <span
                    aria-hidden="true"
                    className="absolute size-1.5 rotate-45 bg-ok"
                    style={{ bottom: `calc(${altura}% + 6px)` }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Meses embaixo das barras */}
      <div aria-hidden="true" className="flex gap-1 pr-16">
        {meses.map((m) => (
          <span
            key={m.mes}
            className={`flex-1 text-center font-mono text-[9px] ${m.mes === mesAtual ? 'text-fg' : 'text-fg-faint'}`}
          >
            {mesAbreviado(m.mes).slice(0, 3)}
          </span>
        ))}
      </div>
    </div>
  )
}
