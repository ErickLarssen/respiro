import { describe, expect, it } from 'vitest'
import { feriados, pascoa } from '../feriados'

describe('pascoa', () => {
  it('calcula a Páscoa de 2026 e 2027', () => {
    expect(pascoa(2026)).toBe('2026-04-05')
    expect(pascoa(2027)).toBe('2027-03-28')
  })

  it('acerta anos conhecidos', () => {
    expect(pascoa(2024)).toBe('2024-03-31')
    expect(pascoa(2025)).toBe('2025-04-20')
  })
})

describe('feriados', () => {
  it('inclui o Carnaval de 2027 (segunda e terça)', () => {
    const lista = feriados(2027)
    expect(lista.has('2027-02-08')).toBe(true)
    expect(lista.has('2027-02-09')).toBe(true)
  })

  it('inclui a Sexta-feira Santa', () => {
    expect(feriados(2026).has('2026-04-03')).toBe(true)
    expect(feriados(2027).has('2027-03-26')).toBe(true)
  })

  it('inclui os feriados fixos do ano pedido', () => {
    const lista = feriados(2026)
    expect(lista.has('2026-10-12')).toBe(true)
    expect(lista.has('2026-11-02')).toBe(true)
    expect(lista.has('2026-11-20')).toBe(true)
    expect(lista.has('2027-01-01')).toBe(false)
  })

  it('tem 12 feriados por ano', () => {
    expect(feriados(2026).size).toBe(12)
  })
})
