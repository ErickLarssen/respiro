# 08 — Design: "Painel de Fôlego"

Direção visual do Respiro. Este documento define **como** o app se parece e se move. **O que** cada tela mostra continua em `05-telas-e-fluxos.md`. Em caso de conflito sobre conteúdo, vale o `05`; sobre aparência, vale este.

---

## 1. Conceito

O Respiro é um **painel de instrumentos do seu dinheiro**: a precisão de um cockpit, com a calma de quem respira fundo. Três ideias guiam todas as decisões:

1. **Instrumento, não planilha.** Números grandes e nítidos, medidores segmentados, rótulos técnicos em caixa alta. Cada tela é lida em 2 segundos.
2. **Vidro sobre grafite.** Fundo escuro com leve tom azulado, superfícies translúcidas e bordas finas como fio de luz. Nada de cinza neutro e "morto".
3. **Um único momento de ousadia: o anel que respira.** O medidor da tela Início pulsa devagar, no ritmo de uma respiração. Todo o resto é contido e preciso. O luxo está no acabamento, não no excesso.

**Tema escuro é o principal.** O tema claro existe (segue o sistema), com o mesmo cuidado, mas o app foi desenhado primeiro no escuro.

---

## 2. Referências e o que foi aproveitado de cada uma

| Referência | O que levamos |
|---|---|
| **Linear** (site e app) | Bordas translúcidas de 6% a 10% de opacidade em vez de cinza sólido; fundo quase preto, nunca `#000`; spotlight que segue o cursor nos cartões; easing `cubic-bezier(0.16, 1, 0.3, 1)`; rótulos pequenos em caixa alta com espaçamento largo |
| **iOS 26 / Liquid Glass** (Apple) | Barra de abas **flutuante**, em forma de pílula, separada da borda da tela; encolhe ao rolar para baixo e volta ao rolar para cima; botão de ação circular separado ao lado |
| **Vercel / Geist** | Tipografia de texto e números (Geist e Geist Mono); densidade e alinhamento rigorosos |
| **Componentes "border beam"** (Aceternity, 21st.dev) | Feixe de luz que percorre a borda do botão principal |
| **HUDs de carros e aviões** | Medidores segmentados em vez de barras lisas; números com largura fixa por dígito |

O que **não** levamos: gradiente roxo-azul, glassmorphism em tudo, neon saturado, emojis como ícones, animação em cada elemento.

---

## 3. Tipografia

### Faces

| Papel | Fonte | Por quê |
|---|---|---|
| **Display** (títulos, rótulos, número principal) | **Michroma** (Vernon Adams, Google Fonts, licença OFL) | Desenhada na linha do Microgramma/Eurostile Extended: larga, quadrada e técnica. Gratuita |
| **Texto** (frases, descrições, botões) | **Geist** (variável, 300 a 700) | Muito legível em tela pequena; combina com a geometria da Michroma sem competir |
| **Números em listas e tabelas** | **Geist Mono** (400 a 600) | Dígitos de mesma largura: valores alinham em coluna |

> **Eurostile Extended original:** é uma fonte comercial (Linotype/Monotype). Se você tiver a licença para web, coloque os arquivos `.woff2` em `public/fonts/` e troque só o token `--font-display`. Sem licença, use a Michroma. **Não** baixe Eurostile de sites de "fontes grátis".

### Instalação (funciona offline, importante para o PWA)

Use os pacotes do Fontsource em vez do link do Google Fonts, para as fontes entrarem no cache do service worker:

```bash
npm i @fontsource/michroma @fontsource-variable/geist @fontsource-variable/geist-mono
```

```ts
// src/main.tsx
import "@fontsource/michroma";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
```

Confirme os nomes dos pacotes no npm na hora de instalar.

### Regras de uso da Michroma

A Michroma tem **um único peso** e é muito larga. Ela é o tempero, não o prato:

