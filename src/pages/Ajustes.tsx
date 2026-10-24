import { mesDaData } from '../domain/datas'
import { useHoje } from '../hooks/useHoje'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'
import SecaoApagarTudo from './ajustes/SecaoApagarTudo'
import SecaoBackup from './ajustes/SecaoBackup'
import SecaoCartao from './ajustes/SecaoCartao'
import SecaoCategorias from './ajustes/SecaoCategorias'
import SecaoContas from './ajustes/SecaoContas'
import SecaoRenda from './ajustes/SecaoRenda'

// Tela Ajustes (docs/05-telas-e-fluxos.md). Cada seção salva no seu próprio "Salvar"
// e mostra, antes, o efeito da mudança na reserva do mês atual.
export default function Ajustes() {
  const mesAtual = mesDaData(useHoje())
  const dados = usePlanoDoMes(mesAtual)

  if (!dados) return null

  // Os campos da Renda guardam o que está sendo digitado. Se a config salva mudar por fora
  // (importar backup, por exemplo), a key muda e a seção é recriada com os valores novos.
  // Sem isso, os campos mostrariam os valores antigos e "Salvar" gravaria por cima.
  const { config } = dados
  const versaoDaConfig = [
    config.renda,
    config.diaUtilSalario,
    config.reservaMinima,
    config.metaColchao ?? 0,
  ].join('|')

  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 px-4 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))] min-[400px]:px-5">
      <h1 className="font-display text-title tracking-[0.02em]">Ajustes</h1>
      <SecaoRenda key={versaoDaConfig} dados={dados} />
      <SecaoCartao key={JSON.stringify(config.cartao ?? null)} dados={dados} />
      <SecaoContas dados={dados} />
      <SecaoCategorias dados={dados} />
      <SecaoBackup />
      <SecaoApagarTudo />
    </main>
  )
}
