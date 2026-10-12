import { Download, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import Botao from '../../components/ui/Botao'
import { lerBackup, montarBackup, nomeDoArquivo, resumoDoBackup } from '../../data/backup'
import type { DadosIniciais } from '../../data/dadosIniciais'
import { lerTudo, substituirTudo } from '../../data/repositorio'
import { useHoje } from '../../hooks/useHoje'
import { useLayout } from '../../hooks/useLayout'
import { Secao } from './comum'

// Ajustes › Backup (docs/04-modelo-de-dados.md): os dados só existem neste aparelho.
// Apagar os dados do navegador apaga tudo, então o backup é a cópia de segurança.

/** Faz o navegador baixar um texto como arquivo. */
function baixar(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}

export default function SecaoBackup() {
  const hoje = useHoje()
  const { mostrarAviso } = useLayout()
  const seletorDeArquivo = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [paraImportar, setParaImportar] = useState<DadosIniciais | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function exportar() {
    setErro(null)
    try {
      const backup = montarBackup(await lerTudo())
      baixar(nomeDoArquivo(hoje), JSON.stringify(backup, null, 2))
      mostrarAviso({ tom: 'ok', texto: `Backup exportado: ${resumoDoBackup(backup)}` })
    } catch {
      setErro('Não deu para exportar o backup. Tente de novo.')
    }
  }

  async function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!arquivo) return
    setErro(null)
    const resultado = lerBackup(await arquivo.text())
    if (resultado.ok) setParaImportar(resultado.dados)
    else setErro(resultado.erro)
  }

  async function importar() {
    if (!paraImportar) return
    setOcupado(true)
    try {
      await substituirTudo(paraImportar)
      mostrarAviso({ tom: 'ok', texto: `Backup importado: ${resumoDoBackup(paraImportar)}` })
      setParaImportar(null)
    } catch {
      setErro('Não deu para importar. Seus dados continuam como estavam.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Secao titulo="Backup" descricao="Seus dados ficam só neste aparelho. Exporte um backup de vez em quando.">
      {paraImportar ? (
        <div role="group" aria-label="Confirmar importação" className="flex flex-col gap-3">
          <p>
            O backup tem <strong className="font-semibold">{resumoDoBackup(paraImportar)}</strong>.
          </p>
          <p className="text-small text-warn">Importar substitui todos os dados deste aparelho.</p>
          <div className="grid grid-cols-2 gap-3">
            <Botao variante="secundario" onClick={() => setParaImportar(null)}>
              Cancelar
            </Botao>
            <Botao onClick={importar} carregando={ocupado}>
              Substituir dados
            </Botao>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Botao variante="secundario" onClick={exportar}>
            <Download size={18} aria-hidden="true" /> Exportar
          </Botao>
          <Botao variante="secundario" onClick={() => seletorDeArquivo.current?.click()}>
            <Upload size={18} aria-hidden="true" /> Importar
          </Botao>
        </div>
      )}
      <input
        ref={seletorDeArquivo}
        type="file"
        accept=".json,application/json"
        onChange={aoEscolherArquivo}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {erro && (
        <p role="alert" className="text-small text-danger">
          {erro}
        </p>
      )}
    </Secao>
  )
}