- **Use em:** número principal da tela Início, títulos de tela, rótulos de seção, valor digitado no painel de gasto, nome do app.
- **Nunca use em:** frases, descrições, listas, botões com mais de duas palavras.
- **Rótulos:** caixa alta, 10 a 11px, `letter-spacing: 0.14em`.
- **Títulos:** caixa alta ou normal, 18 a 22px, `letter-spacing: 0.02em`.
- **Número principal:** 36 a 44px, `letter-spacing: -0.01em`. Cada dígito fica numa "caixa" de largura fixa (ver contador na seção 7.6) para não tremer quando o valor muda.
- **Tamanho mínimo:** 10px. Abaixo disso, ela fica ilegível.

### Escala

| Token | Tamanho / altura de linha | Fonte | Uso |
|---|---|---|---|
| `--t-hero` | 44px / 1 | Michroma | "Quanto ainda posso gastar" |
| `--t-title` | 20px / 1.2 | Michroma | Título da tela |
| `--t-amount` | 22px / 1.2 | Geist Mono 500 | Valores em destaque nos cartões |
| `--t-body` | 15px / 1.5 | Geist 400 | Frases e descrições |
| `--t-small` | 13px / 1.4 | Geist 400 | Informações secundárias |
| `--t-label` | 10.5px / 1 | Michroma | Rótulos em caixa alta |
| `--t-num` | 14px / 1.2 | Geist Mono 400 | Valores em listas |

---

## 4. Cor

Todas as cores são variáveis CSS em `src/index.css`, ligadas ao Tailwind v4 com `@theme`. **Nenhum componente usa cor literal.**

### Tema escuro (principal)

| Token | Valor | Uso |
|---|---|---|
| `--bg-0` | `#06080C` | Fundo da página |
| `--bg-1` | `#0B0F16` | Cartões |
| `--bg-2` | `#121824` | Elementos elevados, campos |
| `--glass` | `rgb(14 19 28 / 0.72)` | Barra de abas, painel, avisos (com blur) |
| `--line` | `rgb(170 195 255 / 0.08)` | Bordas padrão |
| `--line-strong` | `rgb(170 195 255 / 0.16)` | Bordas em hover, foco, vidro |
| `--fg` | `#E9EEF6` | Texto principal |
| `--fg-muted` | `#8E98AA` | Texto secundário |
| `--fg-faint` | `#5B6578` | Rótulos, desativado |
| `--accent` | `#6EE7F9` | **Oxigênio**: cor do app, ação principal, anel |
| `--accent-deep` | `#0EA5C6` | Base de gradientes do botão principal |
| `--accent-glow` | `rgb(110 231 249 / 0.28)` | Brilhos e sombras de luz |
| `--on-accent` | `#04141A` | Texto sobre o botão principal |

### Tema claro

| Token | Valor |
|---|---|
| `--bg-0` | `#EEF2F7` |
| `--bg-1` | `#FFFFFF` |
| `--bg-2` | `#F6F8FB` |
| `--glass` | `rgb(255 255 255 / 0.72)` |
| `--line` | `rgb(20 40 80 / 0.08)` |
| `--line-strong` | `rgb(20 40 80 / 0.16)` |
| `--fg` | `#0B1220` |
| `--fg-muted` | `#556075` |
| `--fg-faint` | `#8A94A6` |
| `--accent` | `#0E7490` |
| `--accent-deep` | `#155E75` |
| `--accent-glow` | `rgb(14 116 144 / 0.20)` |
| `--on-accent` | `#FFFFFF` |

### Cores de estado (separadas da cor do app)

| Estado | Escuro | Claro | Uso |
|---|---|---|---|
| `--ok` | `#3DDC97` | `#0B714E` | Categoria abaixo de 80%; reserva |
| `--warn` | `#F5B54A` | `#875A17` | Atenção (80% a 100%) |
| `--danger` | `#FF5C7A` | `#B82644` | Estourou; déficit |

