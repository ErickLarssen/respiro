import { useOutletContext } from 'react-router'
import type { Gasto } from '../domain/tipos'
import type { AvisoDoGasto } from './anotarGasto'

// O que o layout das abas (App.tsx) oferece para as telas: abrir o painel de
// gasto (novo ou para editar) e mostrar um aviso no topo.
export interface ContextoDoLayout {
  abrirFolha: (gastoParaEditar?: Gasto) => void
  mostrarAviso: (aviso: AvisoDoGasto) => void
}

export function useLayout(): ContextoDoLayout {
  return useOutletContext<ContextoDoLayout>()
}
