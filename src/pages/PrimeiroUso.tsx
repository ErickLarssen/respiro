import { useState } from 'react'
import Botao from '../components/ui/Botao'
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
      <h1 className="font-display text-title tracking-[0.02em]">Boas-vindas ao Respiro</h1>
      <p className="text-fg-muted">Seus dados ficam só neste aparelho. Como você quer começar?</p>

      <Botao disabled={salvando} onClick={() => comecar(() => substituirTudo(dadosIniciais))}>
        Começar com meus dados
      </Botao>
      <Botao variante="secundario" disabled={salvando} onClick={() => comecar(() => comecarDoZero(hoje))}>
        Começar do zero
      </Botao>

      {erro && (
        <p role="alert" className="text-danger">
          {erro}
        </p>
      )}
    </main>
  )
}
