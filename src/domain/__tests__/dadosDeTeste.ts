import dados from '../../../docs/dados-iniciais.json'
import type { Categoria, Config, Conta } from '../tipos'

// Os dados reais de docs/dados-iniciais.json, com os tipos do domínio.
// O JSON não guarda tipos literais ("parcela" vira string), por isso a conversão.
export const config = dados.config as Config
export const contas = dados.contas as Conta[]
export const categorias = dados.categorias as Categoria[]

export function conta(id: string): Conta {
  const encontrada = contas.find((c) => c.id === id)
  if (!encontrada) throw new Error(`Conta ${id} não existe nos dados de teste.`)
  return encontrada
}
