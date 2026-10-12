import type { ReactNode } from 'react'
import Cartao from '../../components/ui/Cartao'
import { calcularPlano, fraseEfeitoNaReserva } from '../../domain/plano'
import type { Categoria, Centavos, Conta } from '../../domain/tipos'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'

// Peças usadas por todas as seções de Ajustes.

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

export interface Mudanca {
  renda?: Centavos
  reservaMinima?: Centavos
  contas?: Conta[]
  categorias?: Categoria[]
}

/**
 * Prévia do efeito na reserva do mês atual, antes de salvar (docs/05-telas-e-fluxos.md):
 * "Com essa mudança, a reserva de outubro vai de R$ 51,92 para R$ 61,92."
 */
export function PreviaReserva({ dados, mudanca }: { dados: PlanoDoMes; mudanca: Mudanca }) {
  const depois = calcularPlano({
    renda: mudanca.renda ?? dados.config.renda,
    reservaMinima: mudanca.reservaMinima ?? dados.config.reservaMinima,
    contas: mudanca.contas ?? dados.contas,
    categorias: mudanca.categorias ?? dados.categorias,
    mes: dados.plano.mes,
  })
  const subiu = depois.reserva > dados.plano.reserva
  const desceu = depois.reserva < dados.plano.reserva
  return (
    <p
      aria-live="polite"
      className={`rounded-[var(--r-sm)] border px-3 py-2.5 text-small ${
        subiu ? 'border-ok/30 text-ok' : desceu ? 'border-warn/30 text-warn' : 'border-line text-fg-muted'
      }`}
    >
      {fraseEfeitoNaReserva(dados.plano, depois)}
    </p>
  )
}
