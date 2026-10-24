import type { DadosAviso } from '../components/ui/Aviso'
import { adicionarGasto, listarGastosDoMes, salvarGasto, type NovoGasto } from '../data/repositorio'
import { avisoCompraNoCredito, contaNoTeto, faturaConhecida, faturaDaCompra, limiteLivre } from '../domain/credito'
import { mesDaData, nomeDoMes } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { FORA_DO_PLANO, resumoDoMes } from '../domain/resumo'
import type { DataISO, Gasto } from '../domain/tipos'
import { carregarPlanoDoMes } from './carregarPlanoDoMes'

export type AvisoDoGasto = Omit<DadosAviso, 'id'>

/**
 * Salva o gasto e devolve o aviso para mostrar (docs/05-telas-e-fluxos.md):
 * - no crédito (regra da fatura): fatura em que caiu e limite livre, ou alerta de
 *   orçamento/limite (docs/03-regras-de-negocio.md, seção 5.6);
 * - normalmente, "Gasto anotado: R$ 35,00 em Lazer";
 * - se a categoria ficou em atenção (80% ou mais do teto), "Lazer: restam R$ 5,00 este mês";
 * - se passou do teto, "Lazer: passou R$ 5,00 do teto este mês".
 */
export async function anotarGasto(novo: NovoGasto, hoje: DataISO): Promise<AvisoDoGasto> {
  const gasto = await adicionarGasto(novo)
  const mes = mesDaData(gasto.data)
  // O mesmo cálculo da tela (com o plano salvo do mês, o colchão e o cartão)
  const [dados, gastosDoMes] = await Promise.all([carregarPlanoDoMes(mes, hoje), listarGastosDoMes(mes)])
  if (!dados) return { tom: 'ok', texto: `Gasto anotado: ${formatarBRL(gasto.valor)}` }

  const { cartao } = dados.config
  if (cartao && !contaNoTeto(gasto, cartao)) {
    const fatura = faturaDaCompra(gasto.data, cartao)
    // Compra com data futura: o limite é visto no dia dela
    const dia = gasto.data > hoje ? gasto.data : hoje
    return avisoCompraNoCredito({
      valor: gasto.valor,
      nomeDaFatura: nomeDoMes(fatura),
      fatura: faturaConhecida(dados.gastos, cartao, fatura),
      cartao,
      livre: limiteLivre(dados.gastos, dados.contas, cartao, dia),
    })
  }

  const categoria = dados.categorias.find((c) => c.id === gasto.categoriaId)
  const nome = categoria?.nome ?? 'Fora do plano'
  const anotado: AvisoDoGasto = { tom: 'ok', texto: `Gasto anotado: ${formatarBRL(gasto.valor)} em ${nome}` }
  if (!categoria || gasto.categoriaId === FORA_DO_PLANO) return anotado

  const resumo = resumoDoMes({ plano: dados.plano, gastos: gastosDoMes, mes, hoje: gasto.data, cartao })
  const linha = resumo.categorias.find((c) => c.id === categoria.id)

  if (linha?.estado === 'estourou') {
    return { tom: 'atencao', texto: `${nome}: passou ${formatarBRL(-linha.restante)} do teto este mês` }
  }
  if (linha?.estado === 'atencao') {
    return { tom: 'atencao', texto: `${nome}: restam ${formatarBRL(linha.restante)} este mês` }
  }
  return anotado
}

/** Salva as mudanças de um gasto que já existe. */
export async function editarGasto(gasto: Gasto): Promise<AvisoDoGasto> {
  await salvarGasto(gasto)
  return { tom: 'ok', texto: `Gasto atualizado: ${formatarBRL(gasto.valor)}` }
}
