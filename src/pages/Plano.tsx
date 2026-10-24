import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import Botao from '../components/ui/Botao'
import Cartao from '../components/ui/Cartao'
import GraficoProjecao from '../components/ui/GraficoProjecao'
import SeletorDeMes from '../components/ui/SeletorDeMes'
import { contaAtivaNoMes, fimDasParcelas, parcelasQueLiberamEm } from '../domain/contas'
import { mesAbreviado, mesPorExtenso, nomeDoMes, somarMeses } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { projecao } from '../domain/projecao'
import type { Mes, Situacao } from '../domain/tipos'
import { useMesSelecionado } from '../hooks/useMesSelecionado'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'
import { fadeRapido, molaSuave } from '../ui/movimento'
import { useDeslizarHorizontal } from '../ui/useDeslizarHorizontal'
import EditorDoMes from './plano/EditorDoMes'

// Tela Plano (docs/05-telas-e-fluxos.md): explica o plano como uma conta, de cima para baixo,
// permite ajustar o plano do mês e mostra a reserva dos próximos 12 meses e quando cada
// parcela acaba.

const COR_DA_MENSAGEM: Record<Situacao, string> = {
  folga: 'text-fg-muted',
  justo: 'text-fg-muted',
  apertado: 'text-warn',
  critico: 'text-danger',
  deficit: 'text-danger',
}