As cores do tema claro foram escurecidas (mesmo tom) depois da medição de contraste. As originais, `#0F9F6E`, `#B7791F` e `#D92D50`, ficavam entre 2,7 e 3,6 sobre o fundo tingido das etiquetas. As novas passam de 4,6 sobre `--bg-1`, `--bg-2` e o fundo da etiqueta (a cor a 14%). No tema escuro, todas já passavam.

### Cores das categorias (`c1` a `c5`)

| Token | Escuro | Claro | Sugestão |
|---|---|---|---|
| `--c1` | `#5EEAD4` | `#0D9488` | Higiene |
| `--c2` | `#FF9F6E` | `#C2410C` | Churrasco (brasa) |
| `--c3` | `#B69CFF` | `#6D28D9` | Lazer |
| `--c4` | `#F2D16B` | `#A16207` | Roupas |
| `--c5` | `#7CC4FF` | `#1D6FD8` | Livre |

### Estrutura no CSS (obrigatória)

```css
/* src/index.css */
@import "tailwindcss";

:root {
  /* valores do tema CLARO aqui (todos os tokens) */
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    /* valores do tema ESCURO (só redefine tokens) */
    color-scheme: dark;
  }
}

@theme inline {
  --color-bg-0: var(--bg-0);
  --color-bg-1: var(--bg-1);
  --color-fg: var(--fg);
  --color-accent: var(--accent);
  /* ...um para cada token, para usar como bg-bg-1, text-fg, border-line... */
  --font-display: "Michroma", "Eurostile Extended", "Arial Black", sans-serif;
  --font-sans: "Geist Variable", system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
}

body { background: var(--bg-0); color: var(--fg); }
```

Também defina `<meta name="theme-color">` para os dois temas, para a barra do sistema combinar com o app:

```html
<meta name="theme-color" content="#06080C" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#EEF2F7" media="(prefers-color-scheme: light)">
```

---

## 5. Espaço, forma e profundidade

- **Grade de 4px.** Espaços permitidos: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- **Margem lateral da tela:** 16px (20px a partir de 400px de largura).
- **Raios:** `--r-sm: 10px` (campos, etiquetas), `--r-md: 16px` (cartões), `--r-lg: 24px` (painel), `--r-pill: 999px` (barra de abas, botões, seletor de mês).
- **Bordas:** sempre `1px solid var(--line)`. Elementos de vidro usam `--line-strong` e um **brilho superior** (`inset 0 1px 0 rgb(255 255 255 / 0.06)`), que imita a luz batendo na borda.
- **Sombras (escuro):** sombra quase não aparece em fundo escuro; a profundidade vem da borda e do brilho. Só elementos flutuantes têm sombra: `0 16px 48px -12px rgb(0 0 0 / 0.6)`.
- **Cartão não é padrão para tudo.** Use cartão só para o que é um objeto separado (cada medidor, o painel do plano). Listas de gastos usam linhas com divisória, sem cartão.

### Fundo da página (atmosfera)

Três camadas, em `body::before` (fixas, `pointer-events: none`):

1. **Brilho no topo:** `radial-gradient(600px 400px at 50% -10%, var(--accent-glow), transparent 70%)`, com opacidade 0.6.
2. **Grade técnica:** linhas de 1px a cada 48px na cor `--line`, com `mask-image: radial-gradient(ellipse at top, #000 20%, transparent 70%)`, para sumir em direção ao fundo.
3. **Ruído:** SVG `feTurbulence` em data URI, opacidade 0.025. Tira o aspecto "digital chapado" do gradiente.

No tema claro, reduza o brilho para 0.35 e a grade para metade da opacidade.

### Luz que segue o mouse (só com mouse)

Sugestão do usuário, aprovada na revisão da vitrine. Com mouse (`(hover: hover) and (pointer: fine)`), uma segunda luz ciano segue o cursor e revela a grade num raio de 280px em volta dele (brilho com raio de 360px). Enquanto ela está acesa, o brilho do topo cai pela metade: a luz "migra" para o cursor.

