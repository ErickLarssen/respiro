import { Plus } from 'lucide-react'
import { useState } from 'react'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import Segmentado from '../../components/ui/Segmentado'
import { apagarConta, salvarConta } from '../../data/repositorio'
import { parcelasRestantes, ultimaParcelaPorRestantes } from '../../domain/contas'
import { lerValorDigitado, formatarBRL, valorParaDigitar } from '../../domain/dinheiro'
import type { Conta, Mes } from '../../domain/tipos'
import { useLayout } from '../../hooks/useLayout'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'
import PreviaReserva from '../../components/PreviaReserva'
import { Secao } from './comum'
import { proximaOrdem } from './ordem'

// Ajustes › Contas fixas: lista editável. Parcela pede "parcelas restantes" (como o usuário
// pensa) e o app converte em ultimaParcela (docs/03-regras-de-negocio.md, seção 1).

function resumoDaConta(conta: Conta, mes: Mes): string {
  const partes: string[] = []
  if (conta.tipo === 'recorrente') partes.push('Todo mês')
  else {
    const faltam = parcelasRestantes(conta, mes) ?? 0
    partes.push(faltam === 0 ? 'Parcelas acabaram' : `Faltam ${faltam} ${faltam === 1 ? 'parcela' : 'parcelas'}`)
  }
  if (conta.pagaNoCredito) partes.push('no crédito')
  return partes.join(' · ')
}

export default function SecaoContas({ dados }: { dados: PlanoDoMes }) {
  const [editando, setEditando] = useState<string | 'nova' | null>(null)
  const mes = dados.plano.mes

  return (
    <Secao titulo="Contas fixas" descricao="Saem primeiro da renda, todo mês. Parcelas somem sozinhas depois da última.">
      {dados.contas.length === 0 && editando !== 'nova' && (
        <p className="text-small text-fg-muted">Nenhuma conta fixa ainda.</p>
      )}
      <ul className="-my-2 divide-y divide-line">
        {dados.contas.map((conta) =>
          editando === conta.id ? (
            <li key={conta.id} className="py-4">
              <EditorConta dados={dados} conta={conta} onFechar={() => setEditando(null)} />
            </li>
          ) : (
            <li key={conta.id}>
              <button
                type="button"
                onClick={() => setEditando(conta.id)}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors duration-[120ms] active:bg-bg-2"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{conta.nome}</span>
                  <span className="text-small text-fg-muted">{resumoDaConta(conta, mes)}</span>
                </span>
                <span className="font-mono text-num tabular-nums">{formatarBRL(conta.valor)}</span>
              </button>
            </li>
          ),
        )}
      </ul>

      {editando === 'nova' ? (
        <EditorConta dados={dados} conta={null} onFechar={() => setEditando(null)} />
      ) : (
        <Botao variante="secundario" onClick={() => setEditando('nova')}>
          <Plus size={18} aria-hidden="true" /> Adicionar conta
        </Botao>
      )}
    </Secao>
  )
}

interface EditorContaProps {
  dados: PlanoDoMes
  conta: Conta | null // null = conta nova
  onFechar: () => void
}

