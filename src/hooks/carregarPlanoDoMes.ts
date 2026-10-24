import { listarCategorias, listarContas, listarGastosEntre, listarPlanosDoMes, obterConfig } from '../data/repositorio'
import { gastosPorMes, mesDeInicio, simularMeses, type MovimentoDoColchao } from '../domain/colchao'
import {
  contaNoTeto,
  dataDeFechamento,
  dataDeVencimento,
  estadoDoOrcamento,
  faturaConhecida,
  faturaDaCompra,
  faturaNoBanco,
  faturasDoPeriodo,
  limiteLivre,
  type FaturaNoPlano,
} from '../domain/credito'
import { montarData, somarMeses } from '../domain/datas'
import type { EstadoCategoria } from '../domain/estado'
import type { PlanejamentoEfetivo } from '../domain/planejamento'
import type { Cartao, Categoria, Centavos, Config, Conta, DataISO, Gasto, Mes, MesPlanejado, Plano } from '../domain/tipos'

// Junta banco + domínio para um mês: o plano calculado (com o plano salvo do mês,
// o colchão e a fatura do cartão) e tudo o que as telas precisam ao redor dele.

/** Uma fatura vista pelas telas: o mês de vencimento, as datas e os valores. */
export interface FaturaVista {
  mes: Mes // mês do vencimento
  fechamento: DataISO
  vencimento: DataISO
  valor: Centavos // compras pela regra da fatura (o que entra no plano quando fecha)
  noBanco: Centavos // como o banco vai cobrar: + regra anterior + contas no crédito
  regraAnterior: Centavos // parte que já foi descontada nos tetos (transição)
}

export interface ResumoCartao {
  cartao: Cartao
  aberta: FaturaVista // a fatura que recebe as compras de hoje
  aPagar: FaturaVista | null // fatura já fechada que ainda não venceu
  limiteLivre: Centavos
  estadoOrcamento: EstadoCategoria // da fatura aberta
}

export interface PlanoDoMes {
  plano: Plano
  config: Config
  contas: Conta[] // pela ordem
  categorias: Categoria[] // pela ordem; a tela usa para mostrar nome e cor de cada teto
  planejados: MesPlanejado[] // todos os planos salvos
  planejamento: PlanejamentoEfetivo // o que vale neste mês (e de onde veio)
  colchao: MovimentoDoColchao // saldo e movimento do colchão neste mês
  excesso: Centavos // quanto os gastos que saem dos tetos passaram deles
  gastos: Gasto[] // todos, desde o início do app
  gastosPorMes: Record<Mes, Centavos> // só os que saem dos tetos (para a projeção)
  faturas: Record<Mes, FaturaNoPlano> // fatura no plano de cada mês, até 12 meses à frente
  faturaDoMes: FaturaNoPlano // a fatura que entrou no plano deste mês
  cartao: ResumoCartao | null // null = sem cartão cadastrado
}

function verFatura(gastos: Gasto[], contas: Conta[], cartao: Cartao, mes: Mes): FaturaVista {
  const banco = faturaNoBanco(gastos, contas, cartao, mes)
  return {
    mes,
    fechamento: dataDeFechamento(mes, cartao),
    vencimento: dataDeVencimento(mes, cartao),
    valor: faturaConhecida(gastos, cartao, mes),
    noBanco: banco.total,
    regraAnterior: banco.regraAnterior,
  }
}

/** O cartão visto hoje: fatura aberta, fatura a pagar e limite livre. */
export function resumirCartao(gastos: Gasto[], contas: Conta[], cartao: Cartao, hoje: DataISO): ResumoCartao {
  const mesAberta = faturaDaCompra(hoje, cartao)
  const aberta = verFatura(gastos, contas, cartao, mesAberta)
  const anterior = somarMeses(mesAberta, -1)
  // A fatura anterior à aberta já fechou; se ainda não venceu, está "a pagar".
  const aPagar = dataDeVencimento(anterior, cartao) >= hoje ? verFatura(gastos, contas, cartao, anterior) : null
  return {
    cartao,
    aberta,
    aPagar,
    limiteLivre: limiteLivre(gastos, contas, cartao, hoje),
    estadoOrcamento: estadoDoOrcamento(aberta.valor, cartao),
  }
}

/** null se ainda não há config (primeiro uso). */
export async function carregarPlanoDoMes(mes: Mes, hoje: DataISO): Promise<PlanoDoMes | null> {
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
  const { cartao } = config

  // Compras no crédito pela regra da fatura não saem dos tetos (seção 5.5)
  const porMes = gastosPorMes(gastos.filter((gasto) => contaNoTeto(gasto, cartao)))
  const faturas = faturasDoPeriodo(gastos, cartao, de, somarMeses(mes, 11), hoje)
  const valoresDasFaturas = Object.fromEntries(Object.entries(faturas).map(([m, f]) => [m, f.valor]))

  const simulados = simularMeses({
    config,
    contas,
    categorias,
    planejados,
    gastosPorMes: porMes,
    faturas: valoresDasFaturas,
    de,
    ate: mes,
  })
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
    gastos,
    gastosPorMes: porMes,
    faturas,
    faturaDoMes: faturas[mes] ?? { valor: 0, estimada: false },
    cartao: cartao ? resumirCartao(gastos, contas, cartao, hoje) : null,
  }
}
