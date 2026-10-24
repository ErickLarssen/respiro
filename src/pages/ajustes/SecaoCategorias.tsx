import { Plus } from 'lucide-react'
import { useState } from 'react'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import Segmentado from '../../components/ui/Segmentado'
import { adicionarCategoriaNoPlano, apagarCategoria, salvarCategoria } from '../../data/repositorio'
import { nomeDoMes } from '../../domain/datas'
import { formatarBRL, lerValorDigitado } from '../../domain/dinheiro'
import type { Categoria } from '../../domain/tipos'
import { useLayout } from '../../hooks/useLayout'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'
import PreviaReserva from '../../components/PreviaReserva'
import { Secao } from './comum'
import { proximaOrdem } from './ordem'

// Ajustes › Categorias: nome, essencial ou flexível, descrição e cor. O valor de cada
// mês fica no plano do mês (aba Plano). Uma categoria nova pede o valor "a partir deste
// mês" (docs/03-regras-de-negocio.md, seção 7).

const CORES: Categoria['cor'][] = ['c1', 'c2', 'c3', 'c4', 'c5']

export default function SecaoCategorias({ dados }: { dados: PlanoDoMes }) {
  const [editando, setEditando] = useState<string | 'nova' | null>(null)

  return (
    <Secao
      titulo="Categorias"
      descricao="Essenciais recebem o valor inteiro; flexíveis são reduzidas se o dinheiro não der. O valor de cada mês você ajusta na aba Plano."
    >
      {dados.categorias.length === 0 && editando !== 'nova' && (
        <p className="text-small text-fg-muted">Nenhuma categoria ainda.</p>
      )}
      <ul className="-my-2 divide-y divide-line">
        {dados.categorias.map((categoria) =>
          editando === categoria.id ? (
            <li key={categoria.id} className="py-4">
              <EditorCategoria dados={dados} categoria={categoria} onFechar={() => setEditando(null)} />
            </li>
          ) : (
            <li key={categoria.id}>
              <button
                type="button"
                onClick={() => setEditando(categoria.id)}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-[120ms] active:bg-bg-2"
              >
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: `var(--${categoria.cor})` }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{categoria.nome}</span>
                  <span className="text-small text-fg-muted">
                    {categoria.essencial ? 'Essencial' : 'Flexível'} · teto este mês{' '}
                    {formatarBRL(dados.plano.tetos[categoria.id] ?? 0)}
                  </span>
                </span>
                <span className="font-mono text-num tabular-nums">
                  {formatarBRL(dados.planejamento.desejos[categoria.id] ?? 0)}
                </span>
              </button>
            </li>
          ),
        )}
      </ul>

      {editando === 'nova' ? (
        <EditorCategoria dados={dados} categoria={null} onFechar={() => setEditando(null)} />
      ) : (
        <Botao variante="secundario" onClick={() => setEditando('nova')}>
          <Plus size={18} aria-hidden="true" /> Adicionar categoria
        </Botao>
      )}
    </Secao>
  )
}

interface EditorCategoriaProps {
  dados: PlanoDoMes
  categoria: Categoria | null // null = categoria nova
  onFechar: () => void
}

