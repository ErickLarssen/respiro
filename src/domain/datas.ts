import type { DataISO, Mes } from './tipos'

// Meses são "AAAA-MM" e datas são "AAAA-MM-DD". Quando precisamos do calendário
// (dia da semana, somar dias), usamos Date em UTC: assim o fuso horário do
// aparelho nunca empurra a data para o dia anterior.

const MS_POR_DIA = 24 * 60 * 60 * 1000

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

function partesDoMes(mes: Mes): [ano: number, mes: number] {
  const [ano, m] = mes.split('-').map(Number)
  return [ano ?? NaN, m ?? NaN]
}

function partesDaData(data: DataISO): [ano: number, mes: number, dia: number] {
  const [ano, m, dia] = data.split('-').map(Number)
  return [ano ?? NaN, m ?? NaN, dia ?? NaN]
}

function paraUTC(data: DataISO): number {
  const [ano, m, dia] = partesDaData(data)
  return Date.UTC(ano, m - 1, dia)
}

function deUTC(ms: number): DataISO {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`
}

/** (2026, 10) → "2026-10" */
export function montarMes(ano: number, mes: number): Mes {
  return `${ano}-${doisDigitos(mes)}`
}

/** ("2026-10", 15) → "2026-10-15" */
export function montarData(mes: Mes, dia: number): DataISO {
  return `${mes}-${doisDigitos(dia)}`
}

/** "2026-10-15" → "2026-10" */
export function mesDaData(data: DataISO): Mes {
  return data.slice(0, 7)
}

/** "2026-10-15" → 15 */
export function diaDaData(data: DataISO): number {
  return partesDaData(data)[2]
}

/** "2026-10" → 2026 */
export function anoDoMes(mes: Mes): number {
  return partesDoMes(mes)[0]
}

/** ("2026-11", 3) → "2027-02"; aceita n negativo. */
export function somarMeses(mes: Mes, n: number): Mes {
  const [ano, m] = partesDoMes(mes)
  const total = ano * 12 + (m - 1) + n
  return montarMes(Math.floor(total / 12), (total % 12) + 1)
}

/** Quantos meses vão de `de` até `ate`: ("2026-10", "2027-05") → 7. */
export function mesesEntre(de: Mes, ate: Mes): number {
  const [anoDe, mDe] = partesDoMes(de)
  const [anoAte, mAte] = partesDoMes(ate)
  return (anoAte - anoDe) * 12 + (mAte - mDe)
}

/** "2027-02" → 28; "2028-02" → 29 */
export function diasNoMes(mes: Mes): number {
  const [ano, m] = partesDoMes(mes)
  // Dia 0 do mês seguinte é o último dia deste mês.
  return new Date(Date.UTC(ano, m, 0)).getUTCDate()
}

/** ("2026-10-30", 3) → "2026-11-02"; aceita n negativo. */
export function somarDias(data: DataISO, n: number): DataISO {
  return deUTC(paraUTC(data) + n * MS_POR_DIA)
}

/** Quantos dias vão de `de` até `ate`: ("2026-10-11", "2026-10-15") → 4. */
export function diasEntre(de: DataISO, ate: DataISO): number {
  return Math.round((paraUTC(ate) - paraUTC(de)) / MS_POR_DIA)
}

/** 0 = domingo, 1 = segunda, ..., 6 = sábado. */
export function diaDaSemana(data: DataISO): number {
  return new Date(paraUTC(data)).getUTCDay()
}

// ---------- Textos para a interface (docs/06-convencoes.md) ----------
// Listas próprias em vez de Intl: o Intl escreve "qui." com ponto e varia entre navegadores.

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function nomeDoMesSozinho(mes: Mes): string {
  return MESES[partesDoMes(mes)[1] - 1] ?? ''
}

/** "2026-10" → "outubro de 2026" (títulos) */
export function mesPorExtenso(mes: Mes): string {
  return `${nomeDoMesSozinho(mes)} de ${anoDoMes(mes)}`
}

/** "2026-10" → "outubro" */
export function nomeDoMes(mes: Mes): string {
  return nomeDoMesSozinho(mes)
}

/** "2026-10" → "out 2026" (seletor de mês; a tela põe em caixa alta) */
export function mesCurto(mes: Mes): string {
  return `${nomeDoMesSozinho(mes).slice(0, 3)} ${anoDoMes(mes)}`
}

/** "2026-10-15" → "15/out" */
export function diaEMes(data: DataISO): string {
  return `${doisDigitos(diaDaData(data))}/${nomeDoMesSozinho(mesDaData(data)).slice(0, 3)}`
}

/** "2026-10-15" → "qui" */
export function semanaCurta(data: DataISO): string {
  return SEMANA[diaDaSemana(data)] ?? ''
}

/** "2026-10-15" → "qui, 15/out" (datas curtas) */
export function dataCurta(data: DataISO): string {
  return `${semanaCurta(data)}, ${diaEMes(data)}`
}
