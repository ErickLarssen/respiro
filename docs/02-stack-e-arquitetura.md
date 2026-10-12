# 02 — Stack e arquitetura

## Stack

| Peça | Escolha | Por quê |
|---|---|---|
| Build | **Vite** | Rápido, simples, plugin de PWA pronto |
| UI | **React** + **TypeScript** (strict) | Você já usou React; TypeScript pega erros de valor e de tipo antes de rodar |
| Estilo | **Tailwind CSS v4** | Já usado nos seus projetos; ótimo para mobile first |
| Rotas | **React Router** | Quatro telas com URL própria (`/`, `/gastos`, `/plano`, `/ajustes`) |
| Dados | **Dexie** (IndexedDB) + `dexie-react-hooks` | Banco de dados do próprio navegador; funciona offline; `useLiveQuery` atualiza a tela sozinho quando os dados mudam |
| Testes | **Vitest** | Mesma configuração do Vite; testa as regras de negócio |
| PWA | **vite-plugin-pwa** | Gera manifest e service worker (ícone na tela inicial e uso offline) |
| Deploy | **Vercel** | Grátis para projetos pessoais, HTTPS automático (obrigatório para PWA) |

Use as versões estáveis atuais no momento da instalação. Na etapa 0, registre no README as versões instaladas.

**Por que não um backend agora?** Os dados são de uma pessoa só e cabem no aparelho. Sem servidor não há senha para proteger, custo nem deploy de API. A etapa 6 adiciona nuvem se for necessário, e a separação de camadas abaixo foi pensada para isso: só a camada `data/` muda.

## Camadas

```
Telas (src/pages)  →  Hooks (src/hooks)  →  Domínio (src/domain)   ← funções puras, testadas
                                         →  Dados   (src/data)     ← Dexie / IndexedDB
```

- **`domain/`** não importa nada de React nem de Dexie. Recebe dados e devolve resultados. É aqui que mora o cálculo do plano.
- **`data/`** é a única pasta que fala com o banco. Se um dia trocarmos IndexedDB por uma API, só ela muda.
- **`hooks/`** juntam as duas coisas: leem os dados com `useLiveQuery` e passam para as funções do domínio.
- **`pages/`** e **`components/`** só exibem e capturam ações do usuário.

## Árvore de pastas

```
respiro/
├── CLAUDE.md
├── README.md
├── docs/                         ← esta documentação
├── public/
│   └── icons/                    ← ícones do PWA (192, 512 e maskable)
├── index.html
├── vite.config.ts                ← inclui VitePWA
├── tsconfig.json
├── eslint.config.js
├── package.json
└── src/
    ├── main.tsx                  ← monta o app e o roteador
    ├── App.tsx                   ← layout: conteúdo + barra de abas inferior
    ├── index.css                 ← Tailwind + tokens de cor (claro/escuro)
    ├── domain/                   ← REGRAS DE NEGÓCIO (puras, testadas)
    │   ├── tipos.ts              ← Config, Conta, Categoria, Gasto, Plano
    │   ├── dinheiro.ts           ← formatarBRL, lerValorDigitado
    │   ├── datas.ts              ← meses "AAAA-MM", soma de meses, dias no mês
    │   ├── feriados.ts           ← Páscoa, feriados nacionais, Carnaval
    │   ├── salario.ts            ← diaDoSalario (N-ésimo dia útil), proximoSalario
    │   ├── contas.ts             ← contaAtivaNoMes, totalContasFixas, parcelasRestantes, fimDasParcelas
    │   ├── credito.ts            ← gastoNoCredito, limiteLivre
    │   ├── plano.ts              ← calcularPlano (o coração do app), fraseEfeitoNaReserva
    │   ├── resumo.ts             ← gasto por categoria, quanto resta, valor por dia
    │   ├── projecao.ts           ← reserva mês a mês nos próximos 12 meses
    │   └── __tests__/            ← um arquivo .test.ts por arquivo acima
    ├── data/
    │   ├── db.ts                 ← schema Dexie
    │   ├── repositorio.ts        ← salvarConfig, adicionarGasto, apagarGasto...
    │   ├── backup.ts             ← exportar/importar JSON
    │   ├── dadosIniciais.ts      ← importa docs/dados-iniciais.json (sem copiar) para o primeiro uso
    │   ├── preferencias.ts       ← última forma de pagamento (localStorage)
    │   └── __tests__/            ← testes do repositório com fake-indexeddb
    ├── hooks/
    │   ├── useConfig.ts
    │   ├── useGastosDoMes.ts
    │   ├── usePlanoDoMes.ts
    │   ├── useCategorias.ts
    │   ├── useMesSelecionado.ts  ← mês aberto na tela, guardado na URL (?mes=AAAA-MM)
    │   ├── anotarGasto.ts        ← salva/edita o gasto e decide o aviso (banco + domínio)
    │   ├── useLayout.ts          ← o que o layout oferece às telas: abrir o painel, mostrar aviso
    │   └── useHoje.ts            ← único lugar que lê o relógio; o domínio recebe "hoje" por parâmetro
    ├── ui/                       ← apoio do design system (docs/08-design.md)
    │   ├── movimento.ts          ← molas do Motion (molaFirme, molaSuave)
    │   ├── useSpotlight.ts       ← brilho que segue o cursor/dedo
    │   ├── useLuzDoCursor.ts     ← luz do fundo que segue o mouse
    │   └── useDeslizarHorizontal.ts ← deslizar o dedo para trocar o mês
    ├── components/
    │   └── ui/                   ← componentes da seção 7 do 08-design.md
    │       ├── Botao.tsx, Cartao.tsx, Valor.tsx, Etiqueta.tsx, Campo.tsx
    │       ├── Aviso.tsx
    │       ├── BarraDeAbas.tsx
    │       ├── SeletorDeMes.tsx
    │       ├── AnelFolego.tsx    ← "quanto ainda posso gastar"
    │       ├── MedidorCategoria.tsx  ← medidor segmentado de um teto
    │       ├── Segmentado.tsx    ← opções lado a lado com a lente deslizante
    │       ├── GraficoProjecao.tsx ← barras da reserva nos próximos 12 meses
    │       └── FolhaNovoGasto.tsx    ← painel que sobe de baixo para anotar ou editar gasto
    └── pages/
        ├── PrimeiroUso.tsx       ← "Começar com meus dados" / "Começar do zero"
        ├── Vitrine.tsx           ← só em desenvolvimento (/vitrine)
        ├── Inicio.tsx
        ├── Gastos.tsx
        ├── Plano.tsx
        ├── Ajustes.tsx
        └── ajustes/              ← uma seção por arquivo: Renda, Contas, Categorias, Backup, Apagar tudo
```
