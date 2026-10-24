# 03 — Regras de negócio

Este é o documento mais importante do projeto. Toda regra aqui vira uma função pura em `src/domain/` e cada caso de teste listado vira um teste no Vitest. **Todos os valores estão em centavos.**

---

## 1. Contas fixas ativas no mês

Uma conta é de um de dois tipos:

- **Recorrente**: entra em todos os meses (luz, internet, assinaturas, fatura do cartão).
- **Parcela**: tem um campo `ultimaParcela` no formato `"AAAA-MM"`. Entra em todo mês **até** `ultimaParcela`, inclusive, e some depois.

```ts
contaAtivaNoMes(conta, mes): boolean
totalContasFixas(contas, mes): number        // soma das ativas
parcelasRestantes(conta, mesAtual): number | null  // ultimaParcela - mesAtual + 1, mínimo 0; recorrente → null
ultimaParcelaPorRestantes(mesAtual, restantes): Mes // mesAtual + (restantes − 1)
fimDasParcelas(contas, mesAtual): { conta, ultimaParcela, liberaEm }[] // parcelas ativas, da que acaba primeiro
parcelasQueLiberamEm(contas, mes): Conta[]  // parcelas cuja última foi no mês anterior (a reserva sobe em `mes`)
```

`fimDasParcelas(contas, "2026-10")` → Facio e fatura PicPay (out/26), perfume (nov/26), notebook (mai/27, libera em jun/27), Shopee (jun/27). `parcelasQueLiberamEm(contas, "2027-06")` → notebook.

Na tela de Ajustes o usuário digita **"parcelas restantes"** (é como ele pensa). O app converte para `ultimaParcela = mesAtual + (restantes − 1)`. Isso evita ter que atualizar a conta todo mês.

**Casos de teste** (contas de `dados-iniciais.json`):

| Mês | Total de contas fixas | Observação |
|---|---|---|
| `2026-10` | 114199 | Todas ativas, inclusive a fatura de setembro do cartão |
| `2026-11` | 84499 | Acabaram o empréstimo Facio e a fatura de setembro (últimas: 2026-10) |
| `2026-12` | 81299 | Acabou o perfume (última: 2026-11) |
| `2027-05` | 81299 | Última parcela do notebook |
| `2027-06` | 41799 | Sem o notebook; última da Shopee |
| `2027-07` | 36999 | Só recorrentes |

`parcelasRestantes(notebook, "2026-10")` → `8`; `parcelasRestantes(facio, "2026-11")` → `0`.

---

## 2. Plano automático do mês (`calcularPlano`)

**Entrada:** renda, reserva mínima, contas, categorias (cada uma com `desejo` e `essencial: boolean`), o mês e, opcionalmente, `desejos` (os valores do plano do mês, seção 7, que têm prioridade sobre `categoria.desejo`) e `colchao` (quanto separar no colchão, já limitado pela meta, seção 8).
**Saída:** `{ contasFixas, sobra, tetos: Record<idCategoria, number>, colchao, reserva, situacao, mensagens[] }`.

### Ordem de prioridade

1. **Contas fixas** saem primeiro. `sobra = renda − contasFixas`.
2. **Essenciais** (ex.: higiene) recebem o valor desejado inteiro.
3. **Colchão** (seção 8): o dinheiro "para não passar o mês duro". Vem antes da reserva porque o objetivo principal é nunca ficar sem dinheiro durante o mês.
4. **Reserva mínima** é separada.
5. **Flexíveis** (churrasco, lazer, roupas) recebem o desejado, se couber.

### Algoritmo

```
disponivel = max(sobra, 0)

// Essenciais
se soma(essenciais) <= disponivel:
    cada essencial recebe seu desejo
senão:
    cada essencial recebe floor(desejo × disponivel / soma(essenciais))
disponivel -= soma(tetos essenciais)

// Colchão
colchao = min(colchaoDesejado, disponivel)
disponivel -= colchao

// Reserva mínima
reserva = min(reservaMinima, disponivel)
disponivel -= reserva

// Flexíveis
se soma(flexíveis) <= disponivel:
    cada flexível recebe seu desejo
    reserva += disponivel - soma(flexíveis)        // o que sobrar vira reserva
senão:
    cada flexível recebe floor(desejo × disponivel / soma(flexíveis))
    reserva += disponivel - soma(tetos flexíveis)  // centavos do arredondamento
```

