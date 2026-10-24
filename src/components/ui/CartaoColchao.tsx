import { formatarBRL } from '../../domain/dinheiro'
import type { Centavos } from '../../domain/tipos'
import Cartao from './Cartao'
import Valor from './Valor'

// Cartão do colchão na tela Início: saldo acumulado, meta e o que fazer neste mês.
// A barra segue o estilo do medidor segmentado (docs/08-design.md, seção 7.5), na cor do app.

const SEGMENTOS = 20

interface CartaoColchaoProps {
  saldo: Centavos // no fim do mês (já descontado o que foi usado)
  meta: Centavos
  separado: Centavos // entra neste mês
  usado: Centavos // saiu neste mês para cobrir gastos acima do plano
  passado: boolean // mês que já acabou
}

export default function CartaoColchao({ saldo, meta, separado, usado, passado }: CartaoColchaoProps) {
  // Arredonda para cima, como o medidor das categorias: qualquer saldo acende pelo menos um segmento.
  const cheios = meta > 0 ? Math.min(SEGMENTOS, Math.ceil((saldo * SEGMENTOS) / meta)) : 0
  const frase =
    separado > 0
      ? passado
        ? `Separado no mês: ${formatarBRL(separado)}`
        : `Separe ${formatarBRL(separado)} assim que o salário cair`
      : saldo >= meta
        ? 'Meta batida: este mês, o que iria para cá vai para a reserva'
        : 'Nada a separar neste mês'

  return (
    <Cartao className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="rotulo text-[10px] text-fg-muted">Colchão</span>
          <Valor valor={saldo} className="font-mono text-amount font-medium" />
        </div>
        <span className="font-mono text-small text-fg-faint">meta {formatarBRL(meta)}</span>
      </div>

      <div
        role="meter"
        aria-label="Colchão"
        aria-valuemin={0}
        aria-valuemax={meta}
        aria-valuenow={saldo}
        aria-valuetext={`${formatarBRL(saldo)} de ${formatarBRL(meta)}`}
        className="flex gap-0.5"
      >
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <span
            key={i}
            className="medidor-segmento h-1.5 flex-1 rounded-[2px]"
            style={{
              background: i < cheios ? 'var(--accent)' : 'var(--line)',
              boxShadow: i === cheios - 1 ? '0 0 8px var(--accent)' : undefined,
            }}
          />
        ))}
      </div>

      <span className="text-small text-fg-muted">
        {frase}
        {usado > 0 && ` · usou ${formatarBRL(usado)} este mês`}
      </span>
    </Cartao>
  )
}