function EditorConta({ dados, conta, onFechar }: EditorContaProps) {
  const { mostrarAviso } = useLayout()
  const mes = dados.plano.mes
  const [nome, setNome] = useState(conta?.nome ?? '')
  const [valor, setValor] = useState(conta ? valorParaDigitar(conta.valor) : '')
  const [tipo, setTipo] = useState<Conta['tipo']>(conta?.tipo ?? 'recorrente')
  const [restantes, setRestantes] = useState(conta?.tipo === 'parcela' ? String(parcelasRestantes(conta, mes) ?? 0) : '')
  const [noCredito, setNoCredito] = useState<'nao' | 'sim'>(conta?.pagaNoCredito ? 'sim' : 'nao')
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [confirmandoRemover, setConfirmandoRemover] = useState(false)

  const valorLido = lerValorDigitado(valor)
  const restantesLido = /^\d{1,3}$/.test(restantes.trim()) ? Number(restantes.trim()) : null
  const erros = {
    nome: nome.trim() === '' ? 'Dê um nome para a conta.' : null,
    valor: valorLido === null || valorLido <= 0 ? 'Digite um valor maior que zero.' : null,
    restantes:
      tipo === 'parcela' && (restantesLido === null || restantesLido < 1) ? 'Digite quantas parcelas faltam (1 ou mais).' : null,
  }
  const valido = !erros.nome && !erros.valor && !erros.restantes

  /** A conta como ficaria salva, ou null se o formulário ainda tem erro. */
  function montar(): Conta | null {
    if (!valido || valorLido === null) return null
    const base: Conta = {
      id: conta?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      valor: valorLido,
      tipo,
      ordem: conta?.ordem ?? proximaOrdem(dados.contas),
    }
    if (tipo === 'parcela' && restantesLido !== null) base.ultimaParcela = ultimaParcelaPorRestantes(mes, restantesLido)
    if (conta?.observacao) base.observacao = conta.observacao
    if (noCredito === 'sim') base.pagaNoCredito = true
    return base
  }

  const nova = montar()
  const contasDepois = nova ? [...dados.contas.filter((c) => c.id !== nova.id), nova] : null

  async function salvar() {
    setTentouSalvar(true)
    if (!nova) return
    await salvarConta(nova)
    mostrarAviso({ tom: 'ok', texto: conta ? 'Conta salva' : 'Conta adicionada' })
    onFechar()
  }

  async function remover() {
    if (!conta) return
    await apagarConta(conta.id)
    mostrarAviso({ tom: 'ok', texto: `Conta removida: ${conta.nome}` })
    onFechar()
  }

  const mostrar = (erro: string | null) => (tentouSalvar ? erro : null)

  if (confirmandoRemover && conta) {
    return (
      <div role="group" aria-label="Confirmar remoção" className="flex flex-col gap-3">
        <p className="text-small">Remover "{conta.nome}"? Ela sai do plano de todos os meses.</p>
        <PreviaReserva dados={dados} mudanca={{ contas: dados.contas.filter((c) => c.id !== conta.id) }} />
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
      <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={mostrar(erros.nome)} placeholder="Ex.: Internet" />
      <Campo rotulo="Valor por mês (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} erro={mostrar(erros.valor)} />
      <Segmentado
        rotulo="Tipo"
        idLente={`lente-tipo-${conta?.id ?? 'nova'}`}
        valor={tipo}
        onChange={setTipo}
        opcoes={[
          { valor: 'recorrente', rotulo: 'Todo mês' },
          { valor: 'parcela', rotulo: 'Parcelada' },
        ]}
      />
      {tipo === 'parcela' && (
        <Campo
          rotulo="Parcelas restantes"
          inputMode="numeric"
          value={restantes}
          onChange={(e) => setRestantes(e.target.value)}
          erro={mostrar(erros.restantes)}
          dica="Contando a deste mês. Ex.: 8 = paga de agora até 7 meses para frente."
        />
      )}
      <Segmentado
        rotulo="Paga no cartão de crédito?"
        idLente={`lente-credito-${conta?.id ?? 'nova'}`}
        valor={noCredito}
        onChange={setNoCredito}
        opcoes={[
          { valor: 'nao', rotulo: 'Não' },
          { valor: 'sim', rotulo: 'Sim' },
        ]}
      />

      {contasDepois && <PreviaReserva dados={dados} mudanca={{ contas: contasDepois }} />}

      <div className="grid grid-cols-2 gap-3">
        <Botao variante="secundario" onClick={onFechar}>
          Cancelar
        </Botao>
        <Botao onClick={salvar}>Salvar</Botao>
      </div>
      {conta && (
        <Botao variante="fantasma" className="self-start text-danger" onClick={() => setConfirmandoRemover(true)}>
          Remover conta
        </Botao>
      )}
    </div>
  )
}
