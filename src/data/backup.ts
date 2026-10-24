import { mesDeInicio } from '../domain/colchao'
import { planejamentoInicial } from '../domain/planejamento'
import type { Cartao, Categoria, Config, Conta, DataISO, FormaPagamento, Gasto, Mes, MesPlanejado } from '../domain/tipos'
import type { DadosIniciais } from './dadosIniciais'
import { cartaoDoLimiteAntigo } from './migracoes'

// Backup em JSON (docs/04-modelo-de-dados.md, seção "Backup").
// Os dados só existem no aparelho: o backup é a única cópia de segurança.
//
// Versão 2: inclui o plano de cada mês (planosDoMes) e a meta do colchão.
// Versão 3: o cartão de crédito (config.cartao) e as parcelas das compras no crédito.
// Backups antigos continuam aceitos, com as mesmas conversões da migração do banco
// (data/db.ts): o plano do primeiro mês sai das categorias (v1) e o antigo
// limiteCartao vira o cartão, com a regra da fatura a partir do mês seguinte (v1 e v2).

export const VERSAO_BACKUP = 3

export interface Backup extends DadosIniciais {
  versao: typeof VERSAO_BACKUP
}

export function montarBackup(dados: DadosIniciais): Backup {
  return { versao: VERSAO_BACKUP, ...dados }
}

/** "respiro-backup-2026-10-12.json" */
export function nomeDoArquivo(hoje: DataISO): string {
  return `respiro-backup-${hoje}.json`
}

function plural(n: number, singular: string, pluralizado: string): string {
  return `${n} ${n === 1 ? singular : pluralizado}`
}

/** "9 contas, 4 categorias, 87 gastos" */
export function resumoDoBackup(dados: DadosIniciais): string {
  return [
    plural(dados.contas.length, 'conta', 'contas'),
    plural(dados.categorias.length, 'categoria', 'categorias'),
    plural(dados.gastos.length, 'gasto', 'gastos'),
  ].join(', ')
}

// ---------- Validação ----------
// O arquivo pode vir de qualquer lugar. Cada campo é conferido e só os campos
// conhecidos são copiados: nada de estranho entra no banco.

export type ResultadoValidacao = { ok: true; dados: DadosIniciais } | { ok: false; erro: string }

type Objeto = Record<string, unknown>

const MES = /^\d{4}-(0[1-9]|1[0-2])$/
const DATA = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
const CORES = ['c1', 'c2', 'c3', 'c4', 'c5'] as const
const FORMAS: FormaPagamento[] = ['pix', 'debito', 'dinheiro', 'credito']

class ErroDeBackup extends Error {}

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function texto(obj: Objeto, campo: string, onde: string): string {
  const valor = obj[campo]
  if (typeof valor !== 'string' || valor === '') throw new ErroDeBackup(`${onde}: falta o campo "${campo}".`)
  return valor
}

function textoOpcional(obj: Objeto, campo: string): string | undefined {
  const valor = obj[campo]
  return typeof valor === 'string' && valor !== '' ? valor : undefined
}

function centavos(obj: Objeto, campo: string, onde: string): number {
  const valor = obj[campo]
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor < 0) {
    throw new ErroDeBackup(`${onde}: "${campo}" precisa ser um valor em centavos.`)
  }
  return valor
}

function numero(obj: Objeto, campo: string, onde: string): number {
  const valor = obj[campo]
  if (typeof valor !== 'number' || !Number.isFinite(valor)) throw new ErroDeBackup(`${onde}: "${campo}" precisa ser um número.`)
  return valor
}

function lista(obj: Objeto, campo: string, nome = campo): unknown[] {
  const valor = obj[campo]
  if (!Array.isArray(valor)) throw new ErroDeBackup(`O arquivo não tem a lista de ${nome}.`)
  return valor
}

function diaDoMes(obj: Record<string, unknown>, campo: string, onde: string): number {
  const valor = obj[campo]
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > 28) {
    throw new ErroDeBackup(`${onde}: "${campo}" precisa ser um dia de 1 a 28.`)
  }
  return valor
}

