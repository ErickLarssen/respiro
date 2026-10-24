// Tipos do domínio. Fonte: docs/04-modelo-de-dados.md

export type Mes = string // "AAAA-MM"
export type DataISO = string // "AAAA-MM-DD"
export type Centavos = number // sempre inteiro

export interface Config {
  id: 'principal' // só existe uma
  renda: Centavos
  diaUtilSalario: number // 1 a 22
  reservaMinima: Centavos
  limiteCartao?: Centavos // opcional, só para mostrar o limite livre
  metaColchao?: Centavos // ao chegar nesse saldo, o colchão para de crescer; 0 ou ausente = sem colchão
  criadoEm: DataISO
}

export interface Conta {
  id: string // crypto.randomUUID()
  nome: string
  valor: Centavos
  tipo: 'recorrente' | 'parcela'
  ultimaParcela?: Mes // obrigatório quando tipo === "parcela"
  observacao?: string
  pagaNoCredito?: boolean // ex.: Claude Pro; ocupa limite do cartão
  ordem: number // posição na lista
}

export interface Categoria {
  id: string
  nome: string
  desejo: Centavos // valor dos meses anteriores ao primeiro plano salvo (o valor de cada mês fica em MesPlanejado)
  essencial: boolean
  descricao?: string // ex.: "Pizza, lanches e cinema"
  cor: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
  ordem: number
}

export type FormaPagamento = 'pix' | 'debito' | 'dinheiro' | 'credito'

export interface Gasto {
  id: string
  data: DataISO
  valor: Centavos
  categoriaId: string
  descricao?: string
  forma: FormaPagamento
  criadoEm: string // ISO completo, para desempate na ordenação
}

/**
 * O plano que o usuário salvou para um mês: quanto gostaria de gastar em cada
 * categoria e quanto separar no colchão. Um mês sem registro copia o último mês
 * planejado antes dele (docs/03-regras-de-negocio.md, seção 7).
 */
export interface MesPlanejado {
  mes: Mes
  desejos: Record<string, Centavos> // por id de categoria; categoria ausente = 0 neste mês
  colchao: Centavos // quanto o usuário quer separar no colchão neste mês
}

export type Situacao = 'folga' | 'justo' | 'apertado' | 'critico' | 'deficit'

export interface Plano {
  mes: Mes
  renda: Centavos
  contasFixas: Centavos
  sobra: Centavos
  tetos: Record<string, Centavos>
  colchao: Centavos // quanto vai de fato para o colchão neste mês
  reserva: Centavos
  situacao: Situacao
  mensagens: string[]
}
