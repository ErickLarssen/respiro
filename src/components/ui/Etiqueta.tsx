// Etiqueta de estado (docs/08-design.md, seções 7.5 e 7.10). A cor nunca vem sozinha:
// o texto (OK, ATENÇÃO, ESTOUROU) sempre acompanha.

export type EstadoEtiqueta = 'ok' | 'atencao' | 'estourou'

const ESTILO: Record<EstadoEtiqueta, { texto: string; cor: string }> = {
  ok: { texto: 'OK', cor: 'var(--ok)' },
  atencao: { texto: 'Atenção', cor: 'var(--warn)' },
  estourou: { texto: 'Estourou', cor: 'var(--danger)' },
}

export default function Etiqueta({ estado }: { estado: EstadoEtiqueta }) {
  const { texto, cor } = ESTILO[estado]
  return (
    <span
      className="inline-flex h-5 items-center rounded-full px-2 font-display text-[9.5px] leading-none tracking-[0.14em] uppercase"
      style={{ color: cor, background: `color-mix(in srgb, ${cor} 14%, transparent)` }}
    >
      {texto}
    </span>
  )
}
