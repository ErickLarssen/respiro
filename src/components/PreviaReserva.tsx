import { aSepararNoColchao } from '../domain/colchao'
import { calcularPlano, fraseEfeitoNaReserva } from '../domain/plano'
import type { Categoria, Centavos, Conta } from '../domain/tipos'
import type { PlanoDoMes } from '../hooks/usePlanoDoMes'

// Prévia do efeito de uma mudança na reserva do mês, antes de salvar
// (docs/05-telas-e-fluxos.md): "Com essa mudança, a reserva de outubro vai de R$ 51,92 para R$ 61,92."
// Usada em Ajustes e no editor do plano do mês (aba Plano).

export interface Mudanca {
  renda?: Centavos
  reservaMinima?: Centavos
  metaColchao?: Centavos
  contas?: Conta[]
  categorias?: Categoria[]
  /** Valores do mês que mudam (os outros continuam os do plano do mês). */
  desejos?: Record<string, Centavos>
  /** Quanto separar no colchão neste mês (antes da meta). */
  colchao?: Centavos
}

export default function PreviaReserva({ dados, mudanca }: { dados: PlanoDoMes; mudanca: Mudanca }) {
  const meta = mudanca.metaColchao ?? dados.config.metaColchao ?? 0
  const depois = calcularPlano({
    renda: mudanca.renda ?? dados.config.renda,
    reservaMinima: mudanca.reservaMinima ?? dados.config.reservaMinima,
    contas: mudanca.contas ?? dados.contas,
    categorias: mudanca.categorias ?? dados.categorias,
    mes: dados.plano.mes,
    desejos: { ...dados.planejamento.desejos, ...mudanca.desejos },
    colchao: aSepararNoColchao(mudanca.colchao ?? dados.planejamento.colchao, meta, dados.colchao.saldoInicial),
    fatura: dados.plano.fatura, // a fatura do cartão do mês não muda com estas mudanças
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