- Use **divisão inteira com `Math.floor`** sobre centavos. Os centavos que sobrarem do arredondamento vão para a reserva, nunca se perdem.
- Garantia: `contasFixas + soma(tetos) + colchao + reserva === renda` sempre que `sobra >= 0`. **Escreva um teste para essa propriedade.**

### Situação e mensagens

| `situacao` | Quando | Mensagem para o usuário |
|---|---|---|
| `"folga"` | Os desejos couberam e sobrou além da reserva mínima | "Seus planos couberam. Os R$ X que sobraram vão para a reserva." |
| `"justo"` | Os desejos couberam exatamente, sem sobra além da mínima | "Seus planos couberam, com a reserva mínima de R$ X." |
| `"apertado"` | Os flexíveis foram reduzidos | "Para guardar R$ X, reduzi os gastos flexíveis em N%." X é a reserva **mínima**; N é o corte arredondado para o inteiro mais próximo (33,35% → 33%). Com colchão no mês: "Para separar R$ C no colchão e guardar R$ X, reduzi os gastos flexíveis em N%." |
| `"critico"` | Até os essenciais, o colchão ou a reserva mínima foram cortados | "Depois das contas fixas sobram só R$ X. Não dá para cobrir os essenciais e a reserva." Com colchão no mês: "...cobrir os essenciais, o colchão e a reserva." |
| `"deficit"` | `sobra < 0` | "As contas fixas passam da renda em R$ X." Todos os tetos e a reserva ficam 0. |

### Casos de teste

Com `dados-iniciais.json` (renda 160600, reserva mínima 5000; Higiene 10000 essencial; Churrasco 18000, Lazer 8000 e Roupas 5209 flexíveis):

| Mês | Renda | Contas fixas | Sobra | Tetos (Hig / Chur / Laz / Roup) | Reserva | Situação |
|---|---|---|---|---|---|---|
| `2026-10` | 160600 | 114199 | 46401 | 10000 / 18000 / 8000 / 5209 | **5192** | folga |
| `2026-11` | 160600 | 84499 | 76101 | 10000 / 18000 / 8000 / 5209 | **34892** | folga |
| `2026-12` | 160600 | 81299 | 79301 | 10000 / 18000 / 8000 / 5209 | **38092** | folga |
| `2027-06` | 160600 | 41799 | 118801 | 10000 / 18000 / 8000 / 5209 | **77592** | folga |
| `2027-07` | 160600 | 36999 | 123601 | 10000 / 18000 / 8000 / 5209 | **82392** | folga |
| `2026-10` | **150000** | 114199 | 35801 | 10000 / 11997 / 5332 / 3471 | **5001** | apertado |
| `2026-10` | **120000** | 114199 | 5801 | 5801 / 0 / 0 / 0 | **0** | critico |
| `2026-10` | **100000** | 114199 | −14199 | 0 / 0 / 0 / 0 | **0** | deficit |

No caso de renda 150000: sobram 20801 para flexíveis que desejam 31209. Churrasco = floor(18000 × 20801 / 31209) = 11997; Lazer = 5332; Roupas = 3471; soma 20800; 1 centavo vai para a reserva (5000 + 1 = 5001).

**Casos com colchão** (renda 160600):

| Mês | Colchão | Tetos (Hig / Chur / Laz / Roup) | Colchão separado | Reserva | Situação |
|---|---|---|---|---|---|
| `2026-11` | 5000 | 10000 / 18000 / 8000 / 5209 | 5000 | **29892** (34892 − 5000) | folga |
| `2026-10` | 3000 | 10000 / 16380 / 7280 / 4740 | 3000 | **5001** | apertado: "Para separar R$ 30,00 no colchão e guardar R$ 50,00, reduzi os gastos flexíveis em 9%." |
| `2026-10` (renda 126199) | 5000 | 10000 / 0 / 0 / 0 | **2000** | **0** | critico (o colchão vem antes da reserva) |

Com os desejos de novembro `{ higiene: 8000, churrasco: 0, lazer: 12000, roupas: 7990 }`, a reserva de novembro é **48111**.

---

## 2b. Valor digitado (`lerValorDigitado`)

Aceita reais inteiros e, opcionalmente, **vírgula ou ponto** seguido de 1 ou 2 dígitos de centavos: `"35"` → 3500, `"35,5"` e `"35.50"` → 3550. O ponto vale como decimal porque alguns teclados numéricos de celular não têm vírgula. **Separador de milhar não é aceito**: `"1.606,00"` → `null` (digite `"1606"`). Vazio, letras, sinal negativo ou `"R$"` → `null`. Zero é lido como `0`; quem recusa zero é a tela.