function validarCartao(bruto: unknown): Cartao {
  const onde = 'Cartão'
  if (!ehObjeto(bruto)) throw new ErroDeBackup(`${onde}: formato inválido.`)
  const regraDesde = texto(bruto, 'regraDesde', onde)
  if (!MES.test(regraDesde)) throw new ErroDeBackup(`${onde}: "regraDesde" precisa estar no formato AAAA-MM.`)
  return {
    limite: centavos(bruto, 'limite', onde),
    diaFechamento: diaDoMes(bruto, 'diaFechamento', onde),
    diaVencimento: diaDoMes(bruto, 'diaVencimento', onde),
    orcamento: centavos(bruto, 'orcamento', onde),
    regraDesde,
  }
}

function validarConfig(bruto: unknown, mesAtual: Mes): Config {
  if (!ehObjeto(bruto)) throw new ErroDeBackup('O arquivo não tem a configuração.')
  const onde = 'Configuração'
  const diaUtilSalario = numero(bruto, 'diaUtilSalario', onde)
  if (!Number.isInteger(diaUtilSalario) || diaUtilSalario < 1 || diaUtilSalario > 22) {
    throw new ErroDeBackup('Configuração: o dia útil do salário precisa ser de 1 a 22.')
  }
  const criadoEm = texto(bruto, 'criadoEm', onde)
  const config: Config = {
    id: 'principal',
    renda: centavos(bruto, 'renda', onde),
    diaUtilSalario,
    reservaMinima: centavos(bruto, 'reservaMinima', onde),
    criadoEm,
  }
  if (bruto.cartao !== undefined) config.cartao = validarCartao(bruto.cartao)
  else if (bruto.limiteCartao !== undefined) {
    // Backup anterior à versão 3: o limite vira o cartão
    config.cartao = cartaoDoLimiteAntigo(centavos(bruto, 'limiteCartao', onde), mesAtual)
  }
  if (bruto.metaColchao !== undefined) config.metaColchao = centavos(bruto, 'metaColchao', onde)
  return config
}

function validarConta(bruto: unknown, i: number): Conta {
  const onde = `Conta ${i + 1}`
  if (!ehObjeto(bruto)) throw new ErroDeBackup(`${onde}: formato inválido.`)
  const tipo = bruto.tipo
  if (tipo !== 'recorrente' && tipo !== 'parcela') throw new ErroDeBackup(`${onde}: tipo precisa ser "recorrente" ou "parcela".`)
  const conta: Conta = {
    id: texto(bruto, 'id', onde),
    nome: texto(bruto, 'nome', onde),
    valor: centavos(bruto, 'valor', onde),
    tipo,
    ordem: numero(bruto, 'ordem', onde),
  }
  if (tipo === 'parcela') {
    const ultima = texto(bruto, 'ultimaParcela', onde)
    if (!MES.test(ultima)) throw new ErroDeBackup(`${onde}: "ultimaParcela" precisa estar no formato AAAA-MM.`)
    conta.ultimaParcela = ultima
  }
  const observacao = textoOpcional(bruto, 'observacao')
  if (observacao) conta.observacao = observacao
  if (bruto.pagaNoCredito === true) conta.pagaNoCredito = true
  return conta
}

function validarCategoria(bruto: unknown, i: number): Categoria {
  const onde = `Categoria ${i + 1}`
  if (!ehObjeto(bruto)) throw new ErroDeBackup(`${onde}: formato inválido.`)
  if (typeof bruto.essencial !== 'boolean') throw new ErroDeBackup(`${onde}: falta dizer se é essencial.`)
  const cor = CORES.find((c) => c === bruto.cor)
  if (!cor) throw new ErroDeBackup(`${onde}: cor precisa ser de c1 a c5.`)
  const categoria: Categoria = {
    id: texto(bruto, 'id', onde),
    nome: texto(bruto, 'nome', onde),
    desejo: centavos(bruto, 'desejo', onde),
    essencial: bruto.essencial,
    cor,
    ordem: numero(bruto, 'ordem', onde),
  }
  const descricao = textoOpcional(bruto, 'descricao')
  if (descricao) categoria.descricao = descricao
  return categoria
}

