import type { HTMLAttributes } from 'react'
import { useSpotlight } from '../../ui/useSpotlight'

// Cartão com brilho que segue o cursor, ou que aparece no ponto tocado no celular
// (docs/08-design.md, seção 7.3). Use só para objetos separados, não para linhas de lista.
export default function Cartao({ className = '', children, ...resto }: HTMLAttributes<HTMLDivElement>) {
  const spotlight = useSpotlight<HTMLDivElement>()
  return (
    <div className={`cartao ${className}`} {...spotlight} {...resto}>
      {children}
    </div>
  )
}
