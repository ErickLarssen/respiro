import { describe, expect, it } from 'vitest'
import { formatarBRL, lerValorDigitado, valorParaDigitar } from '../dinheiro'

// O Intl separa "R$" do número com um espaço que não quebra linha.
const ESPACO = ' '

describe('formatarBRL', () => {
  it('formata centavos como reais', () => {
    expect(formatarBRL(160600)).toBe(`R$${ESPACO}1.606,00`)
    expect(formatarBRL(1606)).toBe(`R$${ESPACO}16,06`)
    expect(formatarBRL(5)).toBe(`R$${ESPACO}0,05`)
    expect(formatarBRL(0)).toBe(`R$${ESPACO}0,00`)
  })

  it('mostra valores negativos com sinal', () => {
    expect(formatarBRL(-14199)).toBe(`-R$${ESPACO}141,99`)
  })
})

describe('lerValorDigitado', () => {
  it('lê reais inteiros', () => {
    expect(lerValorDigitado('35')).toBe(3500)
  })

  it('lê centavos com vírgula', () => {
    expect(lerValorDigitado('35,5')).toBe(3550)
    expect(lerValorDigitado('35,50')).toBe(3550)
    expect(lerValorDigitado('0,05')).toBe(5)
  })

  it('aceita ponto como separador de centavos', () => {
    expect(lerValorDigitado('35.5')).toBe(3550)
    expect(lerValorDigitado('35.50')).toBe(3550)
  })

  it('ignora espaços nas pontas', () => {
    expect(lerValorDigitado(' 35,50 ')).toBe(3550)
  })

  it('lê zero (quem recusa zero é a tela)', () => {
    expect(lerValorDigitado('0')).toBe(0)
  })

  it('devolve null para texto inválido', () => {
    expect(lerValorDigitado('')).toBeNull()
    expect(lerValorDigitado('abc')).toBeNull()
    expect(lerValorDigitado('-35')).toBeNull()
    expect(lerValorDigitado('35,')).toBeNull()
    expect(lerValorDigitado(',50')).toBeNull()
    expect(lerValorDigitado('35,505')).toBeNull()
    expect(lerValorDigitado('R$ 35')).toBeNull()
  })

  it('não aceita separador de milhar', () => {
    expect(lerValorDigitado('1.606,00')).toBeNull()
    expect(lerValorDigitado('1606')).toBe(160600)
  })
})

describe('valorParaDigitar', () => {
  it('escreve centavos como o usuário digitaria', () => {
    expect(valorParaDigitar(3550)).toBe('35,50')
    expect(valorParaDigitar(5)).toBe('0,05')
    expect(valorParaDigitar(160600)).toBe('1606')
    expect(valorParaDigitar(0)).toBe('0')
  })

  it('é o inverso de lerValorDigitado', () => {
    for (const valor of [0, 1, 99, 100, 3550, 5209, 160600]) {
      expect(lerValorDigitado(valorParaDigitar(valor))).toBe(valor)
    }
  })
})
