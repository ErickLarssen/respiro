import { useEffect, useState, type CSSProperties } from 'react'
import { formatarBRL } from '../../domain/dinheiro'
import type { Centavos } from '../../domain/tipos'

// Contador de valor estilo odômetro (docs/08-design.md, seção 7.6).
// Cada dígito é uma coluna "0 a 9" dentro de uma caixa de largura fixa; trocar o
// dígito só move a coluna para cima ou para baixo (transform), e o CSS anima.
// Com movimento reduzido, o CSS desliga a transição e a troca é direta.

const DIGITOS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const SEPARADOR_MOEDA = 'R$ '

interface ValorProps {
  valor: Centavos
  /** Ao aparecer, os dígitos rolam a partir de zero (entrada do anel). */
  contarAoMontar?: boolean
  className?: string
  style?: CSSProperties
}

export default function Valor({ valor, contarAoMontar = false, className = '', style }: ValorProps) {
  const [montado, setMontado] = useState(!contarAoMontar)

  useEffect(() => {
    if (montado) return
    // Espera um quadro com os dígitos em zero para a transição ter de onde partir.
    const quadro = requestAnimationFrame(() => setMontado(true))
    return () => cancelAnimationFrame(quadro)
  }, [montado])

  const texto = formatarBRL(valor) // "-R$ 1.606,00"
  const [sinal = '', numero = ''] = texto.split(SEPARADOR_MOEDA)
  const caracteres = [...numero]

  return (
    <span className={`valor ${className}`} style={style}>
      {/* Leitores de tela leem o valor inteiro; as caixas de dígitos ficam escondidas deles. */}
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true" className="valor-sinal">
        {sinal}
      </span>
      <span aria-hidden="true" className="valor-moeda">
        R$
      </span>
      {caracteres.map((caractere, i) => {
        // A chave conta da direita: "9,99" → "10,00" mantém os centavos no lugar.
        const chave = caracteres.length - i
        const posicao = DIGITOS.indexOf(caractere)
        if (posicao === -1) {
          return (
            <span key={chave} aria-hidden="true" className="valor-sinal">
              {caractere}
            </span>
          )
        }
        return (
          <span key={chave} aria-hidden="true" className="valor-digito">
            <span
              className="valor-coluna"
              style={{ transform: `translateY(-${(montado ? posicao : 0) * 1.15}em)` }}
            >
              {DIGITOS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}