---

## 3. Dia do salário

O salário cai no **N-ésimo dia útil** do mês (`config.diaUtilSalario`, hoje `10`). Dia útil = segunda a sexta que não seja feriado.

**Feriados considerados** (nacionais, dias em que os bancos não abrem):
- Fixos: 01/01, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12.
- Móveis, a partir da Páscoa: Sexta-feira Santa (Páscoa − 2 dias) e Carnaval (segunda e terça: Páscoa − 48 e − 47 dias).

Calcule a Páscoa pelo algoritmo de Meeus/Jones/Butcher (computus gregoriano).

```ts
pascoa(ano): string                          // "AAAA-MM-DD"
feriados(ano): Set<string>
diaDoSalario(mes, n): string                 // "AAAA-MM-DD"
proximoSalario(hoje, n): string              // se o salário do mês já passou, o do mês seguinte; no próprio dia, hoje
```

Se o mês tiver menos de N dias úteis (ex.: fevereiro/2027 tem 18), `diaDoSalario` devolve o **último dia útil** do mês.

**Casos de teste** (`n = 10`):

| Mês | Dia do salário | Observação |
|---|---|---|
| `2026-10` | 2026-10-15 | Pula 12/10 (feriado, segunda) |
| `2026-11` | 2026-11-16 | Pula 02/11 |
| `2026-12` | 2026-12-14 | |
| `2027-01` | 2027-01-15 | |
| `2027-02` | 2027-02-16 | Carnaval em 08 e 09/02. Sem considerar o Carnaval daria 12/02 |
| `2027-03` | 2027-03-12 | |

`pascoa(2027)` → `"2027-03-28"`. `proximoSalario("2026-10-11", 10)` → `"2026-10-15"`; `proximoSalario("2026-10-20", 10)` → `"2026-11-16"`.

---

## 4. Resumo do mês (tela Início)

```ts
gastoPorCategoria(gastos, mes): Record<idCategoria | "fora", number>
resumoDoMes({ plano, gastos, mes, hoje }): {
  tetoTotal,            // soma dos tetos
  gastoTotal,           // soma dos gastos do mês que saem dos tetos, inclusive "fora do plano"
  gastoNoCredito,       // compras no crédito pela regra da fatura (seção 5.5): não gastam os tetos
  restante,             // tetoTotal − gastoTotal (pode ser negativo)
  porDia,               // só se mes === mês de hoje: max(restante, 0) / dias restantes, em centavos (floor); senão null
  diasRestantes,        // do dia de hoje até o último dia do mês, inclusive; senão null
  categorias: [{ id, teto, gasto, restante, estado }]
}
```

- **Estado de cada categoria:** `"ok"` (abaixo de 80% do teto), `"atencao"` (de 80% a 100%), `"estourou"` (acima de 100%). Teto 0 com gasto > 0 é `"estourou"`.
- Com cartão cadastrado, `resumoDoMes` recebe `cartao`: compras no crédito pela regra da fatura ficam fora dos tetos e aparecem em `noCredito` de cada categoria (seção 5.5).
- Um gasto cuja categoria foi apagada conta como **"fora do plano"** (id `"fora"`). Se houver gastos fora do plano, eles aparecem numa linha a mais no fim de `categorias`, com teto 0.
- Se `restante < 0`, mostrar o aviso de "passou do plano". O excesso sai primeiro do colchão e depois da reserva: o texto exato está na seção 8 (`fraseExcessoDoPlano`).

**Caso de teste:** outubro/2026, hoje 2026-10-11, gastos: Lazer 3500. → `tetoTotal` 41209, `gastoTotal` 3500, `restante` 37709, `diasRestantes` 21, `porDia` 1795; Lazer `restante` 4500, estado `"ok"`.

---

## 5. Cartão de crédito

> **Etapa 5.2:** esta seção foi reescrita a pedido do usuário para dar ao cartão um papel próprio. Ela substitui a regra anterior ("a compra no crédito sai do teto no mês da compra"), que continua valendo só na transição (5.7).

### 5.1 A ideia

O cartão é um **caixa separado**, com orçamento próprio. Uma compra no crédito **não sai do teto da categoria nem da reserva** deste mês: ela entra na **fatura**, e a fatura vira uma **conta fixa automática do mês em que vence**. O dinheiro não some, só muda de mês. Como o salário cai por volta do dia 15 e a fatura vence no dia 20, ela é paga com o salário do mês do vencimento.

