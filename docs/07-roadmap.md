# 07 — Roadmap

Uma etapa por vez. Ao fim de cada uma, o Claude Code **para** e mostra o resumo (ver `CLAUDE.md`). Revise, teste, faça o commit e só então peça a próxima.

---

## Etapa 0 — Fundação

**Objetivo:** projeto rodando, com qualidade configurada desde o primeiro commit.

- [x] `git init` e commit só da documentação (`docs: adiciona documentação inicial`), **antes** de gerar o projeto
- [x] Gerar o projeto Vite (template `react-ts`) nesta mesma pasta. Ela não está vazia: escolha a opção que mantém os arquivos existentes. Se o template sobrescrever o `README.md`, restaure com `git checkout -- README.md`
- [x] Ativar TypeScript strict
- [x] Instalar e configurar Tailwind CSS v4
- [x] Configurar ESLint
- [x] Instalar Vitest e criar um teste de exemplo que passa
- [x] Criar os scripts `test`, `typecheck` e `lint` no `package.json`
- [x] Criar a árvore de pastas de `02-stack-e-arquitetura.md` (pastas vazias com `.gitkeep`)
- [x] Completar o README com como rodar e as versões instaladas
- [x] Commit `chore: configura projeto vite com react, typescript, tailwind e vitest`

**Pausa:** rode `npm run dev` e abra no navegador. Rode `npm test`. Os dois funcionam?

---

## Etapa 1 — O cérebro (regras de negócio)

**Objetivo:** todo o cálculo do app pronto e testado, **sem nenhuma tela**.

- [x] `tipos.ts`
- [x] `dinheiro.ts`: `formatarBRL`, `lerValorDigitado` ("35,5" → 3550; texto inválido → `null`)
- [x] `datas.ts`: somar meses, dias no mês, mês de uma data
- [x] `feriados.ts` + testes (Páscoa 2026 e 2027, Carnaval 2027)
- [x] `salario.ts` + todos os casos de teste da seção 3
- [x] `contas.ts` + todos os casos de teste da seção 1
- [x] `plano.ts` + todos os casos da seção 2 + teste da propriedade "tudo soma a renda"
- [x] `resumo.ts` + caso de teste da seção 4
- [x] `projecao.ts` + caso de teste da seção 6

**Pausa:** rode `npm test`. Leia `plano.ts` com calma: é o coração do app. Peça ao Claude Code para explicar qualquer linha que não ficar clara.

---

## Etapa 2 — Dados no aparelho

- [x] `db.ts` com o schema Dexie
- [x] `repositorio.ts`: salvar config, CRUD de contas, categorias e gastos
- [x] `dadosIniciais.ts` a partir de `docs/dados-iniciais.json`
- [x] Hooks `useConfig`, `useGastosDoMes`, `usePlanoDoMes`
- [x] Tela de primeiro uso ("Começar com meus dados" / "Começar do zero")
- [x] Página provisória que mostra o plano de outubro em texto puro (para conferir: reserva R$ 51,92)

**Pausa:** abra o app, escolha "Começar com meus dados" e confira a reserva. Recarregue a página: os dados continuam lá? No navegador, abra DevTools → Application → IndexedDB e veja as tabelas.

---

## Etapa 3 — Início e anotar gasto

- [x] Layout com barra de abas inferior e rotas
- [x] Tokens de cor (claro e escuro) em `index.css`
- [x] `SeletorDeMes`
- [x] Tela Início completa (`05-telas-e-fluxos.md`)
- [x] `MedidorCategoria`
- [x] `FolhaNovoGasto` com todos os campos e o aviso depois de salvar

**Pausa:** no celular (pelo IP da sua rede com `npm run dev -- --host`), anote três gastos e veja os tetos mudarem.

---

## Etapa 4 — Gastos, Plano e Ajustes

- [x] Tela Gastos (lista por dia, total, total no crédito, editar e apagar)
- [x] Tela Plano (conta de cima para baixo, mensagens, gráfico de 12 meses, fim das parcelas)
- [x] Tela Ajustes (renda, contas, categorias, prévia do efeito na reserva)
- [x] Exportar e importar backup

