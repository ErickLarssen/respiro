import { CreditCard } from 'lucide-react'
import { diaEMes, nomeDoMes } from '../../domain/datas'
import { formatarBRL } from '../../domain/dinheiro'
import type { ResumoCartao } from '../../hooks/usePlanoDoMes'
import Cartao from './Cartao'
import Etiqueta from './Etiqueta'
import Valor from './Valor'

// O cartão de crédito na tela Início (docs/03-regras-de-negocio.md, seção 5): a fatura
// aberta contra o orçamento (barra segmentada nos estados ok/atenção/estourou), a fatura
// a pagar e o limite livre.

const SEGMENTOS = 20
const COR_DO_ESTADO = { ok: 'var(--accent)', atencao: 'var(--warn)', estourou: 'var(--danger)' } as const

export default function CartaoCredito({ resumo }: { resumo: ResumoCartao }) {
  const { cartao, aberta, aPagar, limiteLivre, estadoOrcamento } = resumo
  const cheios =
    cartao.orcamento > 0
      ? Math.min(SEGMENTOS, Math.ceil((aberta.valor * SEGMENTOS) / cartao.orcamento))
      : aberta.valor > 0
        ? SEGMENTOS
        : 0
  const cor = COR_DO_ESTADO[estadoOrcamento]

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="rotulo flex items-center gap-2 text-[10px] text-fg-muted">
            <CreditCard size={14} strokeWidth={1.75} aria-hidden="true" /> Fatura de {nomeDoMes(aberta.mes)}
          </span>
          <span className="flex items-end gap-2">
            <Valor valor={aberta.valor} className="font-mono text-amount font-medium" />
            <span className="pb-0.5 font-mono text-small whitespace-nowrap text-fg-faint">de {formatarBRL(cartao.orcamento)}</span>
          </span>
        </div>
        <Etiqueta key={estadoOrcamento} estado={estadoOrcamento} />
      </div>

      <div
        role="meter"
        aria-label="Fatura aberta contra o orçamento do cartão"
        aria-valuemin={0}
        aria-valuemax={cartao.orcamento}
        aria-valuenow={aberta.valor}
        aria-valuetext={`${formatarBRL(aberta.valor)} de ${formatarBRL(cartao.orcamento)} do orçamento`}
        className="flex gap-0.5"
      >
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <span
            key={i}
            className="medidor-segmento h-1.5 flex-1 rounded-[2px]"
            style={{
              background: i < cheios ? cor : 'var(--line)',
              boxShadow: i === cheios - 1 ? `0 0 8px ${cor}` : undefined,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1 text-small text-fg-muted">
        <span>
          Fecha {diaEMes(aberta.fechamento)} · vence {diaEMes(aberta.vencimento)}
          {aberta.regraAnterior > 0 && <> · + {formatarBRL(aberta.regraAnterior)} de antes (já nos tetos)</>}
        </span>
        {aPagar && (
          <span>
            A pagar: fatura de {nomeDoMes(aPagar.mes)},{' '}
            <span className="font-mono text-fg">{formatarBRL(aPagar.noBanco)}</span> até {diaEMes(aPagar.vencimento)}
          </span>
        )}
        <span>
          Limite livre:{' '}
          <span className={`font-mono ${limiteLivre < 0 ? 'text-danger' : 'text-fg'}`}>{formatarBRL(limiteLivre)}</span>{' '}
          de {formatarBRL(cartao.limite)}
        </span>
      </div>
    </Cartao>
  )
}
