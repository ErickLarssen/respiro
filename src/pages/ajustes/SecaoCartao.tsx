import { useState } from 'react'
import Botao from '../../components/ui/Botao'
import Campo from '../../components/ui/Campo'
import { salvarConfig } from '../../data/repositorio'
import { mesPorExtenso, somarMeses } from '../../domain/datas'
import { formatarBRL, lerValorDigitado, valorParaDigitar } from '../../domain/dinheiro'
import type { Cartao } from '../../domain/tipos'
import { useLayout } from '../../hooks/useLayout'
import type { PlanoDoMes } from '../../hooks/usePlanoDoMes'
import { Secao } from './comum'

// Ajustes › Cartão de crédito (docs/03-regras-de-negocio.md, seção 5): limite, dias de
// fechamento e vencimento e o orçamento mensal. Tudo editável: o limite muda com o banco.

function lerDia(texto: string): number | null {
  const dia = /^\d{1,2}$/.test(texto.trim()) ? Number(texto.trim()) : null
  return dia !== null && dia >= 1 && dia <= 28 ? dia : null
}

export default function SecaoCartao({ dados }: { dados: PlanoDoMes }) {
  const { config } = dados
  const atual = config.cartao
  const mesAtual = dados.plano.mes
  const { mostrarAviso } = useLayout()

  const [limite, setLimite] = useState(atual ? valorParaDigitar(atual.limite) : '')
  const [fechamento, setFechamento] = useState(String(atual?.diaFechamento ?? 12))
  const [vencimento, setVencimento] = useState(String(atual?.diaVencimento ?? 20))
  const [orcamento, setOrcamento] = useState(atual ? valorParaDigitar(atual.orcamento) : '')
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const limiteLido = lerValorDigitado(limite)
  const fechamentoLido = lerDia(fechamento)
  const vencimentoLido = lerDia(vencimento)
  const orcamentoLido = lerValorDigitado(orcamento)
  const erros = {
    limite: limiteLido === null || limiteLido <= 0 ? 'Digite o limite do cartão.' : null,
    fechamento: fechamentoLido === null ? 'Digite um dia de 1 a 28.' : null,
    vencimento: vencimentoLido === null ? 'Digite um dia de 1 a 28.' : null,
    orcamento: orcamentoLido === null ? 'Digite quanto quer usar do cartão por mês.' : null,
  }
  const valido = !erros.limite && !erros.fechamento && !erros.vencimento && !erros.orcamento

  // Primeiro cadastro: a regra da fatura vale a partir do mês seguinte (seção 5.7)
  const regraDesde = atual?.regraDesde ?? somarMeses(mesAtual, 1)
  const mudou =
    !atual ||
    limiteLido !== atual.limite ||
    fechamentoLido !== atual.diaFechamento ||
    vencimentoLido !== atual.diaVencimento ||
    orcamentoLido !== atual.orcamento

  async function salvar() {
    setTentouSalvar(true)
    if (!valido || limiteLido === null || fechamentoLido === null || vencimentoLido === null || orcamentoLido === null) {
      return
    }
    setSalvando(true)
    const cartao: Cartao = {
      limite: limiteLido,
      diaFechamento: fechamentoLido,
      diaVencimento: vencimentoLido,
      orcamento: orcamentoLido,
      regraDesde,
    }
    await salvarConfig({ ...config, cartao })
    setSalvando(false)
    setTentouSalvar(false)
    mostrarAviso({ tom: 'ok', texto: atual ? 'Cartão salvo' : 'Cartão cadastrado' })
  }

  const mostrar = (erro: string | null) => (tentouSalvar ? erro : null)

  return (
    <Secao
      titulo="Cartão de crédito"
      descricao="Compras no crédito vão para a fatura, não para os tetos. A fatura entra no plano do mês em que vence."
    >
      <Campo
        rotulo="Limite (R$)"
        inputMode="decimal"
        value={limite}
        onChange={(e) => setLimite(e.target.value)}
        erro={mostrar(erros.limite)}
        dica="Mude sempre que o banco mudar o seu limite."
      />
      <div className="grid grid-cols-2 gap-3">
        <Campo
          rotulo="Fecha no dia"
          inputMode="numeric"
          value={fechamento}
          onChange={(e) => setFechamento(e.target.value)}
          erro={mostrar(erros.fechamento)}
        />
        <Campo
          rotulo="Vence no dia"
          inputMode="numeric"
          value={vencimento}
          onChange={(e) => setVencimento(e.target.value)}
          erro={mostrar(erros.vencimento)}
        />
      </div>
      <Campo
        rotulo="Orçamento por mês (R$)"
        inputMode="decimal"
        value={orcamento}
        onChange={(e) => setOrcamento(e.target.value)}
        erro={mostrar(erros.orcamento)}
        dica={
          orcamentoLido !== null && limiteLido !== null && orcamentoLido > limiteLido
            ? `Acima do limite de ${formatarBRL(limiteLido)}: o banco não deixaria gastar tudo isso.`
            : 'Quanto você quer usar do cartão por mês. Enquanto a fatura está aberta, o plano já separa esse valor.'
        }
      />

      <p className="rounded-[var(--r-sm)] border border-line px-3 py-2.5 text-small text-fg-muted">
        {atual
          ? `Compras no crédito a partir de ${mesPorExtenso(regraDesde)} vão para a fatura.`
          : `As compras no crédito a partir de ${mesPorExtenso(regraDesde)} vão para a fatura. As deste mês continuam contando nos tetos, como já contavam.`}
      </p>

      <Botao onClick={salvar} disabled={!mudou} carregando={salvando}>
        {atual ? 'Salvar' : 'Cadastrar cartão'}
      </Botao>
    </Secao>
  )
}
