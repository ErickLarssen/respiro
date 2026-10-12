import { Hammer } from 'lucide-react'

// Página provisória das abas que chegam na Etapa 4 (Gastos e Ajustes).
export default function EmBreve({ titulo }: { titulo: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 pb-28 text-center">
      <Hammer size={32} strokeWidth={1.25} className="text-fg-faint" aria-hidden="true" />
      <h1 className="font-display text-title tracking-[0.02em]">{titulo}</h1>
      <p className="text-small text-fg-muted">Esta tela chega na Etapa 4.</p>
    </main>
  )
}
