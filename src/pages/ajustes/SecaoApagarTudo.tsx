import { useState } from 'react'
import { useNavigate } from 'react-router'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import { apagarTudo } from '../../data/repositorio'
import { Secao } from './comum'

// Ajustes › Apagar tudo: só libera o botão depois de digitar APAGAR.
// Sem config, o app volta sozinho para a tela de primeiro uso.

const PALAVRA = 'APAGAR'

export default function SecaoApagarTudo() {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [apagando, setApagando] = useState(false)

  async function apagar() {
    setApagando(true)
    await apagarTudo()
    navegar('/', { replace: true })
  }

  return (
    <Secao titulo="Apagar tudo" descricao="Apaga renda, contas, categorias e gastos deste aparelho. Não dá para desfazer.">
      <Campo
        rotulo={`Digite ${PALAVRA} para confirmar`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoCapitalize="characters"
        autoComplete="off"
        dica="Antes, exporte um backup se quiser guardar os dados."
      />
      <Botao variante="perigo" disabled={texto.trim() !== PALAVRA} carregando={apagando} onClick={apagar}>
        Apagar todos os dados
      </Botao>
    </Secao>
  )
}
