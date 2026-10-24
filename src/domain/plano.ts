import { totalContasFixas } from './contas'
import { nomeDoMes } from './datas'
import { formatarBRL } from './dinheiro'
import type { Categoria, Centavos, Conta, Mes, Plano, Situacao } from './tipos'

// O plano automático do mês. Regras: docs/03-regras-de-negocio.md, seção 2.
//
// Ordem de prioridade do dinheiro que sobra depois das contas fixas:
//   1. essenciais  2. colchão  3. reserva mínima  4. flexíveis  5. o resto vai para a reserva

export interface EntradaPlano {
  renda: Centavos
  reservaMinima: Centavos
  contas: Conta[]
  categorias: Categoria[]
  mes: Mes
  /** Quanto gostaria de gastar em cada categoria neste mês. Sem isto, vale categoria.desejo. */
  desejos?: Record<string, Centavos>
  /** Quanto separar no colchão neste mês (já limitado pela meta). Sem isto, 0. */
  colchao?: Centavos
  /** Fatura do cartão que vence neste mês (seção 5.4). Entra como conta fixa. Sem isto, 0. */
  fatura?: Centavos
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

function planoDeDeficit(entrada: EntradaPlano, contasFixas: Centavos, fatura: Centavos, sobra: Centavos): Plano {
  const tetos = Object.fromEntries(entrada.categorias.map((categoria) => [categoria.id, 0]))
  const oQue = fatura > 0 ? 'As contas fixas e a fatura do cartão passam' : 'As contas fixas passam'
  return {
    mes: entrada.mes,
    renda: entrada.renda,
    contasFixas,
    fatura,
    sobra,
    tetos,
    colchao: 0,
    reserva: 0,
    situacao: 'deficit',
    mensagens: [`${oQue} da renda em ${formatarBRL(-sobra)}.`],
  }
}

/**
 * Prévia de Ajustes (docs/05-telas-e-fluxos.md): o efeito de uma mudança na reserva do mês.
 * "Com essa mudança, a reserva de outubro vai de R$ 51,92 para R$ 61,92."
 */
export function fraseEfeitoNaReserva(antes: Plano, depois: Plano): string {
  const mes = nomeDoMes(depois.mes)
  if (antes.reserva === depois.reserva) {
    return `Essa mudança não altera a reserva de ${mes} (${formatarBRL(depois.reserva)}).`
  }
  return `Com essa mudança, a reserva de ${mes} vai de ${formatarBRL(antes.reserva)} para ${formatarBRL(depois.reserva)}.`
}

export function calcularPlano(entrada: EntradaPlano): Plano {
  const { renda, reservaMinima, mes } = entrada
  const colchaoDesejado = entrada.colchao ?? 0
  // Cada categoria com o desejo deste mês (o plano do mês tem prioridade sobre categoria.desejo)
  const categorias = entrada.categorias.map((categoria) => ({
    ...categoria,
    desejo: entrada.desejos?.[categoria.id] ?? categoria.desejo,
  }))
  const contasFixas = totalContasFixas(entrada.contas, mes)
  const fatura = entrada.fatura ?? 0
  // A fatura do cartão sai junto com as contas fixas, antes de tudo
  const sobra = renda - contasFixas - fatura

  if (sobra < 0) return planoDeDeficit(entrada, contasFixas, fatura, sobra)

  let disponivel = sobra

  // 1. Essenciais
  const essenciais = repartir(
    categorias.filter((categoria) => categoria.essencial),
    disponivel,
  )
  disponivel -= essenciais.total

  // 2. Colchão ("para não passar o mês duro"), antes da reserva
  const colchao = Math.min(colchaoDesejado, disponivel)
  disponivel -= colchao
  const colchaoCortado = colchao < colchaoDesejado

  // 3. Reserva mínima
  let reserva = Math.min(reservaMinima, disponivel)
  disponivel -= reserva
  const reservaMinimaCortada = reserva < reservaMinima

  // 4. Flexíveis; o que sobrar (inclusive centavos do arredondamento) vai para a reserva
  const flexiveis = repartir(
    categorias.filter((categoria) => !categoria.essencial),
    disponivel,
  )
  reserva += disponivel - flexiveis.total

  // 5. Situação e mensagem
  let situacao: Situacao
  let mensagem: string
  if (essenciais.cortou || colchaoCortado || reservaMinimaCortada) {
    situacao = 'critico'
    const protegidos = colchaoDesejado > 0 ? 'os essenciais, o colchão e a reserva' : 'os essenciais e a reserva'
    const depoisDe = fatura > 0 ? 'das contas fixas e da fatura' : 'das contas fixas'
    mensagem = `Depois ${depoisDe} sobram só ${formatarBRL(sobra)}. Não dá para cobrir ${protegidos}.`
  } else if (flexiveis.cortou) {
    situacao = 'apertado'
    const corte = flexiveis.desejado - flexiveis.total
    const percentual = Math.round((corte * 100) / flexiveis.desejado)
    // Corte pequeno demais para aparecer como inteiro: "0%" pareceria que nada mudou
    const quanto = percentual === 0 ? 'menos de 1%' : `${percentual}%`
    const objetivo =
      colchao > 0
        ? `separar ${formatarBRL(colchao)} no colchão e guardar ${formatarBRL(reservaMinima)}`
        : `guardar ${formatarBRL(reservaMinima)}`
    mensagem = `Para ${objetivo}, reduzi os gastos flexíveis em ${quanto}.`
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
    fatura,
    sobra,
    // Na mesma ordem das categorias recebidas.
    tetos: Object.fromEntries(
      categorias.map((categoria) => [
        categoria.id,
        essenciais.tetos[categoria.id] ?? flexiveis.tetos[categoria.id] ?? 0,
      ]),
    ),
    colchao,
    reserva,
    situacao,
    mensagens: [mensagem],
  }
}
