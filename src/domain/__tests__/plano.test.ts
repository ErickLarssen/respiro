import { describe, expect, it } from 'vitest'
import { calcularPlano, type EntradaPlano } from '../plano'
import type { Categoria } from '../tipos'
import { categorias, config, contas } from './dadosDeTeste'

// "R$" seguido do espaço que não quebra linha, como sai do formatarBRL.
const R$ = 'R$ '

function entrada(mes: string, renda = config.renda): EntradaPlano {
  return { renda, reservaMinima: config.reservaMinima, contas, categorias, mes }
}

describe('calcularPlano com os dados iniciais', () => {
  it.each([
    // mes, renda, contas fixas, sobra, higiene, churrasco, lazer, roupas, reserva, situação
    ['2026-10', 160600, 114199, 46401, 10000, 18000, 8000, 5209, 5192, 'folga'],
    ['2026-11', 160600, 84499, 76101, 10000, 18000, 8000, 5209, 34892, 'folga'],
    ['2026-12', 160600, 81299, 79301, 10000, 18000, 8000, 5209, 38092, 'folga'],
    ['2027-06', 160600, 41799, 118801, 10000, 18000, 8000, 5209, 77592, 'folga'],
    ['2027-07', 160600, 36999, 123601, 10000, 18000, 8000, 5209, 82392, 'folga'],
    ['2026-10', 150000, 114199, 35801, 10000, 11997, 5332, 3471, 5001, 'apertado'],
    ['2026-10', 120000, 114199, 5801, 5801, 0, 0, 0, 0, 'critico'],
    ['2026-10', 100000, 114199, -14199, 0, 0, 0, 0, 0, 'deficit'],
  ] as const)(
    '%s com renda %i → reserva %i (%s)',
    (mes, renda, contasFixas, sobra, higiene, churrasco, lazer, roupas, reserva, situacao) => {
      const plano = calcularPlano(entrada(mes, renda))
      expect(plano.contasFixas).toBe(contasFixas)
      expect(plano.sobra).toBe(sobra)
      expect(plano.tetos).toEqual({ higiene, churrasco, lazer, roupas })
      expect(plano.reserva).toBe(reserva)
      expect(plano.situacao).toBe(situacao)
    },
  )

  it('devolve o mês e a renda recebidos', () => {
    const plano = calcularPlano(entrada('2026-10'))
    expect(plano.mes).toBe('2026-10')
    expect(plano.renda).toBe(160600)
  })
})

describe('mensagens', () => {
  it('folga: diz quanto sobrou além da reserva mínima', () => {
    expect(calcularPlano(entrada('2026-10')).mensagens).toEqual([
      `Seus planos couberam. Os ${R$}1,92 que sobraram vão para a reserva.`,
    ])
  })

  it('justo: os desejos couberam exatamente', () => {
    // Renda que deixa sobrar exatamente 41209 (categorias) + 5000 (reserva mínima)
    const plano = calcularPlano(entrada('2026-10', 114199 + 41209 + 5000))
    expect(plano.situacao).toBe('justo')
    expect(plano.reserva).toBe(5000)
    expect(plano.mensagens).toEqual([`Seus planos couberam, com a reserva mínima de ${R$}50,00.`])
  })

  it('apertado: cita a reserva mínima e o corte arredondado (33,35% → 33%)', () => {
    expect(calcularPlano(entrada('2026-10', 150000)).mensagens).toEqual([
      `Para guardar ${R$}50,00, reduzi os gastos flexíveis em 33%.`,
    ])
  })

  it('critico: diz quanto sobra depois das contas fixas', () => {
    expect(calcularPlano(entrada('2026-10', 120000)).mensagens).toEqual([
      `Depois das contas fixas sobram só ${R$}58,01. Não dá para cobrir os essenciais e a reserva.`,
    ])
  })

  it('deficit: diz quanto as contas passam da renda', () => {
    expect(calcularPlano(entrada('2026-10', 100000)).mensagens).toEqual([
      `As contas fixas passam da renda em ${R$}141,99.`,
    ])
  })
})

