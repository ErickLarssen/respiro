# Respiro

App pessoal de controle financeiro para o celular. Você informa a renda, as contas fixas e quanto gostaria de gastar em cada coisa; o Respiro monta o plano do mês com um teto por categoria e uma reserva, e mostra quanto ainda dá para gastar.

## Status

Em construção, por etapas. Veja [`docs/07-roadmap.md`](docs/07-roadmap.md).

## Como começar (com o Claude Code)

1. Abra esta pasta no VS Code.
2. No terminal integrado, rode `claude`.
3. Peça: **"Leia o CLAUDE.md e toda a pasta docs. Depois, comece a Etapa 0 do roadmap."**

## Como rodar

Pré-requisito: Node.js 24 ou mais novo.

```bash
npm install        # instala as dependências (só na primeira vez)
npm run dev        # abre o app em http://localhost:5173
npm test           # roda os testes (Vitest)
npm run typecheck  # confere os tipos (TypeScript)
npm run lint       # confere o estilo do código (ESLint)
npm run build      # gera a versão de produção em dist/
npm run preview    # serve a versão de produção localmente
```

Para abrir no celular na mesma rede Wi-Fi: `npm run dev -- --host` e acesse o endereço "Network" que aparecer.

## Versões instaladas

Registradas na Etapa 0 (outubro de 2026), com Node.js 24.18.0 e npm 11.16.0.

| Pacote | Versão |
|---|---|
| vite | 8.3.4 |
| react / react-dom | 19.3.0 |
| typescript | 6.0.3 |
| tailwindcss / @tailwindcss/vite | 4.3.3 |
| vitest | 5.0.3 |
| eslint | 10.12.0 |
| typescript-eslint | 8.71.1 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.7 |
| @vitejs/plugin-react | 6.1.2 |
| dexie | 4.4.6 |
| dexie-react-hooks | 4.4.0 |
| fake-indexeddb (só testes) | 6.2.5 |

## Documentação

- [Visão e escopo](docs/01-visao-e-escopo.md)
- [Stack e arquitetura](docs/02-stack-e-arquitetura.md)
- [Regras de negócio](docs/03-regras-de-negocio.md)
- [Modelo de dados](docs/04-modelo-de-dados.md)
- [Telas e fluxos](docs/05-telas-e-fluxos.md)
- [Convenções](docs/06-convencoes.md)
- [Roadmap](docs/07-roadmap.md)
- [Design](docs/08-design.md)
