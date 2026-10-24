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
  gastoTotal,           // soma dos gastos do mês, inclusive "fora do plano"
  restante,             // tetoTotal − gastoTotal (pode ser negativo)
  porDia,               // só se mes === mês de hoje: max(restante, 0) / dias restantes, em centavos (floor); senão null
  diasRestantes,        // do dia de hoje até o último dia do mês, inclusive; senão null
  categorias: [{ id, teto, gasto, restante, estado }]
}
```

- **Estado de cada categoria:** `"ok"` (abaixo de 80% do teto), `"atencao"` (de 80% a 100%), `"estourou"` (acima de 100%). Teto 0 com gasto > 0 é `"estourou"`.
- Um gasto cuja categoria foi apagada conta como **"fora do plano"** (id `"fora"`). Se houver gastos fora do plano, eles aparecem numa linha a mais no fim de `categorias`, com teto 0.
- Se `restante < 0`, mostrar o aviso de "passou do plano". O excesso sai primeiro do colchão e depois da reserva: o texto exato está na seção 8 (`fraseExcessoDoPlano`).

**Caso de teste:** outubro/2026, hoje 2026-10-11, gastos: Lazer 3500. → `tetoTotal` 41209, `gastoTotal` 3500, `restante` 37709, `diasRestantes` 21, `porDia` 1795; Lazer `restante` 4500, estado `"ok"`.

---

## 5. Cartão de crédito

**Regra: uma compra no crédito conta no mês em que foi feita, não no mês em que a fatura vence.** O usuário anota a compra como qualquer outro gasto (`forma: "credito"`), e ela entra no teto da categoria na hora. Por isso, **a fatura do cartão não é uma conta fixa**: se fosse, a mesma compra seria contada duas vezes (uma ao anotar, outra ao pagar a fatura).

**Exceções:**
- **Assinaturas e parcelas pagas no cartão** continuam cadastradas como contas fixas (ex.: Claude Pro). A forma de pagamento só muda *quando* o dinheiro sai, não *quanto*.
- **Transição:** a fatura que vence em outubro/2026 paga compras de setembro, feitas antes de o app existir. Ela entra uma única vez, como parcela com `ultimaParcela: "2026-10"` (ver `dados-iniciais.json`).

**Consequência para o usuário:** o dinheiro de uma compra no crédito continua na conta até o dia 20, mas já está comprometido. O "quanto ainda posso gastar" da tela Início já desconta essa compra, então o saldo do banco não deve ser lido como dinheiro livre.

**Tela Gastos:** mostrar "No crédito este mês: R$ X (vence no dia 20 do mês que vem)". Se o usuário cadastrar o limite do cartão em Ajustes (opcional, `config.limiteCartao`), mostrar também quanto do limite ainda está livre, descontando as contas fixas pagas no crédito.

```ts
gastoNoCredito(gastos, mes): number          // compras com forma "credito" no mês
contasNoCredito(contas, mes): number         // contas fixas com pagaNoCredito
limiteLivre({ limite, gastos, contas, mes }) // limite − gastoNoCredito − contasNoCredito (pode ser negativo)
```

Como o banco calcula, uma **parcela no crédito ocupa todas as parcelas que ainda faltam**, contando a do mês (`valor × parcelasRestantes`). Uma recorrente no crédito ocupa só a cobrança do mês.

**Caso de teste:** limite R$ 5.000,00 em outubro/2026, com R$ 35,00 de compras no crédito, o Claude Pro (R$ 116,00, recorrente) e o notebook (R$ 395,00, faltam 8) no crédito: 500000 − 3500 − 11600 − 8 × 39500 = **168900**.

---

## 6. Projeção (tela Plano)

`projecao(config, contas, categorias, mesInicial, meses = 12, { planejados, gastosPorMes })` → para cada mês: `{ mes, contasFixas, reserva, acumulado, colchao, saldoColchao }`, usando o plano de cada mês (seção 7) e o colchão (seção 8). O colchão é simulado desde o mês de início do app, porque o saldo depende dos meses anteriores.

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
- **Uso automático:** se os gastos do mês passarem da soma dos tetos, o excesso **sai primeiro do colchão**. Só o que passar do saldo sai da reserva.

```
para cada mês, do início do app até o mês pedido:
    separado   = colchão do plano (calcularPlano, com aSepararNoColchao)
    excesso    = max(gastos do mês − soma dos tetos, 0)
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

**Casos de teste** (plano de out/26 sem colchão; de nov/26 em diante, colchão de 5000 por mês):

| Meta | Cenário | Resultado |
|---|---|---|
| 12000 | Sem gastos | Separado: nov 5000, dez 5000, jan 2000 (só faltava isso), fev 0. Saldo: 5000, 10000, 12000, 12000. Reserva: 29892, 33092, 36092, 38092 |
| 30000 | Gastou 2000 acima dos tetos em novembro | Novembro: separa 5000, usa 2000, saldo 3000. Dezembro: saldo 3000 + 5000 = 8000 |
| 30000 | Gastou 7000 acima dos tetos em novembro | Usa os 5000 do colchão; os outros 2000 saem da reserva. Saldo 0 |
| 0 | Qualquer | Nada é separado; a reserva de novembro volta a 34892 |
