import type { Centavos } from './tipos'

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 160600 → "R$ 1.606,00". O espaço depois de "R$" é um espaço que não quebra linha (U+00A0). */
export function formatarBRL(valor: Centavos): string {
  return formatador.format(valor / 100)
}

// Reais, e opcionalmente vírgula ou ponto seguido de 1 ou 2 dígitos de centavos.
// Ponto também vale como decimal porque alguns teclados numéricos de celular não têm vírgula.
const VALOR_DIGITADO = /^(\d+)(?:[.,](\d{1,2}))?$/

/**
 * Converte o texto digitado em centavos: "35" → 3500, "35,5" → 3550, "35.50" → 3550.
 * Texto inválido (vazio, letras, negativo, separador de milhar) → null.
 */
export function lerValorDigitado(texto: string): Centavos | null {
  const partes = VALOR_DIGITADO.exec(texto.trim())
  if (!partes) return null

  const reais = Number(partes[1])
  const centavos = Number((partes[2] ?? '').padEnd(2, '0'))
  const total = reais * 100 + centavos
  return Number.isSafeInteger(total) ? total : null
}