describe('casos de borda', () => {
  it('é crítico quando os essenciais cabem mas a reserva mínima não', () => {
    // Sobra 12000: higiene leva 10000 e a reserva só recebe 2000 dos 5000.
    const plano = calcularPlano(entrada('2026-10', 114199 + 12000))
    expect(plano.tetos.higiene).toBe(10000)
    expect(plano.tetos.churrasco).toBe(0)
    expect(plano.reserva).toBe(2000)
    expect(plano.situacao).toBe('critico')
  })

  it('manda os centavos do arredondamento para a reserva', () => {
    const tres: Categoria[] = ['a', 'b', 'c'].map((id, ordem) => ({
      id,
      nome: id,
      desejo: 100,
      essencial: false,
      cor: 'c1',
      ordem,
    }))
    // 100 centavos para 3 categorias que querem 100 cada: 33 + 33 + 33, sobra 1.
    const plano = calcularPlano({ renda: 100, reservaMinima: 0, contas: [], categorias: tres, mes: '2026-10' })
    expect(plano.tetos).toEqual({ a: 33, b: 33, c: 33 })
    expect(plano.reserva).toBe(1)
  })

  it('sem categorias, toda a sobra vira reserva', () => {
    const plano = calcularPlano({ renda: 160600, reservaMinima: 5000, contas, categorias: [], mes: '2026-10' })
    expect(plano.tetos).toEqual({})
    expect(plano.reserva).toBe(46401)
    expect(plano.situacao).toBe('folga')
  })

  it('devolve os tetos na ordem das categorias recebidas', () => {
    const invertidas = [...categorias].reverse()
    const plano = calcularPlano({ ...entrada('2026-10'), categorias: invertidas })
    expect(Object.keys(plano.tetos)).toEqual(['roupas', 'lazer', 'churrasco', 'higiene'])
  })

  it('não altera os dados recebidos', () => {
    const congelada = Object.freeze({
      ...entrada('2026-10', 150000),
      contas: Object.freeze(contas.map((c) => Object.freeze({ ...c }))) as typeof contas,
      categorias: Object.freeze(categorias.map((c) => Object.freeze({ ...c }))) as typeof categorias,
    })
    expect(() => calcularPlano(congelada)).not.toThrow()
  })
})

describe('propriedade: tudo soma a renda', () => {
  // Gerador de números pseudoaleatórios com semente fixa: os "sorteios" são
  // sempre os mesmos, então o teste nunca passa numa execução e falha na outra.
  function sorteador(semente: number) {
    let estado = semente
    return (max: number) => {
      estado = (estado * 1103515245 + 12345) % 2147483648
      return estado % (max + 1)
    }
  }

  it('contasFixas + soma(tetos) + reserva === renda sempre que sobra >= 0', () => {
    const sortear = sorteador(42)
    let casosComSobra = 0

    for (let caso = 0; caso < 1000; caso++) {
      const categoriasSorteadas: Categoria[] = Array.from({ length: sortear(6) }, (_, i) => ({
        id: `cat${i}`,
        nome: `Categoria ${i}`,
        desejo: sortear(50000),
        essencial: sortear(1) === 1,
        cor: 'c1',
        ordem: i,
      }))
      const plano = calcularPlano({
        renda: sortear(300000),
        reservaMinima: sortear(20000),
        contas,
        categorias: categoriasSorteadas,
        mes: '2026-10',
      })
      if (plano.sobra < 0) continue

      casosComSobra++
      const somaTetos = Object.values(plano.tetos).reduce((a, b) => a + b, 0)
      expect(plano.contasFixas + somaTetos + plano.reserva).toBe(plano.renda)
      expect(Object.values(plano.tetos).every(Number.isInteger)).toBe(true)
      expect(Number.isInteger(plano.reserva)).toBe(true)
    }

    // Garante que o sorteio realmente testou muitos casos.
    expect(casosComSobra).toBeGreaterThan(300)
  })
})
