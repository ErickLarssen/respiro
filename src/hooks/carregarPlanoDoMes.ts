import { listarCategorias, listarContas, listarGastosEntre, listarPlanosDoMes, obterConfig } from '../data/repositorio'
import { gastosPorMes, mesDeInicio, simularMeses, type MovimentoDoColchao } from '../domain/colchao'
import { montarData } from '../domain/datas'
import type { PlanejamentoEfetivo } from '../domain/planejamento'
import type { Categoria, Centavos, Config, Conta, Mes, MesPlanejado, Plano } from '../domain/tipos'

// Junta banco + domínio para um mês: o plano calculado (com o plano salvo do mês
// e o colchão) e tudo o que as telas precisam ao redor dele.

export interface PlanoDoMes {
  plano: Plano
  config: Config
  contas: Conta[] // pela ordem
  categorias: Categoria[] // pela ordem; a tela usa para mostrar nome e cor de cada teto
  planejados: MesPlanejado[] // todos os planos salvos
  planejamento: PlanejamentoEfetivo // o que vale neste mês (e de onde veio)
  colchao: MovimentoDoColchao // saldo e movimento do colchão neste mês
  excesso: Centavos // quanto os gastos do mês passaram dos tetos
  gastosPorMes: Record<Mes, Centavos> // desde o início (para a projeção)
}

/** null se ainda não há config (primeiro uso). */
export async function carregarPlanoDoMes(mes: Mes): Promise<PlanoDoMes | null> {
  const config = await obterConfig()
  if (!config) return null

  // O colchão de um mês depende dos meses anteriores: simulamos desde o início do app.
  const inicio = mesDeInicio(config)
  const de = inicio < mes ? inicio : mes
  const [contas, categorias, planejados, gastos] = await Promise.all([
    listarContas(),
    listarCategorias(),
    listarPlanosDoMes(),
    listarGastosEntre(montarData(de, 1), '9999-12-31'),
  ])
  const porMes = gastosPorMes(gastos)
  const simulados = simularMeses({ config, contas, categorias, planejados, gastosPorMes: porMes, de, ate: mes })
  const doMes = simulados.at(-1)
  if (!doMes) return null // não acontece: de ≤ mes, então há pelo menos um mês

  return {
    plano: doMes.plano,
    config,
    contas,
    categorias,
    planejados,
    planejamento: doMes.planejamento,
    colchao: doMes.colchao,
    excesso: doMes.excesso,
    gastosPorMes: porMes,
  }
}