- **Pix, débito e dinheiro** continuam saindo dos tetos, como sempre.
- **Crédito** sai do **limite** e do **orçamento do cartão**, e aparece nas barras das categorias como informação, sem gastar o teto.

### 5.2 Configuração (Ajustes → Cartão de crédito)

```ts
config.cartao = {
  limite: Centavos;        // ex.: 46800 (R$ 468,00); muda quando o banco mudar
  diaFechamento: number;   // 1 a 28; ex.: 12
  diaVencimento: number;   // 1 a 28; ex.: 20
  orcamento: Centavos;     // quanto o usuário quer usar do cartão por mês (≤ limite, recomendado)
  regraDesde: Mes;         // a partir de qual mês as compras seguem esta regra (transição, 5.7)
}
```

Sem `config.cartao`, o app segue a regra anterior (5.7) para todas as compras no crédito.

### 5.3 Em qual fatura cai cada compra

A fatura é identificada pelo **mês do vencimento**. A fatura de novembro vence em 20/nov e fecha em 12/nov: ela recebe as compras de **13/out a 12/nov**.

- Compra até o dia do fechamento (inclusive) → fatura que vence neste mês.
- Compra depois do fechamento → fatura que vence no mês seguinte.
- Se `diaFechamento >= diaVencimento` (ex.: fecha 25, vence 5), o fechamento de uma fatura fica no mês anterior ao do vencimento. A regra continua: a compra cai na primeira fatura cujo fechamento é no dia da compra ou depois dele.

```ts
faturaDaCompra(data, cartao): Mes   // mês de vencimento
```

**Parcelado:** `gasto.parcelas = n` (2 a 12, só no crédito). O valor total é dividido em n parcelas com `floor`; os centavos que sobram vão na **primeira** parcela. A parcela 1 cai na fatura da compra; a parcela k, k − 1 meses depois.

### 5.4 A fatura como conta fixa

```ts
faturaConhecida(gastos, cartao, mes): Centavos                  // soma das parcelas que caem na fatura que vence em mes
faturaDoPlano(gastos, cartao, mes, hoje): { valor, estimada }   // o que entra no plano de mes
```

- **Fatura fechada** (hoje depois do dia do fechamento dela): entra o **valor real**.
- **Fatura aberta ou futura**: entra o **maior** entre o que já se sabe (compras e parcelas que caem nela) e o **orçamento do cartão**, marcada como **estimada**. É uma escolha conservadora, para o plano nunca contar com dinheiro que o cartão vai levar. Quando a fatura fecha abaixo do orçamento, a diferença volta para o plano (normalmente para a reserva).

No plano (`calcularPlano`), a fatura entra junto com as contas fixas, com a mesma prioridade: `sobra = renda − contasFixas − fatura`. Na tela Plano, ela aparece numa linha própria: "− Fatura do cartão (vence 20/nov)", com "(estimada)" quando for o caso.

**Contas fixas pagas no crédito** (ex.: Claude Pro) continuam sendo contas fixas próprias e **não** entram na fatura calculada, senão seriam contadas duas vezes. A tela mostra a fatura completa do banco como informação: "Fatura no banco: R$ X (inclui Claude Pro)".

### 5.5 Tetos, barras e colchão

- Uma compra no crédito **não gasta o teto**: o estado da categoria (ok, atenção, estourou), o "quanto ainda posso gastar" e o valor por dia contam só Pix, débito e dinheiro.
- Ela **aparece na barra da categoria**, em segmentos de outro estilo depois dos segmentos normais, com o texto "+ R$ 80,00 no crédito".
- Passar do teto só no crédito **não** usa o colchão: o colchão cobre só o excesso dos gastos que saem dos tetos (seção 8).

### 5.6 Limite e orçamento

```ts
limiteUsado(gastos, contas, cartao, hoje): Centavos
limiteLivre = cartao.limite − limiteUsado        // pode ser negativo
```

- **Limite usado** = todas as parcelas de compras no crédito **feitas até hoje** cujas faturas **ainda não venceram** (vencimento ≥ hoje) + o que as contas fixas no crédito ocupam (regra de `contasNoCredito`, abaixo). Considera-se a fatura paga no dia do vencimento.
- **Orçamento:** a fatura aberta é comparada com `cartao.orcamento`. A partir de 80%, o aviso fica em atenção; acima de 100%, em estourou (os mesmos estados das categorias).

