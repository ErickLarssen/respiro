import { Receipt } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import Botao from '../components/ui/Botao'
import Cartao from '../components/ui/Cartao'
import SeletorDeMes from '../components/ui/SeletorDeMes'
import Valor from '../components/ui/Valor'
import { apagarGasto } from '../data/repositorio'
import { contaNoTeto, gastoNoCredito } from '../domain/credito'
import { diaEMes, mesPorExtenso, nomeDoMes, semanaCurta, somarMeses } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import type { Categoria, DataISO, FormaPagamento, Gasto } from '../domain/tipos'
import { useGastosDoMes } from '../hooks/useGastosDoMes'
import { useLayout } from '../hooks/useLayout'
import { useMesSelecionado } from '../hooks/useMesSelecionado'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'
import { fadeRapido, molaSuave } from '../ui/movimento'
import { useDeslizarHorizontal } from '../ui/useDeslizarHorizontal'

// Tela Gastos (docs/05-telas-e-fluxos.md): total do mês, o cartão (fatura aberta, fatura
// a pagar e limite livre) e a lista por dia. Tocar num gasto mostra "Editar" e "Apagar gasto".

const FORMAS: Record<FormaPagamento, string> = { pix: 'Pix', debito: 'Débito', dinheiro: 'Dinheiro', credito: 'Crédito' }

/** Agrupa gastos (já ordenados do mais recente) por dia, mantendo a ordem. */
function agruparPorDia(gastos: Gasto[]): [DataISO, Gasto[]][] {
  const grupos = new Map<DataISO, Gasto[]>()
  for (const gasto of gastos) grupos.set(gasto.data, [...(grupos.get(gasto.data) ?? []), gasto])
  return [...grupos]
}

/** "DOM · 11 OUT" (cabeçalho do dia, docs/08-design.md, seção 7.10) */
function cabecalhoDoDia(data: DataISO): string {
  return `${semanaCurta(data)} · ${diaEMes(data).replace('/', ' ')}`
}

