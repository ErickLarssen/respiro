import type { ButtonHTMLAttributes } from 'react'
import { useSpotlight } from '../../ui/useSpotlight'

// Botão do design system (docs/08-design.md, seção 7.2). Os estilos ficam em index.css (.btn-*).

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao
  /** Troca o texto por três pontos pulsando e bloqueia novos toques. */
  carregando?: boolean
}

export default function Botao({
  variante = 'primario',
  carregando = false,
  type = 'button',
  className = '',
  disabled,
  children,
  ...resto
}: BotaoProps) {
  const spotlight = useSpotlight<HTMLButtonElement>()
  const temSpotlight = variante === 'secundario' || variante === 'perigo'

  return (
    <button
      type={type}
      className={`btn btn-${variante} ${className}`}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      data-carregando={carregando || undefined}
      {...(temSpotlight ? spotlight : {})}
      {...resto}
    >
      {carregando ? (
        <>
          <span className="pontos" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {/* O texto continua lá para leitores de tela */}
          <span className="sr-only">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
