import type { Categoria, Centavos, Mes, MesPlanejado } from './tipos'

// Plano de cada mês. Regras: docs/03-regras-de-negocio.md, seção 7.
//
// Cada mês pode ter o seu plano salvo (MesPlanejado). Um mês sem plano próprio
// copia o último mês planejado antes dele. Antes de qualquer plano salvo, valem
// os valores das próprias categorias (categoria.desejo).

export interface PlanejamentoEfetivo {
  /** Quanto gostaria de gastar em cada categoria (todas as categorias, na ordem recebida). */
  desejos: Record<string, Centavos>
  /** Quanto separar no colchão (antes de aplicar a meta). */
  colchao: Centavos
  /** O mês de onde vieram os valores: o próprio mês, um mês anterior, ou null (valores das categorias). */
  origem: Mes | null
}

/** Plano que vale para `mes`: o dele, ou o último planejado antes dele. */
export function planejamentoDoMes(planejados: MesPlanejado[], categorias: Categoria[], mes: Mes): PlanejamentoEfetivo {
  let base: MesPlanejado | null = null
  for (const planejado of planejados) {
    if (planejado.mes <= mes && (base === null || planejado.mes > base.mes)) base = planejado
  }

  if (base === null) {
    return {
      desejos: Object.fromEntries(categorias.map((categoria) => [categoria.id, categoria.desejo])),
      colchao: 0,
      origem: null,
    }
  }
  const { desejos } = base
  return {
    // Categoria que não estava no plano daquele mês fica com 0 (não existia ou foi zerada).
    desejos: Object.fromEntries(categorias.map((categoria) => [categoria.id, desejos[categoria.id] ?? 0])),
    colchao: base.colchao,
    origem: base.mes,
  }
}

/** O plano de hoje transformado no primeiro plano salvo (migração e primeiro uso). */
export function planejamentoInicial(categorias: Categoria[], mes: Mes): MesPlanejado {
  return {
    mes,
    desejos: Object.fromEntries(categorias.map((categoria) => [categoria.id, categoria.desejo])),
    colchao: 0,
  }
}

/**
 * Uma categoria nova entra no plano "a partir de `mes`": no plano desse mês
 * (criado a partir do que valia nele, se ainda não existia) e em todos os planos
 * salvos de meses seguintes. Meses anteriores não mudam.
 */
export function incluirCategoriaNosPlanos(
  planejados: MesPlanejado[],
  categorias: Categoria[],
  nova: { id: string; desejo: Centavos },
  mes: Mes,
): MesPlanejado[] {
  const atualizados = planejados
    .filter((planejado) => planejado.mes >= mes)
    .map((planejado) => ({ ...planejado, desejos: { ...planejado.desejos, [nova.id]: nova.desejo } }))

  if (!planejados.some((planejado) => planejado.mes === mes)) {
    const vigente = planejamentoDoMes(planejados, categorias, mes)
    atualizados.unshift({ mes, desejos: { ...vigente.desejos, [nova.id]: nova.desejo }, colchao: vigente.colchao })
  }
  return atualizados
}
