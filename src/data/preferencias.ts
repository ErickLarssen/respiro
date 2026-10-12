import type { FormaPagamento } from '../domain/tipos'

// Preferências pequenas da interface, guardadas no localStorage do navegador.
// Não são dados financeiros: se o navegador bloquear o localStorage (aba anônima,
// por exemplo), o app funciona igual, só não lembra a escolha.

const CHAVE_FORMA = 'respiro:ultimaForma'
const FORMAS: FormaPagamento[] = ['pix', 'debito', 'dinheiro', 'credito']

export function lerUltimaForma(): FormaPagamento {
  try {
    const salva = localStorage.getItem(CHAVE_FORMA)
    return FORMAS.find((forma) => forma === salva) ?? 'pix'
  } catch {
    return 'pix'
  }
}

export function salvarUltimaForma(forma: FormaPagamento): void {
  try {
    localStorage.setItem(CHAVE_FORMA, forma)
  } catch {
    // sem localStorage: segue sem lembrar
  }
}
