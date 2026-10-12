import { useSearchParams } from 'react-router'
import { mesDaData } from '../domain/datas'
import type { Mes } from '../domain/tipos'
import { useHoje } from './useHoje'

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/

export interface MesSelecionado {
  mes: Mes // o mês aberto na tela
  mesAtual: Mes // o mês de hoje
  trocarMes: (mes: Mes) => void
}

/**
 * O mês aberto nas abas Início, Gastos e Plano. Fica na URL (?mes=2026-11):
 * sem o parâmetro, vale o mês atual. Por isso cada aba abre sempre no mês atual
 * e recarregar a página mantém o mês escolhido.
 */
export function useMesSelecionado(): MesSelecionado {
  const [parametros, setParametros] = useSearchParams()
  const mesAtual = mesDaData(useHoje())
  const doEndereco = parametros.get('mes')
  const mes = doEndereco && FORMATO_MES.test(doEndereco) ? doEndereco : mesAtual

  function trocarMes(novo: Mes) {
    setParametros(
      (atuais) => {
        const proximos = new URLSearchParams(atuais)
        if (novo === mesAtual) proximos.delete('mes')
        else proximos.set('mes', novo)
        return proximos
      },
      { replace: true }, // trocar de mês não enche o histórico do botão "voltar"
    )
  }

  return { mes, mesAtual, trocarMes }
}
