import type { DadosAviso } from '../components/ui/Aviso'
import { adicionarGasto, listarGastosDoMes, salvarGasto, type NovoGasto } from '../data/repositorio'
import { mesDaData } from '../domain/datas'
import { formatarBRL } from '../domain/dinheiro'
import { FORA_DO_PLANO, resumoDoMes } from '../domain/resumo'
import type { Gasto } from '../domain/tipos'
import { carregarPlanoDoMes } from './carregarPlanoDoMes'

export type AvisoDoGasto = Omit<DadosAviso, 'id'>

/**
 * Salva o gasto e devolve o aviso para mostrar (docs/05-telas-e-fluxos.md):
 * - normalmente, "Gasto anotado: R$ 35,00 em Lazer";
 * - se a categoria ficou em atenção (80% ou mais do teto), "Lazer: restam R$ 5,00 este mês";
 * - se passou do teto, "Lazer: passou R$ 5,00 do teto este mês".
 */
export async function anotarGasto(novo: NovoGasto): Promise<AvisoDoGasto> {
  const gasto = await adicionarGasto(novo)
  const mes = mesDaData(gasto.data)
  // O mesmo cálculo da tela (com o plano salvo do mês e o colchão)
  const [dados, gastos] = await Promise.all([carregarPlanoDoMes(mes), listarGastosDoMes(mes)])

  const categoria = dados?.categorias.find((c) => c.id === gasto.categoriaId)
  const nome = categoria?.nome ?? 'Fora do plano'
  const anotado: AvisoDoGasto = { tom: 'ok', texto: `Gasto anotado: ${formatarBRL(gasto.valor)} em ${nome}` }
  if (!dados || !categoria || gasto.categoriaId === FORA_DO_PLANO) return anotado

  const resumo = resumoDoMes({ plano: dados.plano, gastos, mes, hoje: gasto.data })
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
