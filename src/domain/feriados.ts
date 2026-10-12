import { montarData, montarMes, somarDias } from './datas'
import type { DataISO } from './tipos'

// Feriados nacionais em que os bancos não abrem ("MM-DD").
const FERIADOS_FIXOS = [
  '01-01', // Confraternização Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '11-20', // Dia da Consciência Negra
  '12-25', // Natal
]

/**
 * Data da Páscoa no calendário gregoriano, pelo algoritmo de Meeus/Jones/Butcher.
 * 2027 → "2027-03-28"
 */
export function pascoa(ano: number): DataISO {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return montarData(montarMes(ano, mes), dia)
}

/** Todos os feriados do ano: os fixos, a Sexta-feira Santa e o Carnaval (segunda e terça). */
export function feriados(ano: number): Set<DataISO> {
  const domingoDePascoa = pascoa(ano)
  return new Set([
    ...FERIADOS_FIXOS.map((mesDia) => `${ano}-${mesDia}`),
    somarDias(domingoDePascoa, -2), // Sexta-feira Santa
    somarDias(domingoDePascoa, -48), // segunda de Carnaval
    somarDias(domingoDePascoa, -47), // terça de Carnaval
  ])
}
