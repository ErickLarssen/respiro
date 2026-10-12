import { somarMeses } from './datas'
import { calcularPlano } from './plano'
import type { Categoria, Centavos, Config, Conta, Mes } from './tipos'

// Projeção da reserva para a tela Plano. Regras: docs/03-regras-de-negocio.md, seção 6.

export interface MesProjetado {
  mes: Mes
  contasFixas: Centavos
  reserva: Centavos
  acumulado: Centavos // soma das reservas desde o mês inicial, inclusive este
}

/** Reserva de cada mês a partir de `mesInicial`, usando os desejos atuais. */
export function projecao(
  config: Config,
  contas: Conta[],
  categorias: Categoria[],
  mesInicial: Mes,
  meses = 12,
): MesProjetado[] {
  let acumulado = 0
  return Array.from({ length: meses }, (_, i) => {
    const plano = calcularPlano({
      renda: config.renda,
      reservaMinima: config.reservaMinima,
      contas,
      categorias,
      mes: somarMeses(mesInicial, i),
    })
    acumulado += plano.reserva
    return { mes: plano.mes, contasFixas: plano.contasFixas, reserva: plano.reserva, acumulado }
  })
}