**Pausa:** mude a renda para R$ 1.500 em Ajustes e confira na tela Plano: Churrasco R$ 119,97, Lazer R$ 53,32, Roupas R$ 34,71, reserva R$ 50,01. Volte para R$ 1.606.

---

## Etapa 5 — App no celular (PWA) e deploy

- [x] Ícones (192, 512, maskable) em `public/icons/`
- [x] `vite-plugin-pwa`: manifest (nome "Respiro", cores do tema, `display: "standalone"`) e service worker
- [x] Testar offline com `npm run build && npm run preview`
- [x] Subir para o GitHub
- [x] Deploy na Vercel (passo a passo para o usuário, tela por tela)
- [x] Instalar no celular: Chrome → menu ⋮ → "Adicionar à tela inicial"
- [ ] Exportar o primeiro backup

**Pausa:** use o app por uma semana antes de pensar na etapa 6.

---

## Etapa 5.1 — Plano de cada mês e colchão

Pedido depois da primeira semana de uso: os gastos variáveis mudam a cada mês, e faltava uma retenção "para não passar o mês duro". Regras em `03-regras-de-negocio.md`, seções 7 e 8.

- [x] `MesPlanejado` e `config.metaColchao` (`04-modelo-de-dados.md`)
- [x] `planejamento.ts`: o mês sem plano copia o último planejado + testes
- [x] `calcularPlano` com desejos do mês e colchão (antes da reserva mínima) + testes, inclusive a propriedade "tudo soma a renda"
- [x] `colchao.ts`: acumular, meta e uso automático do excesso + testes
- [x] Projeção com plano por mês e colchão
- [x] Banco versão 2 com migração automática + teste de migração
- [x] Backup versão 2 (aceita backups da versão 1)
- [x] Aba Plano: "Ajustar o plano do mês" com prévia na reserva
- [x] Início: cartão do colchão e aviso de excesso; Ajustes: meta do colchão e categorias sem valor mensal

**Pausa:** antes de publicar, **exporte um backup no celular** (com a versão atual do app). Depois do push, abra o app, confira que outubro continua igual, defina a meta do colchão e planeje novembro.

---

## Etapa 5.2 — Cartão de crédito com fatura

Pedido do usuário: dar protagonismo ao cartão (PicPay Card, fecha 12, vence 20, limite R$ 468). Regras em `03-regras-de-negocio.md`, seção 5, aprovadas antes do código (com as quatro decisões: fatura aberta reserva o orçamento, regra nova a partir de novembro, fatura paga no vencimento, contas no crédito continuam contas fixas).

- [x] `Config.cartao` (no lugar de `limiteCartao`), `Gasto.parcelas`, `Plano.fatura`
- [x] `credito.ts`: fatura de cada compra, parcelas, fatura no plano (real ou estimada), limite livre, aviso + todos os casos da seção 5.8
- [x] Fatura como conta fixa no `calcularPlano`, no colchão e na projeção
- [x] Resumo: crédito fora dos tetos, mostrado em `noCredito`
- [x] Banco versão 3 (limite → cartão) + teste da migração 1 → 2 → 3
- [x] Backup versão 3 (aceita as versões 1 e 2)
- [x] Ajustes: seção Cartão de crédito; painel de anotar: fatura, limite e parcelas; Início: cartão da fatura; Gastos: fatura e limite; Plano: linha da fatura

**Pausa:** exporte um backup antes de publicar. Depois, em Ajustes, cadastre o cartão (limite 468, fecha 12, vence 20, orçamento) e use o crédito normalmente por um ciclo de fatura.

---

## Etapa 6 — Nuvem (opcional)

Só se fizer falta usar em mais de um aparelho. Decidir antes de começar: **Supabase** (banco Postgres + login prontos) ou **backend próprio** (Node + Express + banco, como no Proadesk). Em ambos os casos só `src/data/` muda.
