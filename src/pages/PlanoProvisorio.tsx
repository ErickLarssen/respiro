import { mesDaData } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { proximoSalario } from '../domain/salario'
import type { Config } from '../domain/tipos'
import { useGastosDoMes } from '../hooks/useGastosDoMes'
import { useHoje } from '../hooks/useHoje'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'

// Página PROVISÓRIA da Etapa 2: mostra o plano do mês em texto puro, só para
// conferir que banco + hooks + domínio estão ligados. Sai na Etapa 3.
export default function PlanoProvisorio({ config }: { config: Config }) {
  const hoje = useHoje()
  const mes = mesDaData(hoje)
  const dados = usePlanoDoMes(mes)
  const gastos = useGastosDoMes(mes)

  if (!dados) return <p className="p-4">Carregando…</p>

  const { plano, categorias } = dados
  const linhas: [string, number][] = [
    ['Renda', plano.renda],
    ['− Contas fixas', plano.contasFixas],
    ['= Sobra', plano.sobra],
    ...categorias.map((c): [string, number] => [`− ${c.nome}${c.essencial ? ' (essencial)' : ''}`, plano.tetos[c.id] ?? 0]),
    ['= Reserva', plano.reserva],
  ]

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="font-display text-title">Plano de {mes} (provisório)</h1>

      <table className="mt-4 w-full tabular-nums">
        <tbody>
          {linhas.map(([rotulo, valor]) => (
            <tr key={rotulo} className="border-b border-line">
              <td className="py-2">{rotulo}</td>
              <td className="py-2 text-right">{formatarBRL(valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-4 space-y-1 text-fg-muted">
        <li>Situação: {plano.situacao}</li>
        {plano.mensagens.map((mensagem) => (
          <li key={mensagem}>{mensagem}</li>
        ))}
        <li>Próximo salário: {proximoSalario(hoje, config.diaUtilSalario)}</li>
        <li>Gastos anotados este mês: {gastos?.length ?? '…'}</li>
      </ul>
    </main>
  )
}
