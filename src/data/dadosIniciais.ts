import dados from '../../docs/dados-iniciais.json'
import { mesDeInicio } from '../domain/colchao'
import { planejamentoInicial } from '../domain/planejamento'
import type { Categoria, Config, Conta, Gasto, MesPlanejado } from '../domain/tipos'

// Os dados reais do usuário (outubro de 2026), usados em "Começar com meus dados".
// A fonte continua sendo docs/dados-iniciais.json: importamos o arquivo em vez de
// copiar os valores, para não existirem duas versões que podem ficar diferentes.
// O JSON não guarda tipos literais ("parcela" vira string), por isso a conversão.

export interface DadosIniciais {
  config: Config
  contas: Conta[]
  categorias: Categoria[]
  gastos: Gasto[]
  planosDoMes: MesPlanejado[]
}

const config = dados.config as Config
const categorias = dados.categorias as Categoria[]

export const dadosIniciais: DadosIniciais = {
  config,
  contas: dados.contas as Conta[],
  categorias,
  gastos: dados.gastos as Gasto[],
  // O JSON é anterior ao plano por mês: o plano de outubro sai dos valores das categorias.
  planosDoMes: [planejamentoInicial(categorias, mesDeInicio(config))],
}