- O hook `src/ui/useLuzDoCursor.ts` escreve a posição em `--luz-x`/`--luz-y` (no máximo uma vez por quadro) e liga `--luz-forca` (0 a 1). As três são registradas com `@property` para poderem ser animadas.
- A luz acende em 500ms e acompanha o cursor com 300ms de atraso suave (`--ease-out`). Ao sair da janela, apaga.
- **Celular:** o efeito não liga. Fica só a luz fixa do topo.
- **Movimento reduzido:** a luz acompanha o cursor sem atraso e acende e apaga num fade de 120ms.
- **Exceção consciente à seção 6:** mover um gradiente repinta o fundo. É aceitável porque só acontece no computador; no celular, onde os 60fps importam, o efeito fica desligado.

---

## 6. Movimento

### Tokens

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* padrão: entradas e transições */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--d-1: 120ms;  /* toque, press */
--d-2: 200ms;  /* hover, troca de cor */
--d-3: 320ms;  /* troca de tela, abertura */
--d-4: 600ms;  /* números contando, entrada de medidores */
```

Para animações com física (painel, barra de abas), use a biblioteca **Motion** (`npm i motion`, import de `motion/react`):

```ts
// src/ui/movimento.ts
export const molaFirme = { type: "spring", stiffness: 520, damping: 40 } as const;  // indicador da aba, botões
export const molaSuave = { type: "spring", stiffness: 300, damping: 32 } as const;  // painel, cartões
```

### Regras

- **Anime só `transform` e `opacity`** (e cores). Nunca anime `width`, `height`, `top` ou `filter: blur` em loop.
- Sem bounce exagerado: o overshoot máximo é o natural da mola acima.
- Entrada de tela: conteúdo sobe 8px e aparece em 320ms; itens de lista em cascata de 40ms (máximo de 8 itens animados).
- **Movimento reduzido** (`prefers-reduced-motion: reduce`): desligue o feixe girando, a respiração do anel, a cascata e a contagem dos números (mostre o valor final). Troque molas por um fade de 120ms. Use o hook `useReducedMotion()` do Motion.

---

## 7. Componentes

Todos ficam em `src/components/ui/`, são independentes das regras de negócio e aparecem na **vitrine** (seção 9).

### 7.1 Barra de abas flutuante (`BarraDeAbas.tsx`)

A peça mais visível do app.

**Forma:**
- Pílula fixa embaixo, **solta das bordas**: `bottom: calc(12px + env(safe-area-inset-bottom))`, `left: 16px`, e à direita deixa espaço para o botão "+".
- Altura de 64px, `border-radius: var(--r-pill)`.
- Vidro: `background: var(--glass)`, `backdrop-filter: blur(24px) saturate(160%)` (com `-webkit-`), borda `--line-strong`, brilho superior e sombra flutuante.
- **Botão "+" separado**, à direita: círculo de 64px com o estilo do botão principal (7.2) e o feixe de luz. Abre o painel de gasto. Fica visível em Início e Gastos; nas outras abas, se recolhe com escala 0.6 e opacidade 0.

**Abas:** quatro, cada uma com ícone (Lucide, traço 1.75, 22px) e rótulo em **Geist 600 10.5px** caixa alta (`letter-spacing: 0.06em`). A primeira versão usava Michroma 9.5px, mas, medido a 360px, cada aba tem 56px e "AJUSTES" em Michroma ocupa 68px; em Geist, 51px. Isso também respeita o tamanho mínimo da Michroma (10px). Aba ativa: ícone e rótulo em `--fg`; inativas em `--fg-faint`.

**Indicador ativo ("lente"):** uma pílula interna de vidro mais claro (`rgb(255 255 255 / 0.06)`, borda `--line-strong`) atrás da aba ativa. Ao trocar de aba, ela **desliza** até a nova posição com `layoutId="lente"` e `molaFirme`. Um ponto de 4px na cor `--accent`, com brilho, fica embaixo do ícone ativo.

**Ao rolar:** rolando para baixo mais de 24px, a barra encolhe para 52px e os rótulos somem (opacidade 0, 200ms), ficando só os ícones. Rolando para cima, volta. Use `useScroll` do Motion e um limiar para não piscar.

**Toque:** `scale: 0.94` no press da aba (120ms) e vibração curta (`navigator.vibrate?.(8)`, só funciona no Android).

**Fallback:** se `backdrop-filter` não for suportado (`@supports not (backdrop-filter: blur(1px))`), use `--bg-2` sólido.

Esqueleto:

```tsx
<nav className="fixed left-4 right-[92px] bottom-[calc(12px+env(safe-area-inset-bottom))] h-16 rounded-full vidro flex">
  {abas.map((aba) => (
    <NavLink key={aba.to} to={aba.to} className="relative flex-1 grid place-items-center">
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="lente" transition={molaFirme} className="absolute inset-1.5 rounded-full lente" />}
          <aba.Icone className="relative" />
          <span className="relative rotulo">{aba.rotulo}</span>
        </>
      )}
    </NavLink>
  ))}
