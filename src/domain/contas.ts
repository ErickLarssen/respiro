import { mesesEntre, somarMeses } from './datas'
import type { Centavos, Conta, Mes } from './tipos'

/** Recorrente entra em todo mês; parcela entra até `ultimaParcela`, inclusive. */
export function contaAtivaNoMes(conta: Conta, mes: Mes): boolean {
  if (conta.tipo === 'recorrente') return true
  return conta.ultimaParcela !== undefined && mes <= conta.ultimaParcela
}

/** Soma das contas ativas no mês. */
export function totalContasFixas(contas: Conta[], mes: Mes): Centavos {
  return contas
    .filter((conta) => contaAtivaNoMes(conta, mes))
    .reduce((soma, conta) => soma + conta.valor, 0)
}

/**
 * Quantas parcelas faltam, contando a do mês atual. Mínimo 0.
 * Conta recorrente não tem fim: devolve null.
 */
export function parcelasRestantes(conta: Conta, mesAtual: Mes): number | null {
  if (conta.tipo === 'recorrente') return null
  if (conta.ultimaParcela === undefined) return 0
  return Math.max(mesesEntre(mesAtual, conta.ultimaParcela) + 1, 0)
}

/**
 * Converte o que o usuário digita ("faltam 8 parcelas") no mês da última parcela.
 * ("2026-10", 8) → "2027-05"
 */
export function ultimaParcelaPorRestantes(mesAtual: Mes, restantes: number): Mes {
  return somarMeses(mesAtual, restantes - 1)
}