export default function Gastos() {
  const { mes, mesAtual, trocarMes } = useMesSelecionado()
  const dados = usePlanoDoMes(mes)
  const gastos = useGastosDoMes(mes)
  const { abrirFolha, mostrarAviso } = useLayout()
  const deslizar = useDeslizarHorizontal((direcao) => trocarMes(somarMeses(mes, direcao)))
  const [aberto, setAberto] = useState<string | null>(null) // id do gasto com as ações à mostra

  if (!dados || !gastos) return null

  const { categorias, cartao } = dados
  const porId = new Map(categorias.map((c) => [c.id, c]))
  const total = gastos.reduce((soma, gasto) => soma + gasto.valor, 0)
  const noCredito = gastoNoCredito(gastos, mes)
  // Com cartão: quanto saiu dos tetos e quanto foi para a fatura (regra da seção 5)
  const naFatura = cartao
    ? gastos.filter((gasto) => !contaNoTeto(gasto, cartao.cartao)).reduce((soma, gasto) => soma + gasto.valor, 0)
    : 0

  async function apagar(gasto: Gasto) {
    await apagarGasto(gasto.id)
    setAberto(null)
    mostrarAviso({ tom: 'ok', texto: `Gasto apagado: ${formatarBRL(gasto.valor)}` })
  }

  return (
    <main
      {...deslizar}
      className="mx-auto flex max-w-md touch-pan-y flex-col gap-6 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))] min-[400px]:px-5"
    >
      <h1 className="sr-only">Gastos de {mesPorExtenso(mes)}</h1>
      <SeletorDeMes mes={mes} mesAtual={mesAtual} onTrocar={trocarMes} />

      <Cartao className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="rotulo text-[10px] text-fg-muted">Gasto no mês</span>
          <Valor valor={total} className="font-display text-[28px] tracking-[-0.01em]" />
        </div>
        {cartao ? (
          <p className="text-small text-fg-muted">
            Nos tetos: <span className="font-mono text-fg">{formatarBRL(total - naFatura)}</span> · No crédito:{' '}
            <span className="font-mono text-fg">{formatarBRL(naFatura)}</span>
          </p>
        ) : (
          <p className="text-small text-fg-muted">
            No crédito este mês: <span className="font-mono text-fg">{formatarBRL(noCredito)}</span> (vence no dia 20 do
            mês que vem)
          </p>
        )}
      </Cartao>

      {cartao && (
        <Cartao className="flex flex-col gap-2">
          <span className="rotulo text-[10px] text-fg-muted">Cartão de crédito</span>
          <p className="text-small text-fg-muted">
            Fatura de {nomeDoMes(cartao.aberta.mes)} (aberta, fecha {diaEMes(cartao.aberta.fechamento)}, vence{' '}
            {diaEMes(cartao.aberta.vencimento)}): <span className="font-mono text-fg">{formatarBRL(cartao.aberta.valor)}</span>
          </p>
          {cartao.aPagar && (
            <p className="text-small text-fg-muted">
              A pagar: fatura de {nomeDoMes(cartao.aPagar.mes)}, vence {diaEMes(cartao.aPagar.vencimento)}:{' '}
              <span className="font-mono text-fg">{formatarBRL(cartao.aPagar.noBanco)}</span>
            </p>
          )}
          <p className="text-small text-fg-muted">
            Limite livre:{' '}
            <span className={`font-mono ${cartao.limiteLivre < 0 ? 'text-danger' : 'text-fg'}`}>
              {formatarBRL(cartao.limiteLivre)}
            </span>{' '}
            de {formatarBRL(cartao.cartao.limite)}
          </p>
        </Cartao>
      )}

      {gastos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Receipt size={36} strokeWidth={1.25} className="text-fg-faint" aria-hidden="true" />
          <p className="text-fg-muted">Nenhum gasto anotado em {nomeDoMes(mes)}.</p>
          <Botao onClick={() => abrirFolha()}>Anotar gasto</Botao>
        </div>
      ) : (
        <section aria-label="Gastos por dia" className="flex flex-col">
          {agruparPorDia(gastos).map(([data, doDia]) => (
            <div key={data}>
              <h2 className="rotulo sticky top-[env(safe-area-inset-top)] z-10 bg-bg-0 py-3 text-[10px] text-fg-faint">
                {cabecalhoDoDia(data)}
              </h2>
              <ul className="divide-y divide-line border-y border-line">
                {doDia.map((gasto) => (
                  <LinhaGasto
                    key={gasto.id}
                    gasto={gasto}
                    categoria={porId.get(gasto.categoriaId)}
                    aberta={aberto === gasto.id}
                    onAlternar={() => setAberto(aberto === gasto.id ? null : gasto.id)}
                    onEditar={() => {
                      setAberto(null)
                      abrirFolha(gasto)
                    }}
                    onApagar={() => apagar(gasto)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}

interface LinhaGastoProps {
  gasto: Gasto
  categoria: Categoria | undefined // undefined = fora do plano ou categoria apagada
  aberta: boolean
  onAlternar: () => void
  onEditar: () => void
  onApagar: () => void
}

function LinhaGasto({ gasto, categoria, aberta, onAlternar, onEditar, onApagar }: LinhaGastoProps) {
  const reduzirMovimento = useReducedMotion()
  const [confirmando, setConfirmando] = useState(false)
  const nomeDaCategoria = categoria?.nome ?? 'Fora do plano'
  const cor = categoria ? `var(--${categoria.cor})` : 'var(--fg-muted)'

  return (
    <li>
      <button
        type="button"
        aria-expanded={aberta}
        onClick={() => {
          setConfirmando(false)
          onAlternar()
        }}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-[120ms] active:bg-bg-2"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: cor }} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px]">{gasto.descricao ?? nomeDaCategoria}</span>
          <span className="text-small text-fg-muted">
            {nomeDaCategoria} · {FORMAS[gasto.forma]}
            {gasto.parcelas && gasto.parcelas > 1 ? ` ${gasto.parcelas}x` : ''}
          </span>
        </span>
        <span className="font-mono text-num tabular-nums">{formatarBRL(gasto.valor)}</span>
      </button>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={reduzirMovimento ? fadeRapido : molaSuave}
            className="pb-3"
          >
            {confirmando ? (
              // Confirmação na própria tela (sem o confirm() do navegador)
              <div role="group" aria-label="Confirmar" className="flex flex-col gap-3">
                <p className="text-small">Apagar este gasto de {formatarBRL(gasto.valor)}? Não dá para desfazer.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Botao variante="secundario" onClick={() => setConfirmando(false)}>
                    Cancelar
                  </Botao>
                  <Botao variante="perigo" onClick={onApagar}>
                    Apagar
                  </Botao>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Botao variante="secundario" onClick={onEditar}>
                  Editar
                </Botao>
                <Botao variante="perigo" onClick={() => setConfirmando(true)}>
                  Apagar gasto
                </Botao>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