function Linha({ sinal, rotulo, valor, destaque }: { sinal: string; rotulo: string; valor: number; destaque?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-2 ${destaque ?? ''}`}>
      <span>
        <span aria-hidden="true" className="inline-block w-5 font-mono text-fg-faint">
          {sinal}
        </span>
        {rotulo}
      </span>
      <span className="font-mono text-num tabular-nums">{formatarBRL(valor)}</span>
    </div>
  )
}

export default function Plano() {
  const reduzirMovimento = useReducedMotion()
  const { mes, mesAtual, trocarMes } = useMesSelecionado()
  const dados = usePlanoDoMes(mes)
  const deslizar = useDeslizarHorizontal((direcao) => trocarMes(somarMeses(mes, direcao)))
  const [verContas, setVerContas] = useState(false)
  const [editando, setEditando] = useState<Mes | null>(null) // mês com o editor aberto

  if (!dados) return null

  const { plano, config, contas, categorias, planejamento, colchao } = dados
  const meta = config.metaColchao ?? 0
  const essenciais = categorias.filter((c) => c.essencial).reduce((soma, c) => soma + (plano.tetos[c.id] ?? 0), 0)
  const flexiveis = categorias.filter((c) => !c.essencial).reduce((soma, c) => soma + (plano.tetos[c.id] ?? 0), 0)
  const contasDoMes = contas.filter((conta) => contaAtivaNoMes(conta, mes))

  const meses = projecao(config, contas, categorias, mes, 12, {
    planejados: dados.planejados,
    gastosPorMes: dados.gastosPorMes,
  })
  const origem =
    planejamento.origem === mes
      ? `Plano próprio de ${nomeDoMes(mes)}.`
      : planejamento.origem
        ? `Copiado de ${mesPorExtenso(planejamento.origem)}.`
        : 'Com os valores iniciais das categorias.'
  const liberacoes: Record<Mes, string[]> = Object.fromEntries(
    meses.map((m) => [m.mes, parcelasQueLiberamEm(contas, m.mes).map((c) => c.nome)]),
  )
  const fins = fimDasParcelas(contas, mes)

  return (
    <main
      {...deslizar}
      className="mx-auto flex max-w-md touch-pan-y flex-col gap-8 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))] min-[400px]:px-5"
    >
      <h1 className="sr-only">Plano de {mesPorExtenso(mes)}</h1>
      <SeletorDeMes mes={mes} mesAtual={mesAtual} onTrocar={trocarMes} />

      {/* O plano como uma conta */}
      <section aria-label="Como o plano foi calculado" className="flex flex-col gap-3">
        <Cartao className="flex flex-col divide-y divide-line py-2">
          <Linha sinal="" rotulo="Renda" valor={plano.renda} />
          <div>
            <button
              type="button"
              aria-expanded={verContas}
              onClick={() => setVerContas(!verContas)}
              className="flex w-full items-baseline justify-between gap-3 py-2 text-left"
            >
              <span className="flex items-center">
                <span aria-hidden="true" className="inline-block w-5 font-mono text-fg-faint">
                  −
                </span>
                Contas fixas
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`ml-1 text-fg-faint transition-transform duration-200 ${verContas ? 'rotate-180' : ''}`}
                />
              </span>
              <span className="font-mono text-num tabular-nums">{formatarBRL(plano.contasFixas)}</span>
            </button>
            <AnimatePresence initial={false}>
              {verContas && (
                <motion.ul
                  initial={{ opacity: 0, y: reduzirMovimento ? 0 : -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={reduzirMovimento ? fadeRapido : molaSuave}
                  className="mb-2 flex flex-col gap-1 border-l border-line pl-4"
                >
                  {contasDoMes.length === 0 && <li className="text-small text-fg-muted">Nenhuma conta fixa neste mês.</li>}
                  {contasDoMes.map((conta) => (
                    <li key={conta.id} className="flex justify-between gap-3 text-small text-fg-muted">
                      <span className="truncate">{conta.nome}</span>
                      <span className="font-mono tabular-nums">{formatarBRL(conta.valor)}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <Linha sinal="=" rotulo="Sobra" valor={plano.sobra} destaque="font-medium" />
          <Linha sinal="−" rotulo="Essenciais" valor={essenciais} />
          {(meta > 0 || plano.colchao > 0) && <Linha sinal="−" rotulo="Colchão" valor={plano.colchao} />}
          <Linha sinal="−" rotulo="Gastos flexíveis" valor={flexiveis} />
          <Linha sinal="=" rotulo="Reserva" valor={plano.reserva} destaque="font-semibold text-ok" />
        </Cartao>
        {plano.mensagens.map((mensagem) => (
          <p key={mensagem} className={`text-small ${COR_DA_MENSAGEM[plano.situacao]}`}>
            {mensagem}
          </p>
        ))}
        {meta > 0 && (
          <p className="text-small text-fg-muted">
            Colchão no fim de {nomeDoMes(mes)}:{' '}
            <span className="font-mono text-fg">{formatarBRL(colchao.saldoFinal)}</span> de {formatarBRL(meta)}
            {colchao.usado > 0 && <> (usou {formatarBRL(colchao.usado)} para cobrir gastos acima do plano)</>}
            {colchao.saldoInicial >= meta && <>. Meta batida: o que iria para ele vai para a reserva.</>}
          </p>
        )}
      </section>

      {/* Plano do mês: quanto gostaria de gastar em cada categoria, só neste mês */}
      <section aria-label={`Plano de ${nomeDoMes(mes)}`} className="flex flex-col gap-3">
        {editando === mes ? (
          <Cartao>
            <EditorDoMes key={mes} dados={dados} onFechar={() => setEditando(null)} />
          </Cartao>
        ) : (
          <>
            <Botao variante="secundario" onClick={() => setEditando(mes)}>
              <SlidersHorizontal size={18} aria-hidden="true" /> Ajustar o plano de {nomeDoMes(mes)}
            </Botao>
            <p className="text-center text-small text-fg-faint">{origem}</p>
          </>
        )}
      </section>

      {/* Próximos 12 meses */}
      <section aria-labelledby="titulo-projecao" className="flex flex-col gap-2">
        <h2 id="titulo-projecao" className="rotulo text-fg-faint">
          Próximos 12 meses
        </h2>
        <GraficoProjecao meses={meses} mesAtual={mesAtual} liberacoes={liberacoes} />
        <p className="text-fg-muted">
          Em 12 meses:{' '}
          <span className="font-mono font-medium text-ok">{formatarBRL(meses.at(-1)?.acumulado ?? 0)}</span>
        </p>
        {meta > 0 && (
          <p className="text-small text-fg-muted">
            Colchão em {mesAbreviado(meses.at(-1)?.mes ?? mes)}:{' '}
            <span className="font-mono text-fg">{formatarBRL(meses.at(-1)?.saldoColchao ?? 0)}</span>
          </p>
        )}
      </section>

      {/* Quando cada parcela acaba */}
      <section aria-labelledby="titulo-parcelas" className="flex flex-col gap-2">
        <h2 id="titulo-parcelas" className="rotulo text-fg-faint">
          Quando cada parcela acaba
        </h2>
        {fins.length === 0 ? (
          <p className="text-small text-fg-muted">Nenhuma parcela em andamento.</p>
        ) : (
          <ul className="divide-y divide-line">
            {fins.map(({ conta, ultimaParcela, liberaEm }) => (
              <li key={conta.id} className="py-3">
                <span className="font-medium">{conta.nome}</span>
                <span className="text-fg-muted">
                  : última em {mesAbreviado(ultimaParcela)}, libera{' '}
                  <span className="font-mono text-ok">{formatarBRL(conta.valor)}</span> a partir de{' '}
                  {mesAbreviado(liberaEm)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
