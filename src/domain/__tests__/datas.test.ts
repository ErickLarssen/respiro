import { describe, expect, it } from 'vitest'
import {
  anoDoMes,
  diaDaData,
  diaDaSemana,
  diasEntre,
  diasNoMes,
  mesDaData,
  mesesEntre,
  montarData,
  montarMes,
  somarDias,
  somarMeses,
} from '../datas'

describe('montar e separar meses e datas', () => {
  it('monta com zero à esquerda', () => {
    expect(montarMes(2026, 3)).toBe('2026-03')
    expect(montarData('2026-03', 5)).toBe('2026-03-05')
  })

  it('separa as partes', () => {
    expect(mesDaData('2026-10-15')).toBe('2026-10')
    expect(diaDaData('2026-10-05')).toBe(5)
    expect(anoDoMes('2027-02')).toBe(2027)
  })
})

describe('somarMeses', () => {
  it('soma dentro do ano', () => {
    expect(somarMeses('2026-10', 1)).toBe('2026-11')
  })

  it('vira o ano', () => {
    expect(somarMeses('2026-11', 3)).toBe('2027-02')
    expect(somarMeses('2026-10', 12)).toBe('2027-10')
  })

  it('subtrai com n negativo', () => {
    expect(somarMeses('2027-01', -1)).toBe('2026-12')
  })

  it('n zero devolve o mesmo mês', () => {
    expect(somarMeses('2026-10', 0)).toBe('2026-10')
  })
})

describe('mesesEntre', () => {
  it('conta meses entre dois meses', () => {
    expect(mesesEntre('2026-10', '2027-05')).toBe(7)
    expect(mesesEntre('2026-10', '2026-10')).toBe(0)
    expect(mesesEntre('2026-11', '2026-10')).toBe(-1)
  })
})

describe('diasNoMes', () => {
  it('sabe quantos dias cada mês tem', () => {
    expect(diasNoMes('2026-10')).toBe(31)
    expect(diasNoMes('2026-11')).toBe(30)
    expect(diasNoMes('2027-02')).toBe(28)
  })

  it('considera ano bissexto', () => {
    expect(diasNoMes('2028-02')).toBe(29)
  })
})

describe('somarDias e diasEntre', () => {
  it('soma dias virando o mês e o ano', () => {
    expect(somarDias('2026-10-30', 3)).toBe('2026-11-02')
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2027-03-28', -2)).toBe('2027-03-26')
  })

  it('conta dias entre duas datas', () => {
    expect(diasEntre('2026-10-11', '2026-10-15')).toBe(4)
    expect(diasEntre('2026-10-15', '2026-10-15')).toBe(0)
  })
})

describe('diaDaSemana', () => {
  it('não depende do fuso horário', () => {
    expect(diaDaSemana('2026-10-11')).toBe(0) // domingo
    expect(diaDaSemana('2026-10-12')).toBe(1) // segunda
    expect(diaDaSemana('2026-10-15')).toBe(4) // quinta
  })
})