</nav>
```

### 7.2 Botões (`Botao.tsx`)

Três variantes. Todas têm altura mínima de 48px, `border-radius: var(--r-pill)`, texto Geist 600 15px, e `scale: 0.97` no press (120ms).

**Primário ("Anotar gasto", "Salvar", botão "+")**
- Fundo: `linear-gradient(180deg, var(--accent), var(--accent-deep))`, texto `var(--on-accent)` (escuro sobre o ciano no tema escuro, branco sobre o petróleo no claro; contraste AA nos dois).
- Brilho interno: `inset 0 1px 0 rgb(255 255 255 / 0.45)` e sombra de luz `0 8px 24px -8px var(--accent-glow)`.
- **Feixe de luz na borda:** um ponto de luz percorre a borda continuamente, a cada 4s.
- **Hover (só mouse):** uma faixa de brilho diagonal atravessa o botão em 700ms e a sombra de luz aumenta.
- **Carregando:** o texto vira três pontos pulsando; o feixe acelera para 1.2s.

```css
@property --angulo { syntax: "<angle>"; initial-value: 0deg; inherits: false; }

.btn-primario { position: relative; isolation: isolate; overflow: hidden; }

/* feixe na borda */
.btn-primario::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px;
  background: conic-gradient(from var(--angulo), transparent 0 75%, #fff 85%, transparent 95%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: girar 4s linear infinite; pointer-events: none;
}
@keyframes girar { to { --angulo: 360deg; } }

/* faixa de brilho no hover */
.btn-primario::after {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(110deg, transparent 35%, rgb(255 255 255 / 0.35) 50%, transparent 65%);
  transform: translateX(-120%);
}
@media (hover: hover) and (pointer: fine) {
  .btn-primario:hover::after { transform: translateX(120%); transition: transform 700ms var(--ease-out); }
}
@media (prefers-reduced-motion: reduce) {
  .btn-primario::before { animation: none; }
}
```

**Secundário ("Cancelar", "Exportar backup")**
- Fundo `--bg-2`, borda `--line-strong`, texto `--fg`.
- **Hover com spotlight:** a borda acende onde o cursor está (técnica da 7.3, aplicada só à borda com máscara).

**Fantasma (ações de texto, "Ver lista")**
- Sem fundo; texto `--accent`; no hover, sublinhado que cresce da esquerda (`scaleX` de 0 a 1, 200ms).

**Perigo ("Apagar gasto")**: como o secundário, com texto e borda em `--danger`.

### 7.3 Cartão com spotlight (`Cartao.tsx`)

- Fundo `--bg-1`, borda `--line`, raio `--r-md`, padding 16px.
- **Mouse:** um brilho radial de 260px acompanha o cursor por dentro do cartão, e a borda vai para `--line-strong`.
- **Toque (celular):** no `pointerdown`, o brilho aparece **no ponto tocado** e some em 400ms. É o equivalente do hover no celular.

```ts
// src/ui/useSpotlight.ts
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const onPointerMove = (e: React.PointerEvent<T>) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return { ref, onPointerMove, onPointerDown: onPointerMove };
}
```

```css
.cartao { position: relative; }
.cartao::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgb(110 231 249 / 0.10), transparent 60%);
  opacity: 0; transition: opacity var(--d-3) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) { .cartao:hover::before { opacity: 1; } }
