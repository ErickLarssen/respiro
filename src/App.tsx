import { useConfig } from './hooks/useConfig'
import PlanoProvisorio from './pages/PlanoProvisorio'
import PrimeiroUso from './pages/PrimeiroUso'

// Etapa 2: sem config salva, mostra o primeiro uso; com config, o plano provisório.
// As abas e rotas chegam na Etapa 3.
export default function App() {
  const { carregando, config } = useConfig()

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      {carregando ? null : config ? <PlanoProvisorio config={config} /> : <PrimeiroUso />}
    </div>
  )
}
