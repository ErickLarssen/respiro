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

export interface FimDeParcela {
  conta: Conta
  ultimaParcela: Mes
  liberaEm: Mes // primeiro mês sem a parcela: é quando a reserva sobe
}

/**
 * Parcelas que ainda não acabaram em `mesAtual`, da que acaba primeiro para a última.
 * Ex.: "Notebook Dell: última em mai/27, libera R$ 395,00 a partir de jun/27".
 */
export function fimDasParcelas(contas: Conta[], mesAtual: Mes): FimDeParcela[] {
  return contas
    .filter((conta) => (parcelasRestantes(conta, mesAtual) ?? 0) > 0)
    .map((conta) => {
      const ultimaParcela = conta.ultimaParcela ?? mesAtual
      return { conta, ultimaParcela, liberaEm: somarMeses(ultimaParcela, 1) }
    })
    .sort((a, b) => a.ultimaParcela.localeCompare(b.ultimaParcela) || a.conta.ordem - b.conta.ordem)
}

/** Parcelas cuja última foi no mês anterior a `mes`: em `mes` a reserva sobe por causa delas. */
export function parcelasQueLiberamEm(contas: Conta[], mes: Mes): Conta[] {
  const mesAnterior = somarMeses(mes, -1)
  return contas.filter((conta) => conta.tipo === 'parcela' && conta.ultimaParcela === mesAnterior)
}