**Ao anotar no crédito** (painel): mostrar antes de salvar "Vai na fatura de novembro (vence 20/nov) · Limite livre: R$ 312,00". Depois de salvar, um destes avisos:
- "No crédito: R$ 35,00 na fatura de novembro. Limite livre: R$ 277,00"
- Fatura acima de 80% do orçamento: "Fatura de novembro: R$ 260,00 de R$ 300,00 do orçamento"
- Passou do limite: "Passou do limite do cartão em R$ 12,00"

### 5.7 Transição e regra anterior

Até `cartao.regraDesde` (ou para sempre, sem cartão cadastrado), vale a **regra anterior**: a compra no crédito conta no teto do mês em que foi feita, e a fatura não é conta fixa. Ela continua ocupando o limite até a fatura dela vencer.

- **Migração:** quem já usa o app ganha `regraDesde` = **mês seguinte ao da atualização** (atualizando em outubro/2026: `"2026-11"`). As compras no crédito de outubro, que já contaram nos tetos de outubro, não são contadas de novo na fatura de novembro. A tela avisa: "Fatura de novembro: R$ X no plano + R$ Y de compras de outubro (já descontadas em outubro)".
- **Cadastro novo do cartão:** `regraDesde` = mês seguinte ao do cadastro.
- A conta "Fatura PicPay Card (compras de setembro)", de `dados-iniciais.json`, continua como está (última parcela em out/26).

```ts
contaNoTeto(gasto, cartao): boolean   // forma !== "credito" || sem cartão || mês da compra < regraDesde
```

Regra mantida de antes: uma **conta fixa parcelada no crédito ocupa todas as parcelas que ainda faltam** (`valor × parcelasRestantes`); uma recorrente no crédito ocupa só a cobrança do mês.

### 5.8 Casos de teste

Cartão: limite 46800, fechamento 12, vencimento 20, orçamento 30000, `regraDesde: "2026-11"`.

| Compra | Fatura | Observação |
|---|---|---|
| 2026-11-05, R$ 80,00 | `2026-11` | até o fechamento (12/nov) |
| 2026-11-12, R$ 10,00 | `2026-11` | no dia do fechamento ainda entra |
| 2026-11-13, R$ 50,00 | `2026-12` | depois do fechamento |
| 2026-11-20, R$ 100,00 em 3x | dez 3334, jan 3333, fev 3333 | centavo a mais na primeira |
| 2026-10-28, R$ 40,00 | regra anterior | conta no teto de outubro; ocupa o limite até 20/nov |

- `faturaConhecida(..., "2026-11")` = 9000 (80 + 10; a compra de 28/out é da regra anterior).
- Plano de novembro com hoje = 2026-11-01 (fatura aberta): fatura no plano = max(9000, 30000) = **30000**, estimada.
- Plano de novembro com hoje = 2026-11-13 (fatura fechada): fatura no plano = **9000**, real.
- Fatura de dezembro: 5000 + 3334 = **8334**; no plano, enquanto aberta: max(8334, 30000) = **30000**.
- Limite usado em 2026-11-21 (fatura de novembro já vencida): 5000 + 3334 + 3333 + 3333 = **15000** → limite livre **31800**.
- Limite usado em 2026-11-15: 4000 (out, regra anterior) + 9000 (fatura de novembro) + 5000 (compra de 13/nov) = **18000** → livre **28800**. A compra parcelada de 20/nov ainda não existe.
- Novembro, gastos: Churrasco R$ 120,00 no Pix e R$ 80,00 no crédito, teto 18000 → a categoria conta 12000 no teto (estado ok, restam R$ 60,00) e mostra "+ R$ 80,00 no crédito".

---

## 6. Projeção (tela Plano)

`projecao(config, contas, categorias, mesInicial, meses = 12, { planejados, gastosPorMes, faturas })` → para cada mês: `{ mes, contasFixas, fatura, reserva, acumulado, colchao, saldoColchao }`, usando o plano de cada mês (seção 7), o colchão (seção 8) e a fatura do cartão de cada mês (seção 5.4: real se fechada, estimada se aberta). O colchão é simulado desde o mês de início do app, porque o saldo depende dos meses anteriores.

**Caso de teste:** a partir de `2026-10`, sem planos salvos nem colchão, o acumulado após 12 meses (outubro/2026 a setembro/2027) é **593404**.

---

## 7. Plano de cada mês

Cada mês pode ter o seu **plano salvo** (`MesPlanejado`): quanto gostaria de gastar em cada categoria e quanto separar no colchão. As contas fixas não entram aqui: continuam valendo para todos os meses.

