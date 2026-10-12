import { diaDaData, diasNoMes, mesDaData } from './datas'
import type { Centavos, DataISO, Gasto, Mes, Plano } from './tipos'

// Resumo do mês para a tela Início. Regras: docs/03-regras-de-negocio.md, seção 4.

/** Id usado para gastos fora do plano (escolhidos assim ou de categoria apagada). */
export const FORA_DO_PLANO = 'fora'

/** A partir de 80% do teto, a categoria entra em "atenção". Em %, para comparar só inteiros. */
const LIMITE_ATENCAO = 80

export type EstadoCategoria = 'ok' | 'atencao' | 'estourou'

export interface ResumoCategoria {
  id: string
  teto: Centavos
  gasto: Centavos
  restante: Centavos // pode ser negativo
  estado: EstadoCategoria
}

export interface ResumoDoMes {
  tetoTotal: Centavos
  gastoTotal: Centavos // inclusive "fora do plano"
  restante: Centavos // pode ser negativo
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

export function estadoDaCategoria(teto: Centavos, gasto: Centavos): EstadoCategoria {
  if (gasto > teto) return 'estourou'
  if (teto > 0 && gasto * 100 >= teto * LIMITE_ATENCAO) return 'atencao'
  return 'ok'
}

function resumirCategoria(id: string, teto: Centavos, gasto: Centavos): ResumoCategoria {
  return { id, teto, gasto, restante: teto - gasto, estado: estadoDaCategoria(teto, gasto) }
}

export function resumoDoMes(entrada: {
  plano: Plano
  gastos: Gasto[]
  mes: Mes
  hoje: DataISO
}): ResumoDoMes {
  const { plano, gastos, mes, hoje } = entrada
  const porCategoria = gastoPorCategoria(gastos, mes)

  const categorias = Object.entries(plano.tetos).map(([id, teto]) =>
    resumirCategoria(id, teto, porCategoria[id] ?? 0),
  )

  // Tudo que não é de uma categoria do plano (inclusive categoria apagada) é "fora do plano".
  const fora = Object.entries(porCategoria)
    .filter(([id]) => !Object.hasOwn(plano.tetos, id))
    .reduce((soma, [, valor]) => soma + valor, 0)
  if (fora > 0) categorias.push(resumirCategoria(FORA_DO_PLANO, 0, fora))

  const tetoTotal = Object.values(plano.tetos).reduce((soma, teto) => soma + teto, 0)
  const gastoTotal = Object.values(porCategoria).reduce((soma, valor) => soma + valor, 0)
  const restante = tetoTotal - gastoTotal

  let porDia: Centavos | null = null
  let diasRestantes: number | null = null
  if (mesDaData(hoje) === mes) {
    diasRestantes = diasNoMes(mes) - diaDaData(hoje) + 1
    porDia = Math.floor(Math.max(restante, 0) / diasRestantes)
  }

  return { tetoTotal, gastoTotal, restante, porDia, diasRestantes, categorias }
}
