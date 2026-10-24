import { mesDeInicio, simularMeses } from './colchao'
import { somarMeses } from './datas'
import type { Categoria, Centavos, Config, Conta, Mes, MesPlanejado } from './tipos'

// Projeção da reserva para a tela Plano. Regras: docs/03-regras-de-negocio.md, seção 6.

export interface MesProjetado {
  mes: Mes
  contasFixas: Centavos
  reserva: Centavos
  acumulado: Centavos // soma das reservas desde o mês inicial, inclusive este
  colchao: Centavos // separado no colchão neste mês
  saldoColchao: Centavos // saldo do colchão no fim do mês
}

export interface ExtrasProjecao {
  /** Planos salvos de cada mês (sem eles, valem os desejos das categorias). */
  planejados?: MesPlanejado[]
  /** Gastos já feitos por mês: afetam o saldo do colchão dos meses passados e do atual. */
  gastosPorMes?: Record<Mes, Centavos>
}

/**
 * Reserva e colchão de cada mês a partir de `mesInicial`. O colchão é simulado
 * desde o mês em que o app começou, porque o saldo depende dos meses anteriores.
 */
export function projecao(
  config: Config,
  contas: Conta[],
  categorias: Categoria[],
  mesInicial: Mes,
  meses = 12,
  extras: ExtrasProjecao = {},
): MesProjetado[] {
  const inicio = mesDeInicio(config)
  const de = inicio < mesInicial ? inicio : mesInicial
  const simulados = simularMeses({
    config,
    contas,
    categorias,
    planejados: extras.planejados ?? [],
    gastosPorMes: extras.gastosPorMes ?? {},
    de,
    ate: somarMeses(mesInicial, meses - 1),
  }).filter((simulado) => simulado.mes >= mesInicial)

  let acumulado = 0
  return simulados.map(({ mes, plano, colchao }) => {
    acumulado += plano.reserva
    return {
      mes,
      contasFixas: plano.contasFixas,
      reserva: plano.reserva,
      acumulado,
      colchao: colchao.separado,
      saldoColchao: colchao.saldoFinal,
    }
  })
}
