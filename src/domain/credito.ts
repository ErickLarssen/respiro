import { contaAtivaNoMes, parcelasRestantes } from './contas'
import { diaDaData, mesDaData, montarData, somarMeses } from './datas'
import { formatarBRL } from './dinheiro'
import { estadoDaCategoria, type EstadoCategoria } from './estado'
import type { Cartao, Centavos, Conta, DataISO, Gasto, Mes } from './tipos'

// Cartão de crédito. Regras: docs/03-regras-de-negocio.md, seção 5.
//
// A compra no crédito entra na fatura (identificada pelo mês do vencimento), e a
// fatura vira conta fixa do mês em que vence. Antes de cartao.regraDesde, ou sem
// cartão cadastrado, vale a regra anterior: a compra conta no teto do mês.

// ---------- Datas da fatura ----------

/** Mês de vencimento da fatura em que cai uma compra feita em `data`. */
export function faturaDaCompra(data: DataISO, cartao: Cartao): Mes {
  const mes = mesDaData(data)
  // Até o dia do fechamento (inclusive), a compra fecha neste mês; depois, no seguinte.
  const mesDoFechamento = diaDaData(data) <= cartao.diaFechamento ? mes : somarMeses(mes, 1)
  // Se o fechamento é no dia do vencimento ou depois (ex.: fecha 25, vence 5), a fatura vence no mês seguinte.
  return cartao.diaFechamento >= cartao.diaVencimento ? somarMeses(mesDoFechamento, 1) : mesDoFechamento
}

/** Data em que fecha a fatura que vence em `fatura`. */
export function dataDeFechamento(fatura: Mes, cartao: Cartao): DataISO {
  const mes = cartao.diaFechamento >= cartao.diaVencimento ? somarMeses(fatura, -1) : fatura
  return montarData(mes, cartao.diaFechamento)
}

/** Data em que vence a fatura do mês `fatura`. */
export function dataDeVencimento(fatura: Mes, cartao: Cartao): DataISO {
  return montarData(fatura, cartao.diaVencimento)
}

// ---------- Qual regra vale para cada compra ----------

/**
 * true = o gasto sai do teto da categoria (Pix, débito, dinheiro, ou crédito pela regra anterior).
 * false = compra no crédito pela regra da fatura: não gasta o teto.
 */
export function contaNoTeto(gasto: Gasto, cartao: Cartao | undefined): boolean {
  if (gasto.forma !== 'credito' || !cartao) return true
  return mesDaData(gasto.data) < cartao.regraDesde
}

export interface ParcelaDaCompra {
  fatura: Mes
  valor: Centavos
}

/** As parcelas de uma compra no crédito. Os centavos que sobram da divisão vão na primeira. */
export function parcelasDaCompra(gasto: Gasto, cartao: Cartao): ParcelaDaCompra[] {
  const n = Math.max(1, gasto.parcelas ?? 1)
  const base = Math.floor(gasto.valor / n)
  const primeira = faturaDaCompra(gasto.data, cartao)
  return Array.from({ length: n }, (_, i) => ({
    fatura: somarMeses(primeira, i),
    valor: i === 0 ? gasto.valor - base * (n - 1) : base,
  }))
}

// ---------- Fatura ----------

/** Soma do que já se sabe que cai na fatura `mes` (só compras pela regra da fatura). */
export function faturaConhecida(gastos: Gasto[], cartao: Cartao, mes: Mes): Centavos {
  let soma = 0
  for (const gasto of gastos) {
    if (contaNoTeto(gasto, cartao)) continue
    for (const parcela of parcelasDaCompra(gasto, cartao)) if (parcela.fatura === mes) soma += parcela.valor
  }
  return soma
}

export interface FaturaNoPlano {
  valor: Centavos
  estimada: boolean // true = fatura ainda aberta: entrou o orçamento (ou mais, se já passou dele)
}

/**
 * O que entra no plano do mês como fatura. Fechada: o valor real. Aberta ou futura:
 * o maior entre o que já se sabe e o orçamento (escolha conservadora).
 */
export function faturaDoPlano(gastos: Gasto[], cartao: Cartao | undefined, mes: Mes, hoje: DataISO): FaturaNoPlano {
  if (!cartao || mes < cartao.regraDesde) return { valor: 0, estimada: false }
  const conhecida = faturaConhecida(gastos, cartao, mes)
  const fechada = hoje > dataDeFechamento(mes, cartao)
  return fechada ? { valor: conhecida, estimada: false } : { valor: Math.max(conhecida, cartao.orcamento), estimada: true }
}

