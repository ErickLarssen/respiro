import AnelFolego from '../components/ui/AnelFolego'
import Cartao from '../components/ui/Cartao'
import MedidorCategoria from '../components/ui/MedidorCategoria'
import SeletorDeMes from '../components/ui/SeletorDeMes'
import Valor from '../components/ui/Valor'
import {
  dataCurta,
  diaEMes,
  diasEntre,
  diasNoMes,
  mesPorExtenso,
  montarData,
  nomeDoMes,
  semanaCurta,
  somarMeses,
} from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { FORA_DO_PLANO, resumoDoMes } from '../domain/resumo'
import { diaDoSalario, proximoSalario } from '../domain/salario'
import type { DataISO } from '../domain/tipos'
import { useGastosDoMes } from '../hooks/useGastosDoMes'
import { useHoje } from '../hooks/useHoje'
import { useMesSelecionado } from '../hooks/useMesSelecionado'
import { usePlanoDoMes } from '../hooks/usePlanoDoMes'
import { useDeslizarHorizontal } from '../ui/useDeslizarHorizontal'

// Tela Início (docs/05-telas-e-fluxos.md): responde, nesta ordem,
// 1. quanto ainda posso gastar, 2. quanto vou guardar, 3. quando cai o salário.

function quandoFalta(hoje: DataISO, data: DataISO): string | null {
  const dias = diasEntre(hoje, data)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias > 1) return `em ${dias} dias`
  return null // já passou
}

export default function Inicio() {
  const hoje = useHoje()
  const { mes, mesAtual, trocarMes } = useMesSelecionado()
  const dados = usePlanoDoMes(mes)
  const gastos = useGastosDoMes(mes)
  const deslizar = useDeslizarHorizontal((direcao) => trocarMes(somarMeses(mes, direcao)))

  if (!dados || !gastos) return null // carregando (é rápido: o banco está no aparelho)

  const { plano, config, categorias } = dados
  const resumo = resumoDoMes({ plano, gastos, mes, hoje })
  const momento = mes === mesAtual ? 'atual' : mes < mesAtual ? 'passado' : 'futuro'
  const nomeDoMesAberto = nomeDoMes(mes)

  // ---------- 1. Quanto ainda posso gastar ----------
  const proporcao =
    resumo.tetoTotal > 0 ? resumo.restante / resumo.tetoTotal : resumo.restante < 0 ? -1 : 0
  const anel =
    momento === 'futuro'
      ? {
          rotulo: `Plano para ${nomeDoMesAberto}`,
          valor: resumo.tetoTotal,
          proporcao: 1,
          detalhe: 'para gastar no mês',
          descricao: `Plano para ${nomeDoMesAberto}: ${formatarBRL(resumo.tetoTotal)} para gastar.`,
        }
      : {
          rotulo: momento === 'atual' ? 'Ainda posso gastar' : 'Sobrou do plano',
          valor: resumo.restante,
          proporcao,
          detalhe: `de ${formatarBRL(resumo.tetoTotal)}`,
          descricao: `${momento === 'atual' ? 'Ainda pode gastar' : 'Sobrou do plano'} ${formatarBRL(resumo.restante)} de ${formatarBRL(resumo.tetoTotal)}.`,
        }

  const ultimoDia = montarData(mes, diasNoMes(mes))
  const frasePorDia =
    momento === 'atual' && resumo.porDia !== null && resumo.diasRestantes !== null && resumo.restante >= 0
      ? `Cerca de ${formatarBRL(resumo.porDia)} por dia até ${diaEMes(ultimoDia)} (${resumo.diasRestantes} ${
          resumo.diasRestantes === 1 ? 'dia' : 'dias'
        })`
      : null

  // ---------- 3. Quando cai o salário ----------
  const salario = momento === 'atual' ? proximoSalario(hoje, config.diaUtilSalario) : diaDoSalario(mes, config.diaUtilSalario)
  const faltaParaSalario = quandoFalta(hoje, salario)

  // ---------- Seus tetos ----------
  const nomes = new Map(categorias.map((c) => [c.id, c]))

  return (
    <main
      {...deslizar}
      className="mx-auto flex max-w-md touch-pan-y flex-col gap-6 px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(112px+env(safe-area-inset-bottom))] min-[400px]:px-5"
    >
      <h1 className="sr-only">Início, {mesPorExtenso(mes)}</h1>
      <SeletorDeMes mes={mes} mesAtual={mesAtual} onTrocar={trocarMes} />

      {/* 1. Quanto ainda posso gastar */}
      <section aria-label="Quanto ainda posso gastar" className="flex flex-col items-center gap-3">
        <AnelFolego key={mes} {...anel} />
        {frasePorDia && <p className="text-center text-small text-fg-muted">{frasePorDia}</p>}
        {resumo.restante < 0 && momento !== 'futuro' && (
          <p role="alert" className="rounded-[var(--r-sm)] border border-danger/40 bg-danger/10 px-4 py-3 text-center text-small text-danger">
            Você passou do plano em {formatarBRL(-resumo.restante)}. Isso sai da reserva deste mês.
          </p>
        )}
      </section>

      {/* 2. Quanto vou guardar  ·  3. Quando cai o salário */}
      <section aria-label="Reserva e salário" className="grid grid-cols-2 gap-3">
        <Cartao className="flex flex-col gap-1">
          <span className="rotulo text-[10px] text-fg-muted">Reserva</span>
          <Valor valor={plano.reserva} className="font-mono text-amount font-medium text-ok" />
          <span className="text-small text-fg-muted">
            {momento === 'passado' ? 'Planejada para o mês' : 'Guarde assim que o salário cair'}
          </span>
        </Cartao>
        <Cartao className="flex flex-col gap-1">
          <span className="rotulo text-[10px] text-fg-muted">Salário</span>
          <span className="sr-only">{dataCurta(salario)}</span>
          <span aria-hidden="true" className="font-mono text-amount font-medium">
            {diaEMes(salario)}
          </span>
          <span className="text-small text-fg-muted">
            {semanaCurta(salario)} · {faltaParaSalario ?? 'já caiu'}
          </span>
        </Cartao>
      </section>

      {(plano.situacao === 'critico' || plano.situacao === 'deficit') && (
        <p role="alert" className="text-small text-warn">
          {plano.mensagens[0]}
        </p>
      )}

      {/* Seus tetos */}
      <section aria-labelledby="titulo-tetos" className="flex flex-col">
        <h2 id="titulo-tetos" className="rotulo mb-1 text-fg-faint">
          Seus tetos
        </h2>
        {resumo.categorias.length === 0 ? (
          <p className="py-3 text-small text-fg-muted">Nenhuma categoria ainda. Crie as suas em Ajustes.</p>
        ) : (
          <ul className="divide-y divide-line">
            {resumo.categorias.map((linha) => {
              const ehFora = linha.id === FORA_DO_PLANO
              const categoria = nomes.get(linha.id)
              return (
                <li key={linha.id}>
                  <MedidorCategoria
                    nome={ehFora ? 'Fora do plano' : (categoria?.nome ?? linha.id)}
                    cor={ehFora ? 'neutra' : (categoria?.cor ?? 'c5')}
                    teto={linha.teto}
                    gasto={linha.gasto}
                    estado={linha.estado}
                    mostrarBarras={momento !== 'futuro' && !ehFora}
                    mostrarTeto={!ehFora}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
