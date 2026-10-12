import { useEffect, useId, useState } from 'react'
import { formatarBRL } from '../../domain/dinheiro'
import type { Centavos } from '../../domain/tipos'
import Valor from './Valor'

// Anel de fôlego (docs/08-design.md, seção 7.4): responde "quanto ainda posso gastar".
// O arco é a fração que ainda resta; o anel inteiro "respira" devagar (CSS .anel-respira).

const TAMANHO = 248
const TRACO = 12
const CENTRO = TAMANHO / 2
const RAIO = CENTRO - TRACO / 2 - 4
const CIRCUNFERENCIA = 2 * Math.PI * RAIO
const MARCACOES = 60
const LIMITE_APERTO = 0.2 // até 20% restante, o arco fica em --warn

// Largura disponível para o número no centro, em px.
const LARGURA_DO_NUMERO = 188
const FONTE_MAXIMA = 40

/**
 * Tamanho da fonte do número para ele caber dentro do anel. A Michroma é muito
 * larga: cada dígito ocupa ~0,95em. Ex.: "R$ 377,09" → 31px; "R$ 1.606,00" → 26px.
 */
function tamanhoDoNumero(valor: Centavos): number {
  const texto = formatarBRL(valor)
  const digitos = texto.replace(/\D/g, '').length
  const separadores = (texto.match(/[.,-]/g) ?? []).length
  const larguraEmEm = digitos * 0.95 + separadores * 0.35 + 0.8 // 0,8em = "R$" pequeno
  return Math.min(FONTE_MAXIMA, Math.floor(LARGURA_DO_NUMERO / larguraEmEm))
}

type EstadoAnel = 'folga' | 'aperto' | 'negativo'

interface AnelFolegoProps {
  /** Valor no centro (centavos). */
  valor: Centavos
  /** Fração do arco: 1 = cheio, 0 = vazio, negativo = passou do plano (anel vermelho). */
  proporcao: number
  rotulo: string
  /** Texto pequeno embaixo do número, ex.: "de R$ 412,09". */
  detalhe?: string
  /** Frase completa para leitores de tela. */
  descricao: string
}

export default function AnelFolego({ valor, proporcao, rotulo, detalhe, descricao }: AnelFolegoProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const estado: EstadoAnel = proporcao < 0 ? 'negativo' : proporcao <= LIMITE_APERTO ? 'aperto' : 'folga'
  const fracao = estado === 'negativo' ? 1 : Math.min(proporcao, 1)

  // Entrada: o arco começa vazio e se desenha até o valor (transição de 900ms no CSS).
  const [desenhado, setDesenhado] = useState(false)
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setDesenhado(true))
    return () => cancelAnimationFrame(quadro)
  }, [])
  const fracaoVisivel = desenhado ? fracao : 0

  const corDoArco =
    estado === 'negativo' ? 'var(--danger)' : estado === 'aperto' ? 'var(--warn)' : `url(#${id}-oxigenio)`
  const corDaPonta = estado === 'negativo' ? 'var(--danger)' : estado === 'aperto' ? 'var(--warn)' : 'var(--ok)'

  return (
    <div role="img" aria-label={descricao} className="relative mx-auto grid size-[248px] place-items-center">
      {/* Brilho atrás do anel (respira junto) */}
      <div aria-hidden="true" className="anel-brilho absolute inset-0 rounded-full" />

      <svg
        aria-hidden="true"
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        className="anel-respira absolute inset-0"
      >
        <defs>
          <linearGradient id={`${id}-oxigenio`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--ok)" />
          </linearGradient>
        </defs>

        {/* Trilho e marcações de mostrador */}
        <circle cx={CENTRO} cy={CENTRO} r={RAIO} fill="none" stroke="var(--line)" strokeWidth={TRACO} />
        {Array.from({ length: MARCACOES }, (_, i) => (
          <line
            key={i}
            x1={CENTRO}
            y1={TRACO + 10}
            x2={CENTRO}
            y2={TRACO + (i % 5 === 0 ? 16 : 13)}
            stroke="var(--fg-faint)"
            strokeOpacity={0.3}
            strokeWidth={1}
            transform={`rotate(${(360 / MARCACOES) * i} ${CENTRO} ${CENTRO})`}
          />
        ))}

        {/* Arco: começa no topo e anda no sentido horário */}
        <circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAIO}
          fill="none"
          stroke={corDoArco}
          strokeWidth={TRACO}
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - fracaoVisivel)}
          transform={`rotate(-90 ${CENTRO} ${CENTRO})`}
          className="anel-arco"
          opacity={fracao === 0 ? 0 : 1}
        />

        {/* Ponta brilhante: gira junto com o arco (só transform) */}
        {estado !== 'negativo' && fracao > 0 && (
          <g className="anel-ponta" style={{ transform: `rotate(${360 * fracaoVisivel}deg)` }}>
            <circle
              cx={CENTRO}
              cy={CENTRO - RAIO}
              r={3}
              fill="var(--luz-pura)"
              style={{ filter: `drop-shadow(0 0 4px ${corDaPonta}) drop-shadow(0 0 8px ${corDaPonta})` }}
            />
          </g>
        )}
      </svg>

      {/* Centro */}
      <div aria-hidden="true" className="relative flex flex-col items-center gap-3 px-8 text-center">
        <span className="rotulo text-[10px] text-fg-muted">{rotulo}</span>
        <Valor
          valor={valor}
          contarAoMontar
          className={`font-display tracking-[-0.01em] ${estado === 'negativo' ? 'text-danger' : ''}`}
          style={{ fontSize: tamanhoDoNumero(valor) }}
        />
        {detalhe && <span className="font-mono text-[12px] text-fg-muted uppercase">{detalhe}</span>}
      </div>
    </div>
  )
}