.cartao:active::before { opacity: 1; transition-duration: var(--d-1); }
```

Use a cor do brilho a partir do token (`color-mix(in oklch, var(--accent) 12%, transparent)`) para funcionar nos dois temas.

### 7.4 Anel de fôlego (`AnelFolego.tsx`), o momento principal

Fica no topo da tela Início e responde "quanto ainda posso gastar".

- SVG de 248px, traço de 12px, ponta arredondada.
- **Trilho:** círculo completo em `--line`, com 60 marcações finas (como um mostrador de relógio) em `--fg-faint` a 30% de opacidade.
- **Arco:** proporção `restante / tetoTotal`, começando no topo, em sentido horário. Traço com gradiente de `--accent` a `--ok`. A ponta do arco tem um ponto brilhante (círculo de 6px com `filter: drop-shadow` na cor do arco).
- **Cor por estado:** acima de 20% restante, gradiente oxigênio; entre 0% e 20%, `--warn`; negativo, o arco vira um anel completo em `--danger` e o número fica vermelho.
- **Centro:** rótulo "AINDA POSSO GASTAR" (Michroma 10px), o valor (Michroma, contador da 7.6) e, embaixo, "DE R$ 412,09" (o teto total) em Geist Mono 12px `--fg-muted`.
  - **Tamanho do valor:** até 40px, mas diminui para caber nos ~188px do miolo do anel, porque cada dígito da Michroma ocupa ~0,95em. "R$ 377,09" fica com ~31px; "R$ 1.606,00", com ~26px (`tamanhoDoNumero` em `AnelFolego.tsx`).
  - **Valor por dia:** a frase completa do `05` ("Cerca de R$ 17,95 por dia até 31/out (21 dias)") fica logo **abaixo** do anel, em vez da versão curta dentro dele. Em conteúdo vale o `05`, e a frase inteira não cabe no miolo.
- **Respiração:** o brilho atrás do anel (um `radial-gradient` em `--accent-glow`) e o próprio anel fazem um ciclo lento de 10s: **inspira em 4s** (escala 1 → 1.015, brilho 0.35 → 0.7) e **expira em 6s**. Só `transform` e `opacity`. Desligado com movimento reduzido.
- **Entrada:** o arco se desenha de 0 até o valor em 900ms (`stroke-dashoffset`, `--ease-out`) enquanto o número conta.
- **Acessibilidade:** o SVG tem `role="img"` e `aria-label="Ainda pode gastar R$ 377,09 de R$ 412,09"`.

### 7.5 Medidor segmentado (`MedidorCategoria.tsx`)

Substitui a barra de progresso lisa. Lembra um painel de instrumentos.

- **20 segmentos** de 6px de altura, raio de 2px e espaço de 2px entre eles, ocupando toda a largura.
- Segmentos cheios na cor da categoria; vazios em `--line`. O **último segmento cheio brilha** (`box-shadow: 0 0 8px` na cor).
- Em **atenção**, os segmentos cheios ficam `--warn`. Ao **estourar**, todos ficam `--danger` e a linha de cima ganha uma etiqueta "ESTOUROU" piscando uma única vez.
- Acima dos segmentos: nome da categoria (Geist 500 15px) à esquerda; à direita, `R$ 35,00 / 80,00` em Geist Mono (o gasto em `--fg`, o teto em `--fg-faint`).
- Abaixo: "Restam R$ 45,00" em `--fg-muted` 13px e a etiqueta de estado (pílula 10px Michroma: OK, ATENÇÃO, ESTOUROU, com fundo da cor do estado a 14%).
- **Entrada:** os segmentos acendem em sequência, 18ms cada.
- **Ao anotar um gasto:** os segmentos novos acendem com um pulso curto (escala 1 → 1.4 → 1 em 240ms).
- `role="meter"` com `aria-valuenow`, `aria-valuemax` e `aria-valuetext`.

### 7.6 Contador de valor (`Valor.tsx`)

Usado no número do anel, no total do mês e na reserva.

- Quando o valor muda, os dígitos **rolam** até o novo valor (estilo odômetro), 600ms, `--ease-out`.
- Cada dígito fica numa caixa de largura fixa (`width: 1ch`, centralizado), porque os dígitos da Michroma não têm todos a mesma largura. `1ch` é a largura do "0" na fonte atual: 0,95em na Michroma e 0,6em na Geist Mono. O valor antigo, `0.78em`, cortava a lateral dos dígitos da Michroma. A caixa corta só na vertical (`overflow-y: clip`), onde a coluna rola. Vírgula, ponto e "R$" ficam fora das caixas.
- "R$" menor (50% do tamanho) e em `--fg-muted`, alinhado ao topo dos dígitos.
- Movimento reduzido: troca direta, sem rolagem.

### 7.7 Painel "Anotar gasto" (`FolhaNovoGasto.tsx`)

- Sobe de baixo com `molaSuave`; o fundo escurece (`rgb(0 0 0 / 0.5)`) e desfoca 8px.
- Vidro (`--glass` + blur), raio `--r-lg` só nos cantos de cima, alça de 36×4px no topo.
- **Arrastar para fechar:** `drag="y"`; fecha se arrastar mais de 120px ou soltar com velocidade acima de 600.
- **Valor:** enorme, Michroma 44px centralizado, com cursor piscando na cor `--accent`. O campo real (`inputMode="decimal"`) fica por cima, transparente, para usar o teclado do celular.
- **Categorias:** pílulas grandes (48px), cada uma com um ponto na cor da categoria. Selecionada: fundo da cor a 16%, borda da cor e a "lente" deslizando entre elas (`layoutId`).
- **Forma de pagamento:** controle segmentado com as quatro opções e a mesma lente deslizante.
- **Salvar:** botão primário largo. Ao salvar, o painel desce, o aviso (7.8) aparece e o medidor da categoria pulsa na tela Início.

### 7.8 Aviso (`Aviso.tsx`)

- Pílula de vidro **flutuando no topo**: `top: calc(12px + env(safe-area-inset-top))`, centralizada, largura máxima de 360px.
- Ícone à esquerda na cor do estado (check em `--ok`, alerta em `--warn`), texto Geist 14px.
- Entra descendo 16px com `molaFirme`; some sozinho em 2.6s; arrastar para cima fecha.
- `role="status"` e `aria-live="polite"`.

### 7.9 Seletor de mês (`SeletorDeMes.tsx`)

- Pílula de vidro no topo da tela, com setas ‹ › nas pontas e o mês no meio em Michroma 12px caixa alta ("OUT 2026").
- Ao trocar, o texto sai para um lado e o novo entra pelo outro (deslocamento de 12px e fade, 200ms).
- Deslizar o dedo para os lados no conteúdo da tela também troca o mês.
- Se não for o mês atual, aparece à direita um ponto `--accent` e o botão "HOJE" para voltar.

### 7.10 Etiquetas, campos e listas

- **Etiqueta de estado:** pílula de 20px de altura, Michroma 9.5px, fundo da cor a 14%, texto na cor.
- **Campo de texto:** fundo `--bg-2`, borda `--line`, raio `--r-sm`, 48px de altura. No foco: borda `--accent` e anel de 3px em `--accent-glow`. Rótulo acima em Michroma 10px.
- **Linha de gasto:** ponto da categoria (8px), descrição (Geist 15px) e categoria + forma (13px `--fg-muted`) à esquerda; valor em Geist Mono à direita. Divisória `--line` entre linhas. No toque, o fundo vai a `--bg-2` por 120ms.
- **Cabeçalho do dia:** "DOM · 11 OUT" em Michroma 10px `--fg-faint`, fixo no topo durante a rolagem (`position: sticky` com `top: env(safe-area-inset-top)`).

### 7.11 Gráfico da projeção (tela Plano)

- 12 barras verticais finas (raio de 4px no topo), uma por mês, em `--accent` a 70%; o mês atual em `--accent` cheio e com brilho.
- Os meses em que uma parcela acaba têm um pequeno marcador acima da barra (losango de 6px em `--ok`), porque é ali que a reserva sobe.
- Grade horizontal muito leve (`--line`), só três linhas, com valores em Geist Mono 10px `--fg-faint`.
- Tocar numa barra mostra uma dica de vidro com "jun/27 · R$ 775,92 · acumulado R$ 3.462,28".
- Entrada: as barras crescem de baixo, em cascata de 30ms.

### 7.12 Carregamento e estados vazios

- **Esqueleto:** blocos `--bg-2` com uma faixa de brilho passando a cada 1.6s (desligada com movimento reduzido).
- **Vazio (nenhum gasto no mês):** ícone de linha fina em `--fg-faint`, frase "Nenhum gasto anotado em outubro." e o botão "Anotar gasto".

---

## 8. Acessibilidade e desempenho (não negociáveis)

- **Contraste AA** em todo texto: confira `--fg-muted` e `--fg-faint` sobre `--bg-1` nos dois temas. `--fg-faint` é só para rótulos e textos não essenciais.
- **Foco visível:** `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` em tudo que é clicável.
- **Áreas de toque** de no mínimo 44×44px.
- **Hover só para mouse:** todo efeito de hover fica dentro de `@media (hover: hover) and (pointer: fine)`. No celular, o retorno visual é o estado de press (`:active`).
- **Cor nunca sozinha:** o estado sempre tem também texto (OK, ATENÇÃO, ESTOUROU).
- **Blur com moderação:** `backdrop-filter` só na barra de abas, no painel, no seletor de mês, nos avisos e nas dicas. Nunca em cartões de lista.
- **60fps no celular:** teste num aparelho Android intermediário. Se a rolagem travar, a primeira coisa a cortar é o blur das telas inteiras.
- Respeite `prefers-reduced-motion` em todos os componentes (seção 6).

---

## 9. Vitrine (`/vitrine`)

Uma rota **só em desenvolvimento** (`import.meta.env.DEV`) que mostra todos os componentes da seção 7 em todos os estados: botões (normal, press, carregando, desativado), medidores (0%, 50%, 85%, 110%), anel (folga, aperto, negativo), aviso, painel aberto. Ela serve para revisar o visual antes de montar as telas, e para comparar os dois temas.

---

## 10. Onde isso entra no roadmap

Na **Etapa 3**, antes de qualquer tela, faça a subetapa **3.0 — Design system**:

- [x] Instalar `motion`, `lucide-react` e as fontes (seção 3)
- [x] Tokens de cor, tipografia, espaço e movimento em `src/index.css` e `src/ui/movimento.ts`
- [x] Fundo da página (seção 5)
- [x] Componentes de `src/components/ui/`: `Botao`, `Cartao`, `Valor`, `Etiqueta`, `Campo`, `Aviso`
- [x] Rota `/vitrine` mostrando tudo nos dois temas

**Pausa:** abra `/vitrine` no celular e no computador, nos dois temas. Revise cada componente antes de seguir.

Depois, nas telas da Etapa 3 e da Etapa 4, use os componentes `BarraDeAbas`, `AnelFolego`, `MedidorCategoria`, `FolhaNovoGasto`, `SeletorDeMes` e o gráfico da 7.11. Na **Etapa 5**, gere os ícones do PWA no mesmo estilo: o anel de fôlego em `--accent` sobre `--bg-0`, sem texto, com uma versão `maskable` com margem de segurança de 20%.
