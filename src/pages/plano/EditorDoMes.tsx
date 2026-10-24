import { useState } from 'react'
import { Link } from 'react-router'
import PreviaReserva from '../../components/PreviaReserva'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import { apagarMesPlanejado, salvarMesPlanejado } from '../../data/repositorio'
import { mesPorExtenso, nomeDoMes } from '../../domain/datas'
import { lerValorDigitado, valorParaDigitar } from '../../domain/dinheiro'
import { planejamentoDoMes } from '../../domain/planejamento'
import type { Centavos } from '../../domain/tipos'
import { useLayout } from '../../hooks/useLayout'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'

// Editor do plano de um mês (docs/03-regras-de-negocio.md, seção 7): quanto gostaria
// de gastar em cada categoria e quanto separar no colchão, só para este mês.
// Os meses seguintes sem plano próprio copiam este.

export default function EditorDoMes({ dados, onFechar }: { dados: PlanoDoMes; onFechar: () => void }) {
  const { mostrarAviso } = useLayout()
  const { planejamento, categorias, config } = dados
  const mes = dados.plano.mes
  const temColchao = (config.metaColchao ?? 0) > 0

  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(categorias.map((c) => [c.id, valorParaDigitar(planejamento.desejos[c.id] ?? 0)])),
  )
  const [colchao, setColchao] = useState(valorParaDigitar(planejamento.colchao))
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Leitura de cada campo (null = texto inválido)
  const lidos = Object.fromEntries(categorias.map((c) => [c.id, lerValorDigitado(valores[c.id] ?? '')]))
  const colchaoLido = lerValorDigitado(colchao)
  const valido = Object.values(lidos).every((v) => v !== null) && colchaoLido !== null
  const desejos = Object.fromEntries(Object.entries(lidos).map(([id, v]) => [id, v ?? 0])) as Record<string, Centavos>

  // Se este mês já tem plano próprio, de onde ele voltaria a copiar ao desfazer?
  const proprio = planejamento.origem === mes
  const origemSemEste = proprio
    ? planejamentoDoMes(
        dados.planejados.filter((p) => p.mes !== mes),
        categorias,
        mes,
      ).origem
    : null

  async function salvar() {
    setTentouSalvar(true)
    if (!valido || colchaoLido === null) return
    setSalvando(true)
    await salvarMesPlanejado({ mes, desejos, colchao: colchaoLido })
    mostrarAviso({ tom: 'ok', texto: `Plano de ${nomeDoMes(mes)} salvo` })
    onFechar()
  }

  async function desfazer() {
    await apagarMesPlanejado(mes)
    mostrarAviso({ tom: 'ok', texto: `${mesPorExtenso(mes)} voltou a copiar ${nomeDoMes(origemSemEste ?? mes)}` })
    onFechar()
  }

  const erro = (texto: string | null | undefined) => (tentouSalvar ? texto : null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="rotulo text-[10px] text-fg-muted">Plano de {mesPorExtenso(mes)}</h3>
        <p className="text-small text-fg-muted">
          Quanto você gostaria de gastar em cada coisa só neste mês. Os meses seguintes sem plano próprio copiam este.
          Para tirar uma categoria do mês, deixe em 0.
        </p>
      </div>

      {categorias.map((categoria) => (
        <Campo
          key={categoria.id}
          rotulo={`${categoria.nome} (R$)`}
          inputMode="decimal"
          value={valores[categoria.id] ?? ''}
          onChange={(e) => setValores({ ...valores, [categoria.id]: e.target.value })}
          erro={erro(lidos[categoria.id] === null ? 'Digite um valor (pode ser 0).' : null)}
          dica={categoria.essencial ? 'Essencial: recebe o valor inteiro.' : undefined}
        />
      ))}

      {temColchao ? (
        <Campo
          rotulo="Colchão (R$)"
          inputMode="decimal"
          value={colchao}
          onChange={(e) => setColchao(e.target.value)}
          erro={erro(colchaoLido === null ? 'Digite um valor (pode ser 0).' : null)}
          dica="Quanto separar neste mês para não passar o mês duro. Para quando o colchão chegar na meta."
        />
      ) : (
        <p className="text-small text-fg-muted">
          Para separar um colchão todo mês, defina a meta em{' '}
          <Link to="/ajustes" className="text-accent underline underline-offset-4">
            Ajustes
          </Link>
          .
        </p>
      )}

      {valido && colchaoLido !== null && <PreviaReserva dados={dados} mudanca={{ desejos, colchao: colchaoLido }} />}

      <div className="grid grid-cols-2 gap-3">
        <Botao variante="secundario" onClick={onFechar}>
          Cancelar
        </Botao>
        <Botao onClick={salvar} carregando={salvando}>
          Salvar
        </Botao>
      </div>
      {proprio && origemSemEste && (
        <Botao variante="fantasma" className="self-start" onClick={desfazer}>
          Voltar a copiar {nomeDoMes(origemSemEste)}
        </Botao>
      )}
    </div>
  )
}
