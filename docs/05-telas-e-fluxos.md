# 05 — Telas e fluxos

Quatro abas numa barra fixa na parte de baixo: **Início**, **Gastos**, **Plano** e **Ajustes**. Um botão grande **"+ Anotar gasto"** fica sempre visível acima da barra nas abas Início e Gastos.

As abas Início, Gastos e Plano têm um **seletor de mês** no topo (‹ outubro de 2026 ›). Abrem sempre no mês atual.

## Início (`/`)

Responde a três perguntas, nesta ordem:

1. **Quanto ainda posso gastar?** Número grande: `restante`. Abaixo: "Cerca de R$ 17,95 por dia até 31/out (21 dias)". Se `restante < 0`, o número fica em vermelho e aparece o aviso de "passou do plano", dizendo de onde sai o excesso: primeiro do colchão, depois da reserva (`03`, seção 8).
2. **Quanto vou guardar?** Cartão: "Guarde R$ 51,92 assim que o salário cair".
3. **Quando cai o salário?** Cartão: "Salário: qui, 15/out (em 4 dias)".

Com cartão cadastrado, no mês atual aparece o cartão **Fatura de novembro**: o valor da fatura aberta contra o orçamento (barra segmentada e etiqueta OK/ATENÇÃO/ESTOUROU), "Fecha 12/nov · vence 20/nov", a fatura a pagar (se houver uma fechada que ainda não venceu) e o limite livre. Nos tetos, compras no crédito aparecem em tom claro depois dos segmentos normais, com "+ R$ 80,00 no crédito", sem gastar o teto.

Com meta de colchão cadastrada, aparece também o cartão **Colchão**: saldo, meta, uma barra segmentada e o que fazer no mês ("Separe R$ 50,00 assim que o salário cair", "usou R$ 16,00 este mês" ou "Meta batida").

Depois, a lista **Seus tetos**: para cada categoria, o nome, "R$ 35,00 de R$ 80,00", uma barra de progresso na cor da categoria e o estado (ok, atenção ou estourou) como etiqueta colorida. Se houver gastos "fora do plano", aparece uma linha a mais.

Para meses **passados**: "Sobrou do plano" em vez de "Ainda posso gastar", sem valor por dia. Para meses **futuros**: "Plano para novembro" com os tetos e sem barras.

## Anotar gasto (painel que sobe de baixo)

1. **Valor**: campo grande, teclado numérico (`inputMode="decimal"`), aceita "35", "35,5" e "35,50". Foco automático ao abrir.
2. **Categoria**: botões grandes, um por categoria, mais "Fora do plano".
3. **Forma de pagamento**: Pix, Débito, Dinheiro, Crédito. Lembra a última escolhida. No **Crédito**, com cartão cadastrado: "Vai na fatura de novembro (vence 20/nov) · Limite livre: R$ 312,00" e o campo **Parcelas** (1 a 12; com mais de 1, mostra "3x de R$ 33,34, de novembro a janeiro"). Depois de salvar, o aviso diz a fatura e o limite livre, ou alerta orçamento/limite (`03`, seção 5.6).
4. **Descrição**: opcional.
5. **Data**: hoje por padrão; editável.
6. **Salvar**: fecha o painel e mostra "Gasto anotado: R$ 35,00 em Lazer".

Depois de salvar, se a categoria passou de 80% ou de 100% do teto, o aviso diz isso: "Lazer: restam R$ 5,00 este mês".

## Gastos (`/gastos`)

- Total do mês. Com cartão: "Nos tetos: R$ X · No crédito: R$ Y" e um cartão com a fatura aberta (fecha e vence), a fatura a pagar e o limite livre. Sem cartão: "No crédito este mês: R$ X (vence no dia 20 do mês que vem)".
- Compras parceladas aparecem como "Crédito 3x".
- Lista agrupada por dia ("dom, 11/out"), com descrição, categoria, forma e valor.
- Tocar num gasto permite **editar** ou **apagar**. Apagar pede confirmação na própria tela (sem `confirm()` do navegador).

## Plano (`/plano`)

Explica o plano como uma conta, de cima para baixo:

```
Renda                          R$ 1.606,00
− Contas fixas                 R$ 1.141,99   (toque para ver a lista)
− Fatura do cartão (vence 20/nov, estimada)   R$ 300,00   (só com cartão)
= Sobra                        R$   464,01
− Essenciais                   R$   100,00
− Colchão                      R$    50,00   (só com meta de colchão)
− Gastos flexíveis             R$   312,09
= Reserva                      R$    51,92
```

Abaixo, as mensagens do plano (ex.: "Seus planos couberam. Os R$ 1,92 que sobraram vão para a reserva.") e, com colchão, "Colchão no fim de novembro: R$ 50,00 de R$ 300,00".

**Ajustar o plano do mês** (`03`, seção 7): botão "Ajustar o plano de novembro", com a origem embaixo ("Copiado de outubro de 2026." ou "Plano próprio de novembro."). Abre um campo por categoria e o campo do colchão, com a prévia na reserva antes de salvar. Se o mês tem plano próprio, oferece "Voltar a copiar outubro".

Depois, **Próximos 12 meses**: gráfico de barras simples da reserva de cada mês, com o acumulado no fim ("Em 12 meses: R$ 5.934,04") e, com colchão, o saldo dele no último mês, e a lista **Quando cada parcela acaba** ("Notebook Dell: última em mai/27, libera R$ 395,00 a partir de jun/27").

## Ajustes (`/ajustes`)

Seções, cada uma salvando ao tocar em "Salvar":
- **Renda**: valor, dia útil do salário, reserva mínima e **meta do colchão** (0 = sem colchão).
- **Cartão de crédito**: limite, dia de fechamento, dia de vencimento e orçamento por mês. No primeiro cadastro, avisa a partir de qual mês as compras vão para a fatura.
- **Contas fixas**: lista editável. Cada linha tem nome, valor, tipo e, se for parcela, "parcelas restantes". Botões para adicionar e remover.
- **Categorias**: nome, essencial (sim/não), descrição e cor. O valor de cada mês é ajustado na aba Plano; uma categoria nova pede o valor "a partir deste mês".
- **Backup**: exportar e importar.
- **Apagar tudo**: com confirmação digitando "APAGAR".

Ao mudar qualquer valor que afete o plano, mostrar antes de salvar o efeito na reserva deste mês: "Com essa mudança, a reserva de outubro vai de R$ 51,92 para R$ 61,92."
