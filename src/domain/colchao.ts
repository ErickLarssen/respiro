import { mesDaData, mesesEntre, somarMeses } from './datas'
import { formatarBRL } from './dinheiro'
import { calcularPlano } from './plano'
import { planejamentoDoMes, type PlanejamentoEfetivo } from './planejamento'
import type { Categoria, Centavos, Config, Conta, Gasto, Mes, MesPlanejado, Plano } from './tipos'

// Colchão: dinheiro "para não passar o mês duro". Regras: docs/03-regras-de-negocio.md, seção 8.
//
// - Todo mês separa o valor do plano do mês, até o saldo chegar na meta (config.metaColchao).
// - Se os gastos passarem dos tetos do mês, o excesso sai do colchão antes da reserva.
// - O que não for usado fica: o saldo passa para o mês seguinte.

/** Quanto separar neste mês: o valor do plano, sem passar da meta. Meta 0 = sem colchão. */
export function aSepararNoColchao(valorDoMes: Centavos, meta: Centavos, saldo: Centavos): Centavos {
  return Math.max(0, Math.min(valorDoMes, meta - saldo))
}

/** Soma dos gastos de cada mês (inclusive fora do plano). */
export function gastosPorMes(gastos: Gasto[]): Record<Mes, Centavos> {
  const soma: Record<Mes, Centavos> = {}
  for (const gasto of gastos) {
    const mes = mesDaData(gasto.data)
    soma[mes] = (soma[mes] ?? 0) + gasto.valor
  }
  return soma
}

/** Primeiro mês do histórico: o mês em que o app começou a ser usado. */
export function mesDeInicio(config: Config): Mes {
  return mesDaData(config.criadoEm)
}

export interface MovimentoDoColchao {
  saldoInicial: Centavos
  separado: Centavos // entrou neste mês
  usado: Centavos // saiu para cobrir gastos acima do plano
  saldoFinal: Centavos
}

export interface MesSimulado {
  mes: Mes
  plano: Plano
  planejamento: PlanejamentoEfetivo
  /** Quanto os gastos do mês passaram da soma dos tetos (0 se não passaram). */
  excesso: Centavos
  colchao: MovimentoDoColchao
}

export interface EntradaSimulacao {
  config: Config
  contas: Conta[]
  categorias: Categoria[]
  planejados: MesPlanejado[]
  /** Gastos que saem dos tetos, por mês (compras no crédito pela regra da fatura ficam fora). */
  gastosPorMes: Record<Mes, Centavos>
  /** Fatura do cartão que entra no plano de cada mês (seção 5.4). Mês ausente = 0. */
  faturas?: Record<Mes, Centavos>
  de: Mes
  ate: Mes
}

/**
 * Calcula o plano e o colchão de cada mês, de `de` até `ate`, em ordem: o saldo
 * do colchão de um mês depende do que aconteceu nos meses anteriores.
 */
export function simularMeses(entrada: EntradaSimulacao): MesSimulado[] {
  const { config, contas, categorias, planejados, de, ate } = entrada
  const meta = config.metaColchao ?? 0
  const resultado: MesSimulado[] = []
  let saldo = 0

  for (let i = 0; i <= mesesEntre(de, ate); i++) {
    const mes = somarMeses(de, i)
    const planejamento = planejamentoDoMes(planejados, categorias, mes)
    const plano = calcularPlano({
      renda: config.renda,
      reservaMinima: config.reservaMinima,
      contas,
      categorias,
      mes,
      desejos: planejamento.desejos,
      colchao: aSepararNoColchao(planejamento.colchao, meta, saldo),
      fatura: entrada.faturas?.[mes] ?? 0,
    })

    const tetoTotal = Object.values(plano.tetos).reduce((soma, teto) => soma + teto, 0)
    const excesso = Math.max((entrada.gastosPorMes[mes] ?? 0) - tetoTotal, 0)
    const disponivel = saldo + plano.colchao
    const usado = Math.min(excesso, disponivel)
    const movimento = { saldoInicial: saldo, separado: plano.colchao, usado, saldoFinal: disponivel - usado }

    resultado.push({ mes, plano, planejamento, excesso, colchao: movimento })
    saldo = movimento.saldoFinal
  }
  return resultado
}

/**
 * Aviso de quem passou do plano (tela Início). O excesso sai primeiro do colchão.
 * "Você passou do plano em R$ 20,00. Isso sai do colchão, que fica com R$ 30,00."
 */
export function fraseExcessoDoPlano(excesso: Centavos, colchao: MovimentoDoColchao): string {
  const inicio = `Você passou do plano em ${formatarBRL(excesso)}`
  const daReserva = excesso - colchao.usado
  if (colchao.usado === 0) return `${inicio}. Isso sai da reserva deste mês.`
  if (daReserva === 0) return `${inicio}. Isso sai do colchão, que fica com ${formatarBRL(colchao.saldoFinal)}.`
  return `${inicio}: ${formatarBRL(colchao.usado)} saem do colchão e ${formatarBRL(daReserva)} da reserva deste mês.`
}