function EditorCategoria({ dados, categoria, onFechar }: EditorCategoriaProps) {
  const { mostrarAviso } = useLayout()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [desejo, setDesejo] = useState('') // só para categoria nova
  const [tipo, setTipo] = useState<'essencial' | 'flexivel'>(categoria?.essencial ? 'essencial' : 'flexivel')
  const [descricao, setDescricao] = useState(categoria?.descricao ?? '')
  const [cor, setCor] = useState<Categoria['cor']>(
    categoria?.cor ?? CORES[dados.categorias.length % CORES.length] ?? 'c1',
  )
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [confirmandoRemover, setConfirmandoRemover] = useState(false)

  const desejoLido = lerValorDigitado(desejo)
  const erros = {
    nome: nome.trim() === '' ? 'Dê um nome para a categoria.' : null,
    desejo: !categoria && desejoLido === null ? 'Digite quanto gostaria de gastar por mês.' : null,
  }
  const mes = dados.plano.mes

  function montar(): Categoria | null {
    if (erros.nome || erros.desejo) return null
    const nova: Categoria = {
      id: categoria?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      desejo: categoria?.desejo ?? 0, // o valor de cada mês fica no plano do mês
      essencial: tipo === 'essencial',
      cor,
      ordem: categoria?.ordem ?? proximaOrdem(dados.categorias),
    }
    if (descricao.trim()) nova.descricao = descricao.trim()
    return nova
  }

  const nova = montar()
  const categoriasDepois = nova ? [...dados.categorias.filter((c) => c.id !== nova.id), nova].sort((a, b) => a.ordem - b.ordem) : null
  // Categoria nova: o valor digitado entra no plano deste mês
  const desejosDepois = nova && !categoria && desejoLido !== null ? { [nova.id]: desejoLido } : undefined

  async function salvar() {
    setTentouSalvar(true)
    if (!nova) return
    if (categoria) await salvarCategoria(nova)
    else await adicionarCategoriaNoPlano(nova, desejoLido ?? 0, mes)
    mostrarAviso({ tom: 'ok', texto: categoria ? 'Categoria salva' : 'Categoria adicionada' })
    onFechar()
  }

  async function remover() {
    if (!categoria) return
    await apagarCategoria(categoria.id)
    mostrarAviso({ tom: 'ok', texto: `Categoria removida: ${categoria.nome}` })
    onFechar()
  }

  const mostrar = (erro: string | null) => (tentouSalvar ? erro : null)

  if (confirmandoRemover && categoria) {
    return (
      <div role="group" aria-label="Confirmar remoção" className="flex flex-col gap-3">
        <p className="text-small">
          Remover "{categoria.nome}"? Os gastos dela continuam salvos e passam a contar como fora do plano.
        </p>
        <PreviaReserva dados={dados} mudanca={{ categorias: dados.categorias.filter((c) => c.id !== categoria.id) }} />
        <div className="grid grid-cols-2 gap-3">
          <Botao variante="secundario" onClick={() => setConfirmandoRemover(false)}>
            Cancelar
          </Botao>
          <Botao variante="perigo" onClick={remover}>
            Remover
          </Botao>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={mostrar(erros.nome)} placeholder="Ex.: Mercado" />
      {!categoria && (
        <Campo
          rotulo={`Quanto gostaria de gastar por mês (R$)`}
          inputMode="decimal"
          value={desejo}
          onChange={(e) => setDesejo(e.target.value)}
          erro={mostrar(erros.desejo)}
          dica={`Vale a partir de ${nomeDoMes(mes)}. Depois, ajuste cada mês na aba Plano.`}
        />
      )}
      <Segmentado
        rotulo="Tipo"
        idLente={`lente-essencial-${categoria?.id ?? 'nova'}`}
        valor={tipo}
        onChange={setTipo}
        opcoes={[
          { valor: 'flexivel', rotulo: 'Flexível' },
          { valor: 'essencial', rotulo: 'Essencial' },
        ]}
      />
      <Campo rotulo="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Pizza, lanches e cinema" />

      <fieldset className="flex flex-col">
        <legend className="rotulo mb-3 text-[10px] text-fg-muted">Cor</legend>
        <div className="flex gap-3">
          {CORES.map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-label={`Cor ${opcao.slice(1)}`}
              aria-pressed={cor === opcao}
              onClick={() => setCor(opcao)}
              className="grid size-11 place-items-center rounded-full border transition-transform duration-[120ms] active:scale-94"
              style={{ borderColor: cor === opcao ? `var(--${opcao})` : 'var(--line)' }}
            >
              <span className="size-6 rounded-full" style={{ background: `var(--${opcao})` }} />
            </button>
          ))}
        </div>
      </fieldset>

      {categoriasDepois && <PreviaReserva dados={dados} mudanca={{ categorias: categoriasDepois, desejos: desejosDepois }} />}

      <div className="grid grid-cols-2 gap-3">
        <Botao variante="secundario" onClick={onFechar}>
          Cancelar
        </Botao>
        <Botao onClick={salvar}>Salvar</Botao>
      </div>
      {categoria && (
        <Botao variante="fantasma" className="self-start text-danger" onClick={() => setConfirmandoRemover(true)}>
          Remover categoria
        </Botao>
      )}
    </div>
  )
}