**Regra de cópia:** um mês sem plano próprio **copia o último mês planejado antes dele**. Se novembro foi ajustado, dezembro em diante seguem novembro até ganharem plano próprio. Antes de qualquer plano salvo, valem os valores das categorias (`categoria.desejo`).

```ts
planejamentoDoMes(planejados, categorias, mes): { desejos, colchao, origem } // origem = mês copiado (ou null)
planejamentoInicial(categorias, mes): MesPlanejado                            // os valores das categorias viram o plano do mês
incluirCategoriaNosPlanos(planejados, categorias, { id, desejo }, mes)        // categoria nova "a partir de mes"
```

- Categoria que não está no plano salvo daquele mês vale **0** (ela não existia ou foi zerada). Para tirar uma categoria de um mês, basta deixá-la em 0. Ex.: "Presentes" existe sempre, mas só tem valor em dezembro.
- **Categoria nova** entra "a partir do mês atual": no plano desse mês (criado a partir do que valia nele, se não existia) e nos planos salvos dos meses seguintes. Meses anteriores não mudam. A própria categoria fica com `desejo = 0`.
- O plano de um mês é editado na **aba Plano**. "Voltar a copiar" apaga o plano próprio do mês.
- **Migração:** quem já usava o app ganha um plano salvo no mês de `config.criadoEm`, com os valores que as categorias tinham. Nada muda no que já aparecia.

**Casos de teste:** com planos salvos em out/26 e dez/26, novembro copia outubro, março/27 copia dezembro, e setembro/26 usa os valores das categorias (`origem: null`).

---

## 8. Colchão ("para não passar o mês duro")

Dinheiro separado todo mês, além da reserva de emergência, para cobrir os meses em que se gasta mais do que o planejado. Ele **acumula**: o que não for usado passa para o mês seguinte.

- **Quanto separar:** o valor do colchão no plano do mês (seção 7, copiado como as categorias).
- **Meta** (`config.metaColchao`, em Ajustes): ao chegar nela, o app para de separar, e o dinheiro volta para a reserva. Meta 0 = sem colchão.
  `aSepararNoColchao(valorDoMes, meta, saldo) = max(0, min(valorDoMes, meta − saldo))`
- **Prioridade:** depois dos essenciais e antes da reserva mínima (seção 2).
- **Uso automático:** se os gastos do mês passarem da soma dos tetos, o excesso **sai primeiro do colchão**. Só o que passar do saldo sai da reserva. Compras no crédito pela regra da fatura não entram nessa conta (seção 5.5).

```
para cada mês, do início do app até o mês pedido:
    separado   = colchão do plano (calcularPlano, com aSepararNoColchao)
    excesso    = max(gastos do mês que saem dos tetos − soma dos tetos, 0)
    usado      = min(excesso, saldoInicial + separado)
    saldoFinal = saldoInicial + separado − usado      // vira o saldoInicial do mês seguinte
```

```ts
simularMeses({ config, contas, categorias, planejados, gastosPorMes, de, ate }): MesSimulado[]
fraseExcessoDoPlano(excesso, colchao): string
```

**Aviso no Início** (quando passa do plano):
- Sem colchão: "Você passou do plano em R$ X. Isso sai da reserva deste mês."
- Colchão cobre tudo: "Você passou do plano em R$ X. Isso sai do colchão, que fica com R$ Y."
- Colchão cobre uma parte: "Você passou do plano em R$ X: R$ A saem do colchão e R$ B da reserva deste mês."

**Corte pequeno:** se o corte dos flexíveis arredonda para 0%, a mensagem diz "em menos de 1%" (e não "em 0%", que pareceria que nada mudou).

**Casos de teste** (plano de out/26 sem colchão; de nov/26 em diante, colchão de 5000 por mês):

| Meta | Cenário | Resultado |
|---|---|---|
| 12000 | Sem gastos | Separado: nov 5000, dez 5000, jan 2000 (só faltava isso), fev 0. Saldo: 5000, 10000, 12000, 12000. Reserva: 29892, 33092, 36092, 38092 |
| 30000 | Gastou 2000 acima dos tetos em novembro | Novembro: separa 5000, usa 2000, saldo 3000. Dezembro: saldo 3000 + 5000 = 8000 |
| 30000 | Gastou 7000 acima dos tetos em novembro | Usa os 5000 do colchão; os outros 2000 saem da reserva. Saldo 0 |
| 0 | Qualquer | Nada é separado; a reserva de novembro volta a 34892 |
