import { motion } from 'motion/react'
import { molaFirme } from '../../ui/movimento'

// Controle segmentado (docs/08-design.md, seção 7.7): opções lado a lado numa
// pílula, com a "lente" deslizando até a escolhida. Ex.: Pix | Débito | Dinheiro | Crédito.

export interface OpcaoSegmentada<T extends string> {
  valor: T
  rotulo: string
}

interface SegmentadoProps<T extends string> {
  rotulo: string
  opcoes: OpcaoSegmentada<T>[]
  valor: T
  onChange: (valor: T) => void
  /** Nome único da lente na tela: duas lentes com o mesmo nome deslizariam entre si. */
  idLente: string
}

export default function Segmentado<T extends string>({ rotulo, opcoes, valor, onChange, idLente }: SegmentadoProps<T>) {
  return (
    <fieldset className="flex flex-col">
      <legend className="rotulo mb-3 text-[10px] text-fg-muted">{rotulo}</legend>
      <div
        className="grid rounded-full border border-line bg-bg-2 p-1"
        style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
      >
        {opcoes.map((opcao) => {
          const selecionada = opcao.valor === valor
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={selecionada}
              onClick={() => onChange(opcao.valor)}
              className={`relative h-11 rounded-full text-[14px] font-medium ${selecionada ? 'text-fg' : 'text-fg-muted'}`}
            >
              {selecionada && (
                <motion.span
                  layoutId={idLente}
                  transition={molaFirme}
                  className="absolute inset-0 rounded-full border border-line-strong bg-bg-1"
                />
              )}
              <span className="relative">{opcao.rotulo}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
