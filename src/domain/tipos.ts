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
  desejo: Centavos // quanto o usuário gostaria de gastar por mês
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

export type Situacao = 'folga' | 'justo' | 'apertado' | 'critico' | 'deficit'

export interface Plano {
  mes: Mes
  renda: Centavos
  contasFixas: Centavos
  sobra: Centavos
  tetos: Record<string, Centavos>
  reserva: Centavos
  situacao: Situacao
  mensagens: string[]
}
