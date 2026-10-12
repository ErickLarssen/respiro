import { useId, type InputHTMLAttributes } from 'react'

// Campo de texto (docs/08-design.md, seção 7.10): rótulo em Michroma acima,
// caixa de 48px e, no foco, borda oxigênio com anel de brilho.

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string
  /** Mensagem de erro: diz o que aconteceu e o que fazer. */
  erro?: string | null
  dica?: string
}

export default function Campo({ rotulo, erro, dica, className = '', ...resto }: CampoProps) {
  const id = useId()
  const idAjuda = `${id}-ajuda`
  const ajuda = erro ?? dica

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="rotulo text-[10px] text-fg-muted">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={ajuda ? idAjuda : undefined}
        className={`h-12 rounded-sm border bg-bg-2 px-3 text-body text-fg transition-[border-color,box-shadow] duration-200 ease-out outline-none placeholder:text-fg-faint focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] ${
          erro ? 'border-danger' : 'border-line'
        }`}
        {...resto}
      />
      {ajuda && (
        <p id={idAjuda} className={`text-small ${erro ? 'text-danger' : 'text-fg-muted'}`}>
          {ajuda}
        </p>
      )}
    </div>
  )
}
