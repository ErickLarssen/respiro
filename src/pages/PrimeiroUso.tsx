import { useState } from 'react'
import { dadosIniciais } from '../data/dadosIniciais'
import { comecarDoZero, substituirTudo } from '../data/repositorio'
import { useHoje } from '../hooks/useHoje'

// Aparece quando ainda não há config salva no aparelho. Ver docs/04-modelo-de-dados.md.
// Depois de salvar, a tela troca sozinha: o useConfig percebe a config nova no banco.
export default function PrimeiroUso() {
  const hoje = useHoje()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function comecar(acao: () => Promise<void>) {
    setSalvando(true)
    setErro(null)
    try {
      await acao()
    } catch {
      setErro('Não deu para salvar os dados neste aparelho. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Boas-vindas ao Respiro</h1>
      <p className="text-slate-400">Seus dados ficam só neste aparelho. Como você quer começar?</p>

      <button
        type="button"
        disabled={salvando}
        onClick={() => comecar(() => substituirTudo(dadosIniciais))}
        className="min-h-12 rounded-full bg-cyan-300 px-4 font-semibold text-slate-950 disabled:opacity-50"
      >
        Começar com meus dados
      </button>
      <button
        type="button"
        disabled={salvando}
        onClick={() => comecar(() => comecarDoZero(hoje))}
        className="min-h-12 rounded-full border border-slate-600 px-4 font-semibold disabled:opacity-50"
      >
        Começar do zero
      </button>

      {erro && (
        <p role="alert" className="text-red-400">
          {erro}
        </p>
      )}
    </main>
  )
}
