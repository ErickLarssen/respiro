import { contaAtivaNoMes, parcelasRestantes } from './contas'
import { mesDaData } from './datas'
import type { Centavos, Conta, Gasto, Mes } from './tipos'

// Cartão de crédito. Regras: docs/03-regras-de-negocio.md, seção 5.
// Uma compra no crédito conta no mês em que foi feita; a fatura vence no dia 20 do mês seguinte.

/** Soma das compras no crédito feitas no mês. */
export function gastoNoCredito(gastos: Gasto[], mes: Mes): Centavos {
  return gastos
    .filter((gasto) => gasto.forma === 'credito' && mesDaData(gasto.data) === mes)
    .reduce((soma, gasto) => soma + gasto.valor, 0)
}

/**
 * Quanto as contas fixas pagas no crédito ocupam do limite no mês.
 * Parcela: todas as parcelas que ainda faltam (contando a do mês), como o banco calcula.
 * Recorrente: só a cobrança do mês.
 */
export function contasNoCredito(contas: Conta[], mes: Mes): Centavos {
  return contas
    .filter((conta) => conta.pagaNoCredito)
    .reduce((soma, conta) => {
      if (conta.tipo === 'parcela') return soma + conta.valor * (parcelasRestantes(conta, mes) ?? 0)
      return soma + (contaAtivaNoMes(conta, mes) ? conta.valor : 0)
    }, 0)
}

/** Limite livre = limite − compras no crédito do mês − contas fixas no crédito. Pode ser negativo. */
export function limiteLivre(entrada: { limite: Centavos; gastos: Gasto[]; contas: Conta[]; mes: Mes }): Centavos {
  const { limite, gastos, contas, mes } = entrada
  return limite - gastoNoCredito(gastos, mes) - contasNoCredito(contas, mes)
}
