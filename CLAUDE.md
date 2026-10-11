# CLAUDE.md — Respiro

Instruções para o Claude Code. Leia este arquivo inteiro antes de qualquer tarefa.

## O que é o projeto

**Respiro** é um app pessoal de controle financeiro, feito para ser usado no celular como PWA (ícone na tela inicial, funciona offline). O usuário informa a renda, as contas fixas e quanto gostaria de gastar em cada categoria. O app monta sozinho um **plano do mês**, com um teto por categoria e uma reserva, e mostra quanto ainda dá para gastar.

O dono do projeto é desenvolvedor em formação (nível básico/intermediário). Ele está construindo o app junto com você e quer **entender** o que está sendo feito, não só receber código pronto.

## Documentação (fonte da verdade)

| Arquivo | Conteúdo |
|---|---|
| `docs/01-visao-e-escopo.md` | Problema, usuário, o que entra e o que não entra no MVP |
| `docs/02-stack-e-arquitetura.md` | Stack, árvore de pastas, responsabilidades de cada camada |
| `docs/03-regras-de-negocio.md` | **O cérebro do app**: plano automático, contas ativas, dia do salário, com casos de teste |
| `docs/04-modelo-de-dados.md` | Tipos TypeScript e tabelas do IndexedDB |
| `docs/05-telas-e-fluxos.md` | O que cada tela mostra e faz |
| `docs/06-convencoes.md` | Código, commits, testes, textos da interface |
| `docs/07-roadmap.md` | Etapas com checklist e pausas de revisão |
| `docs/dados-iniciais.json` | Dados reais do usuário para o primeiro uso |

Se algo nesta conversa contradizer a documentação, **pergunte** antes de seguir. Se uma decisão nova for tomada, atualize o doc correspondente no mesmo commit.

## Regras de trabalho

1. **Uma etapa do roadmap por vez.** Ao terminar a checklist de uma etapa, pare e mostre o resumo descrito em "Ao final de cada etapa". Não comece a próxima sem o usuário pedir.
2. **Explique antes de fazer.** No início de cada etapa, diga em poucas linhas o que vai ser feito e por quê. Ao introduzir um conceito novo (IndexedDB, service worker, função pura, hook), explique em 2 ou 3 frases simples.
3. **Passos pequenos e verificáveis.** Depois de cada mudança relevante, rode `npm run typecheck`, `npm run lint` e `npm test`. Não avance com erro.
4. **Comandos que o usuário precisa rodar** (instalar algo, criar conta na Vercel, abrir no celular) vão em uma lista numerada, um comando por linha, dizendo o que esperar ver. Nunca assuma que ele sabe onde clicar.
5. **Commits pequenos**, no padrão de `docs/06-convencoes.md`. Sugira a mensagem; só faça o commit se o usuário pedir.
6. **Não invente regra de negócio.** Os cálculos de dinheiro estão especificados em `docs/03-regras-de-negocio.md`. Se faltar um caso, pergunte.

## Regras técnicas inegociáveis

- **Dinheiro sempre em centavos (inteiros).** `R$ 16,06` é `1606`. Nunca use `number` com casas decimais para valores. Converta para texto só na hora de exibir, com `formatarBRL()`.
- **Regras de negócio são funções puras** em `src/domain/`, sem React, sem banco, sem `Date.now()` escondido. A data de "hoje" entra como parâmetro. Toda função de `src/domain/` tem teste.
- **Meses como string `"AAAA-MM"`** (ex.: `"2026-10"`); datas como `"AAAA-MM-DD"`. Evite `new Date("2026-10-15")`, que é interpretado em UTC e pode cair no dia anterior no Brasil. Use os helpers de `src/domain/datas.ts`.
- **TypeScript strict.** Sem `any`. Sem `// @ts-ignore`.
- **Interface em português do Brasil**, frases curtas e diretas, como em `docs/06-convencoes.md`.
- **Mobile first**: tudo precisa funcionar bem a 360px de largura.

## Comandos

```bash
npm run dev        # servidor local (Vite)
npm test           # Vitest
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run build      # build de produção
npm run preview    # testa o build (inclusive o PWA)
```

## Ao final de cada etapa

Mostre ao usuário:
1. O que foi feito, em até 5 linhas.
2. Como testar manualmente (passo a passo).
3. O que ele deve revisar no código (2 ou 3 arquivos-chave) e por quê.
4. A mensagem de commit sugerida.
5. Marque os itens concluídos em `docs/07-roadmap.md`.
