import { useEffect, useState } from 'react'
import { formatarBRL } from '../../domain/dinheiro'
import type { Categoria, Centavos } from '../../domain/tipos'
import Etiqueta, { type EstadoEtiqueta } from './Etiqueta'

// Medidor segmentado (docs/08-design.md, seção 7.5): 20 segmentos, como um painel
// de instrumentos. Cheios na cor da categoria; em atenção, --warn; estourou, todos --danger.
// Compras no crédito (regra da fatura) aparecem depois, em tom claro da cor da categoria:
// mostram o gasto, mas não gastam o teto (docs/03-regras-de-negocio.md, seção 5.5).

const SEGMENTOS = 20
const DESCRITO: Record<EstadoEtiqueta, string> = { ok: 'ok', atencao: 'atenção', estourou: 'estourou' }

export type CorMedidor = Categoria['cor'] | 'neutra'

interface MedidorCategoriaProps {
  nome: string
  cor: CorMedidor
  teto: Centavos
  gasto: Centavos
  estado: EstadoEtiqueta
  /** false em meses futuros (só o teto) e na linha "fora do plano" (só o gasto). */
  mostrarBarras?: boolean
  /** false na linha "fora do plano", que não tem teto. */
  mostrarTeto?: boolean
  /** Compras no crédito pela regra da fatura: aparecem, mas não gastam o teto. */
  noCredito?: Centavos
}

function segmentosCheios(teto: Centavos, gasto: Centavos, estado: EstadoEtiqueta): number {
  if (estado === 'estourou') return SEGMENTOS
  if (teto <= 0) return 0
  // Arredonda para cima: qualquer gasto acende pelo menos um segmento.
  return Math.min(SEGMENTOS, Math.ceil((gasto * SEGMENTOS) / teto))
}

export default function MedidorCategoria({
  nome,
  cor,
  teto,
  gasto,
  estado,
  mostrarBarras = true,
  mostrarTeto = true,
  noCredito = 0,
}: MedidorCategoriaProps) {
  const cheios = segmentosCheios(teto, gasto, estado)
  // Segmentos do crédito: proporcionais ao teto, no espaço que sobrar depois dos cheios
  const doCredito =
    noCredito > 0 ? Math.min(SEGMENTOS - cheios, teto > 0 ? Math.ceil((noCredito * SEGMENTOS) / teto) : SEGMENTOS) : 0
  const corDaCategoria = `var(--${cor === 'neutra' ? 'fg-muted' : cor})`
  const corCheia = estado === 'estourou' ? 'var(--danger)' : estado === 'atencao' ? 'var(--warn)' : corDaCategoria

  // Entrada: os segmentos acendem em sequência, 18ms cada (atraso no CSS).
  const [aceso, setAceso] = useState(false)
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAceso(true))
    return () => cancelAnimationFrame(quadro)
  }, [])

  // Segmentos que acabaram de acender (gasto novo) pulsam uma vez.
  // Guardamos o número anterior em estado e comparamos durante a renderização.
  const [anterior, setAnterior] = useState(cheios)
  const [pulso, setPulso] = useState<{ de: number; ate: number; vez: number }>({ de: 0, ate: 0, vez: 0 })
  if (cheios !== anterior) {
    if (cheios > anterior) setPulso((p) => ({ de: anterior, ate: cheios, vez: p.vez + 1 }))
    setAnterior(cheios)
  }

  const restante = teto - gasto
  const textoValor = `${formatarBRL(gasto)} de ${formatarBRL(teto)}${
    noCredito > 0 ? `, mais ${formatarBRL(noCredito)} no crédito` : ''
  }`

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-[15px] font-medium">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: corDaCategoria }} />
          {nome}
        </span>
        <span className="font-mono text-num whitespace-nowrap tabular-nums">
          {mostrarTeto ? (
            mostrarBarras ? (
              <>
                {formatarBRL(gasto)} <span className="text-fg-faint">/ {formatarBRL(teto).replace(/^R\$\s/, '')}</span>
              </>
            ) : (
              formatarBRL(teto)
            )
          ) : (
            formatarBRL(gasto)
          )}
        </span>
      </div>

      {mostrarBarras && (
        <div
          role="meter"
          aria-label={nome}
          aria-valuemin={0}
          aria-valuemax={teto}
          aria-valuenow={gasto}
          aria-valuetext={`${textoValor}, ${DESCRITO[estado]}`}
          className="flex gap-0.5"
        >
          {Array.from({ length: SEGMENTOS }, (_, i) => {
            const cheio = aceso && i < cheios
            const credito = aceso && !cheio && i < cheios + doCredito
            const ultimo = cheio && i === cheios - 1
            const pulsa = i >= pulso.de && i < pulso.ate
            return (
              <span
                key={pulsa ? `${i}-${pulso.vez}` : i}
                className={`medidor-segmento h-1.5 flex-1 rounded-[2px] ${pulsa ? 'medidor-pulso' : ''}`}
                style={{
                  background: cheio
                    ? corCheia
                    : credito
                      ? `color-mix(in srgb, ${corDaCategoria} 35%, transparent)`
                      : 'var(--line)',
                  boxShadow: ultimo ? `0 0 8px ${corCheia}` : undefined,
                  transitionDelay: `${i * 18}ms`,
                }}
              />
            )
          })}
        </div>
      )}

      {(mostrarBarras || !mostrarTeto) && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-small text-fg-muted">
            {!mostrarTeto
              ? 'Gastos sem categoria do plano'
              : restante >= 0
                ? `Restam ${formatarBRL(restante)}`
                : `Passou ${formatarBRL(-restante)} do teto`}
            {noCredito > 0 && <span className="text-fg"> · + {formatarBRL(noCredito)} no crédito</span>}
          </span>
          {/* key: a etiqueta remonta quando o estado muda, e "ESTOUROU" pisca uma vez */}
          <Etiqueta key={estado} estado={estado} />
        </div>
      )}
    </div>
  )
}