function validarGasto(bruto: unknown, i: number): Gasto {
  const onde = `Gasto ${i + 1}`
  if (!ehObjeto(bruto)) throw new ErroDeBackup(`${onde}: formato inválido.`)
  const data = texto(bruto, 'data', onde)
  if (!DATA.test(data)) throw new ErroDeBackup(`${onde}: a data precisa estar no formato AAAA-MM-DD.`)
  const forma = FORMAS.find((f) => f === bruto.forma)
  if (!forma) throw new ErroDeBackup(`${onde}: forma de pagamento desconhecida.`)
  const gasto: Gasto = {
    id: texto(bruto, 'id', onde),
    data,
    valor: centavos(bruto, 'valor', onde),
    categoriaId: texto(bruto, 'categoriaId', onde),
    forma,
    criadoEm: texto(bruto, 'criadoEm', onde),
  }
  const descricao = textoOpcional(bruto, 'descricao')
  if (descricao) gasto.descricao = descricao
  if (bruto.parcelas !== undefined) {
    const parcelas = bruto.parcelas
    if (typeof parcelas !== 'number' || !Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) {
      throw new ErroDeBackup(`${onde}: "parcelas" precisa ser de 1 a 12.`)
    }
    if (parcelas > 1 && forma === 'credito') gasto.parcelas = parcelas
  }
  return gasto
}

function validarMesPlanejado(bruto: unknown, i: number): MesPlanejado {
  const onde = `Plano do mês ${i + 1}`
  if (!ehObjeto(bruto)) throw new ErroDeBackup(`${onde}: formato inválido.`)
  const mes = texto(bruto, 'mes', onde)
  if (!MES.test(mes)) throw new ErroDeBackup(`${onde}: "mes" precisa estar no formato AAAA-MM.`)
  if (!ehObjeto(bruto.desejos)) throw new ErroDeBackup(`${onde}: faltam os valores das categorias.`)
  const desejos: Record<string, number> = {}
  for (const id of Object.keys(bruto.desejos)) desejos[id] = centavos(bruto.desejos, id, onde)
  return { mes, desejos, colchao: centavos(bruto, 'colchao', onde) }
}

/**
 * Confere um backup lido de arquivo. Não altera nada: só diz se dá para importar.
 * `mesAtual` serve para converter o limite de backups antigos no cartão.
 */
export function validarBackup(bruto: unknown, mesAtual: Mes): ResultadoValidacao {
  try {
    if (!ehObjeto(bruto)) throw new ErroDeBackup('Este arquivo não é um backup do Respiro.')
    if (bruto.versao !== 1 && bruto.versao !== 2 && bruto.versao !== VERSAO_BACKUP) {
      throw new ErroDeBackup('Este backup é de uma versão que o app não conhece.')
    }
    const config = validarConfig(bruto.config, mesAtual)
    const categorias = lista(bruto, 'categorias').map(validarCategoria)
    const planosDoMes =
      bruto.versao === 1
        ? [planejamentoInicial(categorias, mesDeInicio(config))]
        : lista(bruto, 'planosDoMes', 'planos dos meses').map(validarMesPlanejado)
    return {
      ok: true,
      dados: {
        config,
        contas: lista(bruto, 'contas').map(validarConta),
        categorias,
        gastos: lista(bruto, 'gastos').map(validarGasto),
        planosDoMes,
      },
    }
  } catch (erro) {
    if (erro instanceof ErroDeBackup) return { ok: false, erro: erro.message }
    throw erro
  }
}

/** Lê o texto de um arquivo .json. JSON quebrado vira erro amigável. */
export function lerBackup(textoDoArquivo: string, mesAtual: Mes): ResultadoValidacao {
  let bruto: unknown
  try {
    bruto = JSON.parse(textoDoArquivo)
  } catch {
    return { ok: false, erro: 'Não deu para ler o arquivo. Escolha um backup .json do Respiro.' }
  }
  return validarBackup(bruto, mesAtual)
}
