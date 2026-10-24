import { contaNoTeto } from './credito'
import { diaDaData, diasNoMes, mesDaData } from './datas'
import { estadoDaCategoria, type EstadoCategoria } from './estado'
import type { Cartao, Centavos, DataISO, Gasto, Mes, Plano } from './tipos'

// Resumo do mês para a tela Início. Regras: docs/03-regras-de-negocio.md, seção 4.
// Com cartão cadastrado, compras no crédito pela regra da fatura (seção 5.5) não gastam
// o teto: aparecem à parte, em `noCredito`.

export { estadoDaCategoria, type EstadoCategoria } from './estado'

/** Id usado para gastos fora do plano (escolhidos assim ou de categoria apagada). */
export const FORA_DO_PLANO = 'fora'

export interface ResumoCategoria {
  id: string
  teto: Centavos
  gasto: Centavos // o que gasta o teto
  restante: Centavos // pode ser negativo
  estado: EstadoCategoria
  noCredito: Centavos // compras no crédito pela regra da fatura (não gastam o teto)
}

export interface ResumoDoMes {
  tetoTotal: Centavos
  gastoTotal: Centavos // o que gasta os tetos, inclusive "fora do plano"
  gastoNoCredito: Centavos // compras no crédito pela regra da fatura
  restante: Centavos // tetoTotal − gastoTotal; pode ser negativo
  porDia: Centavos | null // só no mês de hoje
  diasRestantes: number | null // só no mês de hoje; conta hoje
  categorias: ResumoCategoria[] // na ordem do plano; "fora" no fim, se houver
}

/** Soma dos gastos do mês, agrupados pelo id da categoria. */
export function gastoPorCategoria(gastos: Gasto[], mes: Mes): Record<string, Centavos> {
  const soma: Record<string, Centavos> = {}
  for (const gasto of gastos) {
    if (mesDaData(gasto.data) !== mes) continue
    soma[gasto.categoriaId] = (soma[gasto.categoriaId] ?? 0) + gasto.valor
  }
  return soma
}

function resumirCategoria(id: string, teto: Centavos, gasto: Centavos, noCredito: Centavos): ResumoCategoria {
  return { id, teto, gasto, restante: teto - gasto, estado: estadoDaCategoria(teto, gasto), noCredito }
}

function somar(valores: Record<string, Centavos>, filtro: (id: string) => boolean = () => true): Centavos {
  return Object.entries(valores)
    .filter(([id]) => filtro(id))
    .reduce((soma, [, valor]) => soma + valor, 0)
}

export function resumoDoMes(entrada: {
  plano: Plano
  gastos: Gasto[]
  mes: Mes
  hoje: DataISO
  cartao?: Cartao
}): ResumoDoMes {
  const { plano, gastos, mes, hoje, cartao } = entrada
  const doTeto = gastoPorCategoria(
    gastos.filter((gasto) => contaNoTeto(gasto, cartao)),
    mes,
  )
  const doCredito = gastoPorCategoria(
    gastos.filter((gasto) => !contaNoTeto(gasto, cartao)),
    mes,
  )

  const categorias = Object.entries(plano.tetos).map(([id, teto]) =>
    resumirCategoria(id, teto, doTeto[id] ?? 0, doCredito[id] ?? 0),
  )

  // Tudo que não é de uma categoria do plano (inclusive categoria apagada) é "fora do plano".
  const ehFora = (id: string) => !Object.hasOwn(plano.tetos, id)
  const fora = somar(doTeto, ehFora)
  const foraNoCredito = somar(doCredito, ehFora)
  if (fora > 0 || foraNoCredito > 0) categorias.push(resumirCategoria(FORA_DO_PLANO, 0, fora, foraNoCredito))

  const tetoTotal = Object.values(plano.tetos).reduce((soma, teto) => soma + teto, 0)
  const gastoTotal = somar(doTeto)
  const restante = tetoTotal - gastoTotal

  let porDia: Centavos | null = null
  let diasRestantes: number | null = null
  if (mesDaData(hoje) === mes) {
    diasRestantes = diasNoMes(mes) - diaDaData(hoje) + 1
    porDia = Math.floor(Math.max(restante, 0) / diasRestantes)
  }

  return { tetoTotal, gastoTotal, gastoNoCredito: somar(doCredito), restante, porDia, diasRestantes, categorias }
}
