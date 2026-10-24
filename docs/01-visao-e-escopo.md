# 01 — Visão e escopo

## O problema

A renda chega uma vez por mês (no 10º dia útil) e quase 70% dela já vai para contas fixas e parcelas. O que sobra some em gastos pequenos (pizza, lanches, compras) sem que dê para ver quanto ainda resta. O cartão de crédito cobre a falta, mas empurra o problema para a fatura seguinte.

## O objetivo do usuário

- Nunca ficar sem dinheiro durante o mês.
- Saber, a qualquer momento, **quanto ainda pode gastar** em cada coisa.
- Guardar uma reserva todo mês, mesmo que pequena, e vê-la crescer.
- Diminuir gastos triviais.

## A ideia central

O usuário diz **quanto gostaria** de gastar em cada categoria. O app calcula **quanto ele pode** gastar (o teto), protegendo primeiro as contas fixas, depois os gastos essenciais e a reserva mínima. Se os desejos não couberem, o app reduz os gastos flexíveis na mesma proporção e explica isso em uma frase.

## Usuário

Uma pessoa só, usando principalmente o celular. Sem login no MVP: os dados ficam no próprio aparelho.

## MVP (etapas 0 a 5 do roadmap)

**Entra:**
- Cadastro de renda, dia útil do salário e reserva mínima.
- Contas fixas: recorrentes (luz, internet, assinaturas) e parceladas (com a última parcela).
- Categorias de gasto variável, cada uma com "quanto eu gostaria" e se é essencial ou flexível.
- Plano automático do mês: teto por categoria e reserva.
- Anotar um gasto em poucos toques (valor, categoria, forma de pagamento).
- Tela inicial: quanto ainda dá para gastar no mês e por dia, o dia do próximo salário e os tetos com barras de progresso.
- Tela do plano: como o plano foi calculado e a projeção da reserva nos próximos 12 meses.
- PWA instalável, funcionando offline.
- Exportar e importar um backup em JSON (os dados só existem no aparelho, então o backup é essencial).

**Não entra no MVP (fica para depois):**
- Login e sincronização entre aparelhos (etapa 6, opcional).
- Leitura automática de extrato bancário.
- ~~Ajuste de teto diferente só para um mês específico~~: entrou na Etapa 5.1 (plano de cada mês), junto com o colchão. Ver `03-regras-de-negocio.md`, seções 7 e 8.
- Gráficos elaborados, metas múltiplas, investimentos.

## Dados reais para o primeiro uso

`docs/dados-iniciais.json` tem a situação real do usuário em outubro de 2026. Com esses dados, o plano de outubro deve dar **reserva de R$ 51,92** (ver casos de teste em `03-regras-de-negocio.md`).
