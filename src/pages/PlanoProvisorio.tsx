import SeletorDeMes from '../components/ui/SeletorDeMes'
import { mesPorExtenso } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { useMesSelecionado } from '../hooks/useMesSelecionado'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'

// Página PROVISÓRIA da aba Plano: mostra o plano do mês em texto puro.
// A tela Plano de verdade (conta de cima para baixo, gráfico de 12 meses) chega na Etapa 4.
export default function PlanoProvisorio() {
  const { mes, mesAtual, trocarMes } = useMesSelecionado()
  const dados = usePlanoDoMes(mes)

  if (!dados) return null

  const { plano, categorias } = dados
  const linhas: [string, number][] = [
    ['Renda', plano.renda],
    ['− Contas fixas', plano.contasFixas],
    ['= Sobra', plano.sobra],
    ...categorias.map((c): [string, number] => [
      `− ${c.nome}${c.essencial ? ' (essencial)' : ''}`,
      plano.tetos[c.id] ?? 0,
    ]),
    ['= Reserva', plano.reserva],
  ]

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))]">
      <SeletorDeMes mes={mes} mesAtual={mesAtual} onTrocar={trocarMes} />
      <h1 className="font-display text-title">Plano de {mesPorExtenso(mes)}</h1>

      <table className="w-full font-mono text-num tabular-nums">
        <tbody>
          {linhas.map(([rotulo, valor]) => (
            <tr key={rotulo} className="border-b border-line">
              <td className="py-2 font-sans text-body">{rotulo}</td>
              <td className="py-2 text-right">{formatarBRL(valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-1 text-small text-fg-muted">
        {plano.mensagens.map((mensagem) => (
          <li key={mensagem}>{mensagem}</li>
        ))}
        <li>A tela Plano completa chega na Etapa 4.</li>
      </ul>
    </main>
  )
}
