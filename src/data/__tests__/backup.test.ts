import { describe, expect, it } from 'vitest'
import dadosDoJson from '../../../docs/dados-iniciais.json'
import { lerBackup, montarBackup, nomeDoArquivo, resumoDoBackup, validarBackup } from '../backup'
import { dadosIniciais } from '../dadosIniciais'

const gasto = {
  id: 'g1',
  data: '2026-10-11',
  valor: 3500,
  categoriaId: 'lazer',
  forma: 'credito',
  criadoEm: '2026-10-11T12:00:00.000Z',
}

describe('montarBackup e nomeDoArquivo', () => {
  it('põe a versão no backup', () => {
    expect(montarBackup(dadosIniciais).versao).toBe(1)
  })

  it('nomeia o arquivo com a data', () => {
    expect(nomeDoArquivo('2026-10-12')).toBe('respiro-backup-2026-10-12.json')
  })
})

describe('resumoDoBackup', () => {
  it('conta contas, categorias e gastos', () => {
    expect(resumoDoBackup(dadosIniciais)).toBe('9 contas, 4 categorias, 0 gastos')
  })

  it('usa singular quando é um só', () => {
    expect(resumoDoBackup({ ...dadosIniciais, contas: [], categorias: dadosIniciais.categorias.slice(0, 1) })).toBe(
      '0 contas, 1 categoria, 0 gastos',
    )
  })
})

describe('validarBackup', () => {
  it('aceita um backup exportado pelo app (ida e volta)', () => {
    const exportado = JSON.parse(JSON.stringify(montarBackup({ ...dadosIniciais, gastos: [gasto] as never })))
    const resultado = validarBackup(exportado)
    expect(resultado).toEqual({ ok: true, dados: { ...dadosIniciais, gastos: [gasto] } })
  })

  it('aceita o próprio docs/dados-iniciais.json (que tem versão 1)', () => {
    expect(validarBackup(dadosDoJson).ok).toBe(true)
  })

  it('descarta campos desconhecidos', () => {
    const resultado = validarBackup({ ...dadosDoJson, gastos: [{ ...gasto, campoEstranho: 'x' }] })
    expect(resultado.ok && resultado.dados.gastos[0]).toEqual(gasto)
  })

  it('recusa arquivo que não é backup', () => {
    expect(validarBackup([1, 2, 3])).toEqual({ ok: false, erro: 'Este arquivo não é um backup do Respiro.' })
    expect(validarBackup(null).ok).toBe(false)
  })

  it('recusa versão desconhecida', () => {
    expect(validarBackup({ ...dadosDoJson, versao: 2 })).toEqual({
      ok: false,
      erro: 'Este backup é de uma versão que o app não conhece.',
    })
  })

  it('recusa valor com casas decimais (dinheiro é sempre em centavos)', () => {
    const quebrado = { ...dadosDoJson, gastos: [{ ...gasto, valor: 35.5 }] }
    expect(validarBackup(quebrado)).toEqual({ ok: false, erro: 'Gasto 1: "valor" precisa ser um valor em centavos.' })
  })

  it('recusa parcela sem última parcela', () => {
    const contas = [{ id: 'x', nome: 'X', valor: 100, tipo: 'parcela', ordem: 1 }]
    const resultado = validarBackup({ ...dadosDoJson, contas })
    expect(resultado).toEqual({ ok: false, erro: 'Conta 1: falta o campo "ultimaParcela".' })
  })

  it('recusa forma de pagamento desconhecida', () => {
    const resultado = validarBackup({ ...dadosDoJson, gastos: [{ ...gasto, forma: 'boleto' }] })
    expect(resultado).toEqual({ ok: false, erro: 'Gasto 1: forma de pagamento desconhecida.' })
  })

  it('recusa quando falta uma lista', () => {
    const semCategorias: Record<string, unknown> = { ...dadosDoJson }
    delete semCategorias.categorias
    expect(validarBackup(semCategorias)).toEqual({ ok: false, erro: 'O arquivo não tem a lista de categorias.' })
  })
})

describe('lerBackup', () => {
  it('lê o texto do arquivo', () => {
    expect(lerBackup(JSON.stringify(dadosDoJson)).ok).toBe(true)
  })

  it('JSON quebrado vira erro amigável', () => {
    expect(lerBackup('{ isto não é json')).toEqual({
      ok: false,
      erro: 'Não deu para ler o arquivo. Escolha um backup .json do Respiro.',
    })
  })
})
