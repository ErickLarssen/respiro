import { lazy, Suspense, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import Aviso, { type DadosAviso } from './components/ui/Aviso'
import BarraDeAbas from './components/ui/BarraDeAbas'
import FolhaNovoGasto from './components/ui/FolhaNovoGasto'
import type { AvisoDoGasto } from './hooks/anotarGasto'
import { useCategorias } from './hooks/useCategorias'
import { useConfig } from './hooks/useConfig'
import { useHoje } from './hooks/useHoje'
import EmBreve from './pages/EmBreve'
import Inicio from './pages/Inicio'
import PlanoProvisorio from './pages/PlanoProvisorio'
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
  const [aviso, setAviso] = useState<DadosAviso | null>(null)

  function aoSalvar(novoAviso: AvisoDoGasto) {
    setFolhaAberta(false)
    setAviso({ ...novoAviso, id: Date.now() })
  }

  return (
    <>
      <Outlet />
      <BarraDeAbas mostrarMais={pathname === '/' || pathname === '/gastos'} onMais={() => setFolhaAberta(true)} />
      <FolhaNovoGasto
        aberta={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
        onSalvo={aoSalvar}
        categorias={categorias ?? []}
        hoje={hoje}
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
          <Route path="gastos" element={<EmBreve titulo="Gastos" />} />
          <Route path="plano" element={<PlanoProvisorio />} />
          <Route path="ajustes" element={<EmBreve titulo="Ajustes" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
