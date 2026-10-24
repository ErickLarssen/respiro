import { useState } from 'react'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import { salvarConfig } from '../../data/repositorio'
import { lerValorDigitado, valorParaDigitar } from '../../domain/dinheiro'
import type { Config } from '../../domain/tipos'
import { useLayout } from '../../hooks/useLayout'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'
import PreviaReserva from '../../components/PreviaReserva'
import { Secao } from './comum'

// Ajustes › Renda: valor, dia útil do salário, reserva mínima e meta do colchão.
// O cartão de crédito tem a sua própria seção (SecaoCartao).

export default function SecaoRenda({ dados }: { dados: PlanoDoMes }) {
  const { config } = dados
  const { mostrarAviso } = useLayout()
  const [renda, setRenda] = useState(valorParaDigitar(config.renda))
  const [dia, setDia] = useState(String(config.diaUtilSalario))
  const [reserva, setReserva] = useState(valorParaDigitar(config.reservaMinima))
  const [meta, setMeta] = useState(valorParaDigitar(config.metaColchao ?? 0))
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Leitura e validação de cada campo
  const rendaLida = lerValorDigitado(renda)
  const diaLido = /^\d{1,2}$/.test(dia.trim()) ? Number(dia.trim()) : null
  const reservaLida = lerValorDigitado(reserva)
  const metaLida = meta.trim() === '' ? 0 : lerValorDigitado(meta)
  const erros = {
    renda: rendaLida === null || rendaLida <= 0 ? 'Digite uma renda maior que zero.' : null,
    dia: diaLido === null || diaLido < 1 || diaLido > 22 ? 'Digite um dia útil de 1 a 22.' : null,
    reserva: reservaLida === null ? 'Digite a reserva mínima (pode ser 0).' : null,
    meta: metaLida === null ? 'Digite a meta do colchão (0 = sem colchão).' : null,
  }
  const valido = !erros.renda && !erros.dia && !erros.reserva && !erros.meta

  const mudou =
    rendaLida !== config.renda ||
    diaLido !== config.diaUtilSalario ||
    reservaLida !== config.reservaMinima ||
    metaLida !== (config.metaColchao ?? 0)

  async function salvar() {
    setTentouSalvar(true)
    if (!valido || rendaLida === null || diaLido === null || reservaLida === null || metaLida === null) return
    setSalvando(true)
    const nova: Config = {
      ...config,
      renda: rendaLida,
      diaUtilSalario: diaLido,
      reservaMinima: reservaLida,
      metaColchao: metaLida,
    }
    await salvarConfig(nova)
    setSalvando(false)
    setTentouSalvar(false)
    mostrarAviso({ tom: 'ok', texto: 'Renda salva' })
  }

  const mostrar = (erro: string | null) => (tentouSalvar ? erro : null)

  return (
    <Secao titulo="Renda">
      <Campo rotulo="Renda do mês (R$)" inputMode="decimal" value={renda} onChange={(e) => setRenda(e.target.value)} erro={mostrar(erros.renda)} />
      <Campo
        rotulo="Dia útil do salário"
        inputMode="numeric"
        value={dia}
        onChange={(e) => setDia(e.target.value)}
        erro={mostrar(erros.dia)}
        dica="Ex.: 10 = o salário cai no 10º dia útil do mês."
      />
      <Campo
        rotulo="Reserva mínima (R$)"
        inputMode="decimal"
        value={reserva}
        onChange={(e) => setReserva(e.target.value)}
        erro={mostrar(erros.reserva)}
        dica="O mínimo a guardar por mês, antes dos gastos flexíveis."
      />
      <Campo
        rotulo="Meta do colchão (R$)"
        inputMode="decimal"
        value={meta}
        onChange={(e) => setMeta(e.target.value)}
        erro={mostrar(erros.meta)}
        dica="Dinheiro para não passar o mês duro. Quanto separar por mês você define no Plano; ao chegar na meta, o app para de separar. 0 = sem colchão."
      />

      {mudou && valido && rendaLida !== null && reservaLida !== null && metaLida !== null && (
        <PreviaReserva dados={dados} mudanca={{ renda: rendaLida, reservaMinima: reservaLida, metaColchao: metaLida }} />
      )}

      <Botao onClick={salvar} disabled={!mudou} carregando={salvando}>
        Salvar
      </Botao>
    </Secao>
  )
}
