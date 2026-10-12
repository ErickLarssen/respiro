import { diasNoMes, montarData } from '../domain/datas'
import type { Categoria, Config, Conta, DataISO, Gasto, Mes } from '../domain/tipos'
import type { DadosIniciais } from './dadosIniciais'
import { db } from './db'

// Todas as leituras e escritas do banco passam por aqui. As telas e os hooks
// nunca usam `db` diretamente: se um dia o banco mudar, só esta pasta muda.

// ---------- Config ----------

export async function obterConfig(): Promise<Config | null> {
  return (await db.config.get('principal')) ?? null
}

export async function salvarConfig(config: Config): Promise<void> {
  await db.config.put(config)
}

// ---------- Contas fixas ----------

export function listarContas(): Promise<Conta[]> {
  return db.contas.orderBy('ordem').toArray()
}

/** Cria ou atualiza (pelo id). */
export async function salvarConta(conta: Conta): Promise<void> {
  await db.contas.put(conta)
}

export async function apagarConta(id: string): Promise<void> {
  await db.contas.delete(id)
}

// ---------- Categorias ----------

export function listarCategorias(): Promise<Categoria[]> {
  return db.categorias.orderBy('ordem').toArray()
}

/** Cria ou atualiza (pelo id). */
export async function salvarCategoria(categoria: Categoria): Promise<void> {
  await db.categorias.put(categoria)
}

/** Os gastos da categoria continuam salvos e passam a contar como "fora do plano". */
export async function apagarCategoria(id: string): Promise<void> {
  await db.categorias.delete(id)
}

// ---------- Gastos ----------

/** Gastos do mês, do mais recente para o mais antigo. */
export async function listarGastosDoMes(mes: Mes): Promise<Gasto[]> {
  const gastos = await db.gastos
    .where('data')
    .between(montarData(mes, 1), montarData(mes, diasNoMes(mes)), true, true)
    .toArray()
  // Mesma data: o anotado por último vem primeiro.
  return gastos.sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm))
}

export type NovoGasto = Omit<Gasto, 'id' | 'criadoEm'>

/** Anota um gasto novo; o id e o horário de criação são gerados aqui. */
export async function adicionarGasto(novo: NovoGasto): Promise<Gasto> {
  const gasto: Gasto = { ...novo, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }
  await db.gastos.add(gasto)
  return gasto
}

/** Atualiza um gasto que já existe. */
export async function salvarGasto(gasto: Gasto): Promise<void> {
  await db.gastos.put(gasto)
}

export async function apagarGasto(id: string): Promise<void> {
  await db.gastos.delete(id)
}

// ---------- Tudo de uma vez ----------

/** Apaga todos os dados do aparelho. */
export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()))
  })
}

/**
 * Substitui tudo pelos dados recebidos. Usado em "Começar com meus dados"
 * (e, na Etapa 4, ao importar um backup). Se algo falhar, nada muda.
 */
export async function substituirTudo(dados: DadosIniciais): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((tabela) => tabela.clear()))
    await db.config.put(dados.config)
    await db.contas.bulkPut(dados.contas)
    await db.categorias.bulkPut(dados.categorias)
    await db.gastos.bulkPut(dados.gastos)
  })
}

/** Dia útil do salário sugerido em "Começar do zero"; o usuário ajusta depois em Ajustes. */
const DIA_UTIL_SALARIO_PADRAO = 5

/** "Começar do zero": cria só a config, com valores zerados. */
export async function comecarDoZero(hoje: DataISO): Promise<void> {
  await substituirTudo({
    config: {
      id: 'principal',
      renda: 0,
      diaUtilSalario: DIA_UTIL_SALARIO_PADRAO,
      reservaMinima: 0,
      criadoEm: hoje,
    },
    contas: [],
    categorias: [],
    gastos: [],
  })
}
