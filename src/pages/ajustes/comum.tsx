import type { ReactNode } from 'react'
import Cartao from '../../components/ui/Cartao'

// Moldura das seções de Ajustes. A prévia na reserva fica em components/PreviaReserva.tsx.

export function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  const id = `secao-${titulo.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="rotulo text-fg-faint">
          {titulo}
        </h2>
        {descricao && <p className="text-small text-fg-muted">{descricao}</p>}
      </div>
      <Cartao className="flex flex-col gap-5">{children}</Cartao>
    </section>
  )
}
