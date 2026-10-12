# 06 — Convenções

## Código

- **Nomes do domínio em português** (`calcularPlano`, `Conta`, `ultimaParcela`), porque as regras de negócio estão em português e assim o código lê igual à documentação. Termos técnicos padrão continuam em inglês (`useLiveQuery`, `props`, `id`).
- Um componente por arquivo, `PascalCase.tsx`. Funções e variáveis em `camelCase`.
- Funções de `src/domain/` recebem tudo por parâmetro e não alteram os argumentos (sem mutação).
- Nada de número mágico solto: o limite de "atenção" vira `const LIMITE_ATENCAO = 80` (em %) em `resumo.ts`. Fica em % para a comparação usar só inteiros (`gasto * 100 >= teto * 80`), sem erro de arredondamento de `0.8`.
- Valores em centavos sempre com nome claro: `valor`, `renda`, `teto` são centavos. Nunca guardar `"R$ 35,00"` como dado.

## Testes

- Arquivo de teste ao lado, em `__tests__/`, com o mesmo nome: `plano.ts` → `__tests__/plano.test.ts`.
- Os casos de teste de `03-regras-de-negocio.md` entram **todos**, com os mesmos valores.
- Nome do teste descreve o comportamento: `it("manda os centavos do arredondamento para a reserva")`.

## Commits (Conventional Commits, em português)

```
tipo(escopo): descrição curta no imperativo
```

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidade nova |
| `fix` | Correção de bug |
| `test` | Só testes |
| `refactor` | Muda código sem mudar comportamento |
| `docs` | Documentação |
| `style` | Visual/CSS sem mudar lógica |
| `chore` | Configuração, dependências |

Exemplos: `feat(domain): calcula plano automático do mês`, `test(salario): cobre Carnaval de 2027`, `chore: configura PWA`.

## Textos da interface

- Português do Brasil, frases curtas, voz ativa, tratando o usuário por "você".
- Botões dizem exatamente o que fazem: "Anotar gasto", "Salvar", "Apagar gasto". Depois da ação, confirmar: "Gasto anotado".
- Dinheiro sempre no formato `R$ 1.606,00` (`Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`).
- Datas curtas: "qui, 15/out". Meses por extenso nos títulos: "outubro de 2026".
- Mensagens de erro dizem o que aconteceu e o que fazer: "Digite um valor maior que zero."

## Visual

- Mobile first, testado a 360px. Áreas de toque com pelo menos 44px.
- Tema claro e escuro seguindo o sistema (`prefers-color-scheme`), com cores definidas como variáveis CSS em `index.css`.
- Cores de estado (ok, atenção, estourou) separadas das cores das categorias.
- Números alinhados com `font-variant-numeric: tabular-nums`.
