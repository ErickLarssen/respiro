import dados from '../../docs/dados-iniciais.json'
import type { Categoria, Config, Conta, Gasto } from '../domain/tipos'

// Os dados reais do usuário (outubro de 2026), usados em "Começar com meus dados".
// A fonte continua sendo docs/dados-iniciais.json: importamos o arquivo em vez de
// copiar os valores, para não existirem duas versões que podem ficar diferentes.
// O JSON não guarda tipos literais ("parcela" vira string), por isso a conversão.

export interface DadosIniciais {
  config: Config
  contas: Conta[]
  categorias: Categoria[]
  gastos: Gasto[]
}

export const dadosIniciais: DadosIniciais = {
  config: dados.config as Config,
  contas: dados.contas as Conta[],
  categorias: dados.categorias as Categoria[],
  gastos: dados.gastos as Gasto[],
}
