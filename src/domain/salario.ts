import { anoDoMes, diaDaSemana, diasNoMes, mesDaData, montarData, somarMeses } from './datas'
import { feriados } from './feriados'
import type { DataISO, Mes } from './tipos'

const DOMINGO = 0
const SABADO = 6

/** Dia útil = segunda a sexta que não seja feriado nacional. */
export function ehDiaUtil(data: DataISO): boolean {
  const semana = diaDaSemana(data)
  if (semana === DOMINGO || semana === SABADO) return false
  return !feriados(anoDoMes(mesDaData(data))).has(data)
}

/** Todos os dias úteis do mês, em ordem. */
export function diasUteisDoMes(mes: Mes): DataISO[] {
  const dias: DataISO[] = []
  for (let dia = 1; dia <= diasNoMes(mes); dia++) {
    const data = montarData(mes, dia)
    if (ehDiaUtil(data)) dias.push(data)
  }
  return dias
}

/**
 * Data em que o salário cai: o N-ésimo dia útil do mês.
 * Se o mês tiver menos de N dias úteis, devolve o último dia útil.
 * ("2026-10", 10) → "2026-10-15"
 */
export function diaDoSalario(mes: Mes, n: number): DataISO {
  const uteis = diasUteisDoMes(mes)
  const indice = Math.min(Math.max(n, 1), uteis.length) - 1
  const dia = uteis[indice]
  if (dia === undefined) throw new Error(`O mês ${mes} não tem dias úteis.`)
  return dia
}

/**
 * Próximo dia de salário a partir de hoje. Se o salário deste mês já passou,
 * devolve o do mês seguinte. No próprio dia do salário, devolve hoje.
 */
export function proximoSalario(hoje: DataISO, n: number): DataISO {
  const mes = mesDaData(hoje)
  const desteMes = diaDoSalario(mes, n)
  return desteMes >= hoje ? desteMes : diaDoSalario(somarMeses(mes, 1), n)
}
