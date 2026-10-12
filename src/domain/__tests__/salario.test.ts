import { describe, expect, it } from 'vitest'
import { diaDoSalario, diasUteisDoMes, ehDiaUtil, proximoSalario } from '../salario'

describe('ehDiaUtil', () => {
  it('fim de semana não é dia útil', () => {
    expect(ehDiaUtil('2026-10-10')).toBe(false) // sábado
    expect(ehDiaUtil('2026-10-11')).toBe(false) // domingo
  })

  it('feriado não é dia útil', () => {
    expect(ehDiaUtil('2026-10-12')).toBe(false)
  })

  it('segunda a sexta sem feriado é dia útil', () => {
    expect(ehDiaUtil('2026-10-13')).toBe(true)
  })
})

describe('diaDoSalario (10º dia útil)', () => {
  it.each([
    ['2026-10', '2026-10-15'], // pula 12/10 (feriado, segunda)
    ['2026-11', '2026-11-16'], // pula 02/11
    ['2026-12', '2026-12-14'],
    ['2027-01', '2027-01-15'],
    ['2027-02', '2027-02-16'], // Carnaval em 08 e 09/02
    ['2027-03', '2027-03-12'],
  ])('%s → %s', (mes, esperado) => {
    expect(diaDoSalario(mes, 10)).toBe(esperado)
  })

  it('sem o Carnaval, fevereiro de 2027 daria 12/02', () => {
    // Prova de que o Carnaval faz diferença: 12/02 é o 8º dia útil, não o 10º.
    expect(diasUteisDoMes('2027-02').indexOf('2027-02-12')).toBe(7)
  })

  it('usa o último dia útil quando o mês não tem N dias úteis', () => {
    expect(diasUteisDoMes('2027-02')).toHaveLength(18)
    expect(diaDoSalario('2027-02', 20)).toBe('2027-02-26')
  })

  it('o 1º dia útil pula o feriado de Ano Novo', () => {
    expect(diaDoSalario('2027-01', 1)).toBe('2027-01-04')
  })
})

describe('proximoSalario', () => {
  it('devolve o deste mês se ainda não chegou', () => {
    expect(proximoSalario('2026-10-11', 10)).toBe('2026-10-15')
  })

  it('devolve o do mês seguinte se já passou', () => {
    expect(proximoSalario('2026-10-20', 10)).toBe('2026-11-16')
  })

  it('no próprio dia do salário, devolve hoje', () => {
    expect(proximoSalario('2026-10-15', 10)).toBe('2026-10-15')
  })

  it('vira o ano', () => {
    expect(proximoSalario('2026-12-20', 10)).toBe('2027-01-15')
  })
})
