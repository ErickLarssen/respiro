import { useState, type ReactNode } from 'react'
import Aviso, { type DadosAviso } from '../components/ui/Aviso'
import Botao from '../components/ui/Botao'
import Campo from '../components/ui/Campo'
import Cartao from '../components/ui/Cartao'
import Etiqueta from '../components/ui/Etiqueta'
import Valor from '../components/ui/Valor'

// Vitrine (docs/08-design.md, seção 9): todos os componentes em todos os estados.
// Só existe em desenvolvimento (ver App.tsx). Para comparar os temas, troque o tema
// do sistema (no celular) ou use DevTools → ⋮ → More tools → Rendering →
// "Emulate CSS media feature prefers-color-scheme" (no computador).

const CORES = [
  'bg-0', 'bg-1', 'bg-2', 'line-strong', 'fg', 'fg-muted', 'fg-faint',
  'accent', 'accent-deep', 'ok', 'warn', 'danger', 'c1', 'c2', 'c3', 'c4', 'c5',
]

const ESCALA: [string, string][] = [
  ['text-hero font-display', 'hero · Michroma 44'],
  ['text-title font-display', 'title · Michroma 20'],
  ['text-amount font-mono font-medium', 'amount · R$ 412,09'],
  ['text-body', 'body · Seus planos couberam.'],
  ['text-small text-fg-muted', 'small · Restam R$ 45,00'],
  ['rotulo text-fg-faint', 'label · Ainda posso gastar'],
  ['text-num font-mono', 'num · 1.141,99'],
]

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="rotulo text-fg-faint">{titulo}</h2>
      {children}
    </section>
  )
}

export default function Vitrine() {
  const [valor, setValor] = useState(37709)
  const [chaveContagem, setChaveContagem] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [aviso, setAviso] = useState<DadosAviso | null>(null)

  function mostrarAviso(tom: DadosAviso['tom']) {
    setAviso({
      id: Date.now(),
      tom,
      texto: tom === 'ok' ? 'Gasto anotado: R$ 35,00 em Lazer' : 'Lazer: restam R$ 5,00 este mês',
    })
  }

  function simularCarregando() {
    setCarregando(true)
    setTimeout(() => setCarregando(false), 2000)
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-10 px-4 py-8 min-[400px]:px-5">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-title tracking-[0.02em]">Vitrine</h1>
        <p className="text-small text-fg-muted">
          Componentes do design system. Troque o tema do sistema para comparar claro e escuro.
        </p>
      </header>

      <Secao titulo="Tipografia">
        {ESCALA.map(([classe, texto]) => (
          <p key={texto} className={`${classe} truncate`}>
            {texto}
          </p>
        ))}
      </Secao>

      <Secao titulo="Cores">
        <div className="grid grid-cols-3 gap-2">
          {CORES.map((cor) => (
            <div key={cor} className="flex flex-col gap-1">
              <div className="h-10 rounded-sm border border-line" style={{ background: `var(--${cor})` }} />
              <span className="font-mono text-[11px] text-fg-muted">--{cor}</span>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Botões">
        <Botao carregando={carregando} onClick={simularCarregando}>
          Anotar gasto
        </Botao>
        <Botao carregando>Salvar</Botao>
        <Botao disabled>Desativado</Botao>
        <div className="grid grid-cols-2 gap-3">
          <Botao variante="secundario">Cancelar</Botao>
          <Botao variante="secundario" disabled>
            Desativado
          </Botao>
        </div>
        <Botao variante="perigo">Apagar gasto</Botao>
        <div>
          <Botao variante="fantasma">Ver lista</Botao>
        </div>
      </Secao>

      <Secao titulo="Valor (contador)">
        <Cartao className="flex flex-col items-center gap-4">
          <span className="rotulo text-[10px] text-fg-muted">Ainda posso gastar</span>
          <Valor
            key={chaveContagem}
            valor={valor}
            contarAoMontar
            className={`font-display text-[40px] tracking-[-0.01em] ${valor < 0 ? 'text-danger' : ''}`}
          />
          <div className="grid w-full grid-cols-3 gap-2">
            <Botao variante="secundario" onClick={() => setValor((v) => v - 3500)}>
              − 35
            </Botao>
            <Botao variante="secundario" onClick={() => setValor((v) => v + 1234)}>
              + 12,34
            </Botao>
            <Botao variante="secundario" onClick={() => setChaveContagem((k) => k + 1)}>
              Contar
            </Botao>
          </div>
          <Botao variante="fantasma" onClick={() => setValor(-8791)}>
            Ver valor negativo
          </Botao>
        </Cartao>
        <p className="text-amount font-mono font-medium">
          <Valor valor={valor} /> <span className="text-small text-fg-muted">(Geist Mono)</span>
        </p>
      </Secao>

      <Secao titulo="Cartão">
        <Cartao className="flex flex-col gap-1">
          <span className="rotulo text-[10px] text-fg-muted">Reserva</span>
          <span className="text-amount font-mono font-medium text-ok">R$ 51,92</span>
          <span className="text-small text-fg-muted">Guarde assim que o salário cair.</span>
        </Cartao>
        <p className="text-small text-fg-faint">Passe o mouse ou toque no cartão para ver o brilho.</p>
      </Secao>

      <Secao titulo="Etiquetas">
        <div className="flex gap-2">
          <Etiqueta estado="ok" />
          <Etiqueta estado="atencao" />
          <Etiqueta estado="estourou" />
        </div>
      </Secao>

      <Secao titulo="Campos">
        <Campo rotulo="Valor" inputMode="decimal" placeholder="0,00" />
        <Campo rotulo="Descrição" placeholder="Opcional" dica="Ex.: pizza com a família" />
        <Campo rotulo="Renda" defaultValue="0" erro="Digite um valor maior que zero." />
      </Secao>

      <Secao titulo="Aviso">
        <div className="grid grid-cols-2 gap-3">
          <Botao variante="secundario" onClick={() => mostrarAviso('ok')}>
            Aviso ok
          </Botao>
          <Botao variante="secundario" onClick={() => mostrarAviso('atencao')}>
            Aviso atenção
          </Botao>
        </div>
      </Secao>

      <p className="text-small text-fg-faint">
        Medidor, anel de fôlego, barra de abas, seletor de mês e painel de gasto entram aqui no restante da Etapa 3.
      </p>

      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />
    </main>
  )
}
