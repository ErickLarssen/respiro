import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import Aviso, { type DadosAviso } from './components/ui/Aviso'
import BarraDeAbas from './components/ui/BarraDeAbas'
import FolhaNovoGasto from './components/ui/FolhaNovoGasto'
import { pedirArmazenamentoPersistente } from './data/armazenamento'
import type { Gasto } from './domain/tipos'
import type { AvisoDoGasto } from './hooks/anotarGasto'
import type { ContextoDoLayout } from './hooks/useLayout'
import { useCategorias } from './hooks/useCategorias'
import { useConfig } from './hooks/useConfig'
import { useHoje } from './hooks/useHoje'
import Ajustes from './pages/Ajustes'
import Inicio from './pages/Inicio'
import Gastos from './pages/Gastos'
import Plano from './pages/Plano'
import PrimeiroUso from './pages/PrimeiroUso'
import { useLuzDoCursor } from './ui/useLuzDoCursor'

// A vitrine só existe em desenvolvimento. No build de produção, import.meta.env.DEV
// vira false e o Vite nem inclui o código dela.
const Vitrine = import.meta.env.DEV ? lazy(() => import('./pages/Vitrine')) : null

/** Sem config salva, mostra o primeiro uso no lugar de qualquer tela. */
function ExigeConfig() {
  const { carregando, config } = useConfig()
  if (carregando) return null
  return config ? <Outlet /> : <PrimeiroUso />
}

/** Layout das abas: conteúdo + barra de abas + painel de anotar gasto + aviso. */
function Layout() {
  const hoje = useHoje()
  const { pathname } = useLocation()
  const categorias = useCategorias()
  const [folhaAberta, setFolhaAberta] = useState(false)
  const [gastoParaEditar, setGastoParaEditar] = useState<Gasto | null>(null)
  const [aviso, setAviso] = useState<DadosAviso | null>(null)

  // Já há dados no aparelho: pede para o navegador não apagá-los sozinho.
  useEffect(() => {
    void pedirArmazenamentoPersistente()
  }, [])

  function mostrarAviso(novoAviso: AvisoDoGasto) {
    setAviso({ ...novoAviso, id: Date.now() })
  }

  function aoSalvar(novoAviso: AvisoDoGasto) {
    setFolhaAberta(false)
    mostrarAviso(novoAviso)
  }

  // O que as telas podem pedir ao layout (ver hooks/useLayout.ts)
  const contexto: ContextoDoLayout = {
    abrirFolha: (gasto) => {
      setGastoParaEditar(gasto ?? null)
      setFolhaAberta(true)
    },
    mostrarAviso,
  }

  return (
    <>
      <Outlet context={contexto} />
      <BarraDeAbas mostrarMais={pathname === '/' || pathname === '/gastos'} onMais={() => contexto.abrirFolha()} />
      <FolhaNovoGasto
        aberta={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
        onSalvo={aoSalvar}
        categorias={categorias ?? []}
        hoje={hoje}
        gastoParaEditar={gastoParaEditar}
      />
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />
    </>
  )
}

export default function App() {
  useLuzDoCursor()

  return (
    <Routes>
      {Vitrine && (
        <Route
          path="/vitrine"
          element={
            <Suspense fallback={null}>
              <Vitrine />
            </Suspense>
          }
        />
      )}
      <Route element={<ExigeConfig />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="plano" element={<Plano />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
