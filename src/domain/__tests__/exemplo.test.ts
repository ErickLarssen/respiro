import { describe, expect, it } from 'vitest'

// Teste de exemplo da Etapa 0: confirma que o Vitest está funcionando.
// Será apagado na Etapa 1, quando chegarem os testes das regras de negócio.
describe('por que guardamos dinheiro em centavos', () => {
  it('erra ao somar reais com casas decimais', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
  })

  it('acerta ao somar centavos inteiros', () => {
    expect(10 + 20).toBe(30)
  })
})
