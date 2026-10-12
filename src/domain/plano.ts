import { totalContasFixas } from './contas'
import { formatarBRL } from './dinheiro'
import type { Categoria, Centavos, Conta, Mes, Plano, Situacao } from './tipos'

// O plano automático do mês. Regras: docs/03-regras-de-negocio.md, seção 2.
//
// Ordem de prioridade do dinheiro que sobra depois das contas fixas:
//   1. essenciais  2. reserva mínima  3. flexíveis  4. o resto vai para a reserva

export interface EntradaPlano {
  renda: Centavos
  reservaMinima: Centavos
  contas: Conta[]
  categorias: Categoria[]
  mes: Mes
}

interface Reparticao {
  tetos: Record<string, Centavos>
  total: Centavos // soma dos tetos
  desejado: Centavos // soma dos desejos
  cortou: boolean // true se os desejos não couberam
}

function somarDesejos(categorias: Categoria[]): Centavos {
  return categorias.reduce((soma, categoria) => soma + categoria.desejo, 0)
}

/**
 * Reparte `disponivel` entre as categorias. Se os desejos couberem, cada uma
 * recebe o seu desejo. Se não, cada uma recebe a mesma proporção do desejo,
 * arredondada para baixo (os centavos que sobram ficam em `disponivel`).
 */
function repartir(categorias: Categoria[], disponivel: Centavos): Reparticao {
  const desejado = somarDesejos(categorias)
  const cortou = desejado > disponivel
  const tetos: Record<string, Centavos> = {}
  let total = 0

  for (const categoria of categorias) {
    const teto = cortou ? Math.floor((categoria.desejo * disponivel) / desejado) : categoria.desejo
    tetos[categoria.id] = teto
    total += teto
  }
  return { tetos, total, desejado, cortou }
}

function planoDeDeficit(entrada: EntradaPlano, contasFixas: Centavos, sobra: Centavos): Plano {
  const tetos = Object.fromEntries(entrada.categorias.map((categoria) => [categoria.id, 0]))
  return {
    mes: entrada.mes,
    renda: entrada.renda,
    contasFixas,
    sobra,
    tetos,
    reserva: 0,
    situacao: 'deficit',
    mensagens: [`As contas fixas passam da renda em ${formatarBRL(-sobra)}.`],
  }
}

export function calcularPlano(entrada: EntradaPlano): Plano {
  const { renda, reservaMinima, categorias, mes } = entrada
  const contasFixas = totalContasFixas(entrada.contas, mes)
  const sobra = renda - contasFixas

  if (sobra < 0) return planoDeDeficit(entrada, contasFixas, sobra)

  let disponivel = sobra

  // 1. Essenciais
  const essenciais = repartir(
    categorias.filter((categoria) => categoria.essencial),
    disponivel,
  )
  disponivel -= essenciais.total

  // 2. Reserva mínima
  let reserva = Math.min(reservaMinima, disponivel)
  disponivel -= reserva
  const reservaMinimaCortada = reserva < reservaMinima

  // 3. Flexíveis; o que sobrar (inclusive centavos do arredondamento) vai para a reserva
  const flexiveis = repartir(
    categorias.filter((categoria) => !categoria.essencial),
    disponivel,
  )
  reserva += disponivel - flexiveis.total

  // 4. Situação e mensagem
  let situacao: Situacao
  let mensagem: string
  if (essenciais.cortou || reservaMinimaCortada) {
    situacao = 'critico'
    mensagem = `Depois das contas fixas sobram só ${formatarBRL(sobra)}. Não dá para cobrir os essenciais e a reserva.`
  } else if (flexiveis.cortou) {
    situacao = 'apertado'
    const corte = flexiveis.desejado - flexiveis.total
    const percentual = Math.round((corte * 100) / flexiveis.desejado)
    mensagem = `Para guardar ${formatarBRL(reservaMinima)}, reduzi os gastos flexíveis em ${percentual}%.`
  } else if (reserva > reservaMinima) {
    situacao = 'folga'
    mensagem = `Seus planos couberam. Os ${formatarBRL(reserva - reservaMinima)} que sobraram vão para a reserva.`
  } else {
    situacao = 'justo'
    mensagem = `Seus planos couberam, com a reserva mínima de ${formatarBRL(reservaMinima)}.`
  }

  return {
    mes,
    renda,
    contasFixas,
    sobra,
    // Na mesma ordem das categorias recebidas.
    tetos: Object.fromEntries(
      categorias.map((categoria) => [
        categoria.id,
        essenciais.tetos[categoria.id] ?? flexiveis.tetos[categoria.id] ?? 0,
      ]),
    ),
    reserva,
    situacao,
    mensagens: [mensagem],
  }
}