/** Faturas do plano de cada mês do período (para o plano e a projeção). */
export function faturasDoPeriodo(
  gastos: Gasto[],
  cartao: Cartao | undefined,
  de: Mes,
  ate: Mes,
  hoje: DataISO,
): Record<Mes, FaturaNoPlano> {
  const faturas: Record<Mes, FaturaNoPlano> = {}
  for (let mes = de; mes <= ate; mes = somarMeses(mes, 1)) faturas[mes] = faturaDoPlano(gastos, cartao, mes, hoje)
  return faturas
}

/**
 * A fatura como o banco vai cobrar (informativo): compras pela regra da fatura,
 * compras no crédito da regra anterior (já descontadas nos tetos) e contas fixas no crédito.
 */
export function faturaNoBanco(
  gastos: Gasto[],
  contas: Conta[],
  cartao: Cartao,
  mes: Mes,
): { total: Centavos; regraAnterior: Centavos; contas: Centavos } {
  let regraAnterior = 0
  for (const gasto of gastos) {
    if (gasto.forma !== 'credito' || !contaNoTeto(gasto, cartao)) continue
    for (const parcela of parcelasDaCompra(gasto, cartao)) if (parcela.fatura === mes) regraAnterior += parcela.valor
  }
  const deContas = contas
    .filter((conta) => conta.pagaNoCredito && contaAtivaNoMes(conta, mes))
    .reduce((soma, conta) => soma + conta.valor, 0)
  return { total: faturaConhecida(gastos, cartao, mes) + regraAnterior + deContas, regraAnterior, contas: deContas }
}

// ---------- Limite ----------

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

/**
 * Limite usado hoje: parcelas de compras no crédito feitas até hoje cujas faturas
 * ainda não venceram (a fatura conta como paga no dia do vencimento), mais as contas no crédito.
 */
export function limiteUsado(gastos: Gasto[], contas: Conta[], cartao: Cartao, hoje: DataISO): Centavos {
  let soma = 0
  for (const gasto of gastos) {
    if (gasto.forma !== 'credito' || gasto.data > hoje) continue
    for (const parcela of parcelasDaCompra(gasto, cartao)) {
      if (dataDeVencimento(parcela.fatura, cartao) >= hoje) soma += parcela.valor
    }
  }
  return soma + contasNoCredito(contas, mesDaData(hoje))
}

/** Limite livre = limite − limite usado. Pode ser negativo. */
export function limiteLivre(gastos: Gasto[], contas: Conta[], cartao: Cartao, hoje: DataISO): Centavos {
  return cartao.limite - limiteUsado(gastos, contas, cartao, hoje)
}

/** Estado da fatura em relação ao orçamento: os mesmos estados das categorias. */
export function estadoDoOrcamento(fatura: Centavos, cartao: Cartao): EstadoCategoria {
  return estadoDaCategoria(cartao.orcamento, fatura)
}

/** Soma das compras no crédito feitas no mês (todas as regras). */
export function gastoNoCredito(gastos: Gasto[], mes: Mes): Centavos {
  return gastos
    .filter((gasto) => gasto.forma === 'credito' && mesDaData(gasto.data) === mes)
    .reduce((soma, gasto) => soma + gasto.valor, 0)
}

// ---------- Aviso depois de anotar no crédito ----------

export interface AvisoCredito {
  tom: 'ok' | 'atencao'
  texto: string
}

/**
 * O aviso depois de anotar uma compra no crédito (seção 5.6). Prioridade:
 * passou do limite > fatura em atenção ou estourada no orçamento > confirmação.
 */
export function avisoCompraNoCredito(entrada: {
  valor: Centavos
  nomeDaFatura: string // ex.: "novembro"
  fatura: Centavos // a fatura em que a compra caiu, já com ela
  cartao: Cartao
  livre: Centavos // limite livre depois da compra
}): AvisoCredito {
  const { valor, nomeDaFatura, fatura, cartao, livre } = entrada
  if (livre < 0) return { tom: 'atencao', texto: `Passou do limite do cartão em ${formatarBRL(-livre)}` }
  if (estadoDoOrcamento(fatura, cartao) !== 'ok') {
    return {
      tom: 'atencao',
      texto: `Fatura de ${nomeDaFatura}: ${formatarBRL(fatura)} de ${formatarBRL(cartao.orcamento)} do orçamento`,
    }
  }
  return {
    tom: 'ok',
    texto: `No crédito: ${formatarBRL(valor)} na fatura de ${nomeDaFatura}. Limite livre: ${formatarBRL(livre)}`,
  }
}
