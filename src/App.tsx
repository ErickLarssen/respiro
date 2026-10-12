import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { useConfig } from './hooks/useConfig'
import PlanoProvisorio from './pages/PlanoProvisorio'
import PrimeiroUso from './pages/PrimeiroUso'
import { useLuzDoCursor } from './ui/useLuzDoCursor'

// A vitrine só existe em desenvolvimento. No build de produção, import.meta.env.DEV
// vira false e o Vite nem inclui o código dela.
const Vitrine = import.meta.env.DEV ? lazy(() => import('./pages/Vitrine')) : null

// Sem config salva, mostra o primeiro uso; com config, o plano provisório.
// As abas e as telas de verdade chegam no restante da Etapa 3.
function Inicio() {
  const { carregando, config } = useConfig()
  if (carregando) return null
  return config ? <PlanoProvisorio config={config} /> : <PrimeiroUso />
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
      <Route path="*" element={<Inicio />} />
    </Routes>
  )
}
