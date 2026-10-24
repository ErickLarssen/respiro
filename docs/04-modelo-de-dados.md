# 04 — Modelo de dados

## Tipos (`src/domain/tipos.ts`)

```ts
export type Mes = string;      // "AAAA-MM"
export type DataISO = string;  // "AAAA-MM-DD"
export type Centavos = number; // sempre inteiro

// Cartão de crédito (03-regras-de-negocio, seção 5). Substitui o antigo limiteCartao.
export interface Cartao {
  limite: Centavos;
  diaFechamento: number;      // 1 a 28
  diaVencimento: number;      // 1 a 28
  orcamento: Centavos;        // quanto usar do cartão por mês
  regraDesde: Mes;            // compras a partir deste mês seguem a regra da fatura
}

export interface Config {
  id: "principal";             // só existe uma
  renda: Centavos;
  diaUtilSalario: number;      // 1 a 22
  reservaMinima: Centavos;
  cartao?: Cartao;            // sem cartão, compras no crédito contam no teto (regra anterior)
  metaColchao?: Centavos;     // ao chegar nesse saldo, o colchão para de crescer; 0 ou ausente = sem colchão
  criadoEm: DataISO;          // o mês desta data é o início do histórico do colchão
}

export interface Conta {
  id: string;                  // crypto.randomUUID()
  nome: string;
  valor: Centavos;
  tipo: "recorrente" | "parcela";
  ultimaParcela?: Mes;         // obrigatório quando tipo === "parcela"
  observacao?: string;
  pagaNoCredito?: boolean;     // ex.: Claude Pro; ocupa limite do cartão
  ordem: number;               // posição na lista
}

export interface Categoria {
  id: string;
  nome: string;
  desejo: Centavos;            // valor dos meses anteriores ao primeiro plano salvo (o de cada mês fica em MesPlanejado)
  essencial: boolean;
  descricao?: string;          // ex.: "Pizza, lanches e cinema"
  cor: "c1" | "c2" | "c3" | "c4" | "c5";
  ordem: number;
}

export type FormaPagamento = "pix" | "debito" | "dinheiro" | "credito";

export interface Gasto {
  id: string;
  data: DataISO;
  valor: Centavos;
  categoriaId: string;
  descricao?: string;
  forma: FormaPagamento;
  parcelas?: number;           // só no crédito: 2 a 12 (ausente = à vista)
  criadoEm: string;            // ISO completo, para desempate na ordenação
}

// O plano que o usuário salvou para um mês (03-regras-de-negocio, seção 7).
// Um mês sem registro copia o último mês planejado antes dele.
export interface MesPlanejado {
  mes: Mes;
  desejos: Record<string, Centavos>; // por id de categoria; categoria ausente = 0 neste mês
  colchao: Centavos;                 // quanto separar no colchão neste mês
}

export interface Plano {
  mes: Mes;
  renda: Centavos;
  contasFixas: Centavos;
  fatura: Centavos;                  // fatura do cartão que vence neste mês (entra como conta fixa)
  sobra: Centavos;
  tetos: Record<string, Centavos>;
  colchao: Centavos;                 // quanto vai de fato para o colchão neste mês
  reserva: Centavos;
  situacao: "folga" | "justo" | "apertado" | "critico" | "deficit";
  mensagens: string[];
}
```

`Plano` **não é salvo**: é sempre recalculado a partir dos dados. Assim, mudar uma conta ou a renda atualiza o plano de todos os meses na hora.

## Banco (`src/data/db.ts`, Dexie)

```ts
db.version(1).stores({
  config:     "id",
  contas:     "id, ordem",
  categorias: "id, ordem",
  gastos:     "id, data, categoriaId",   // índice em data para filtrar o mês
});

// Versão 3: sem tabela nova; migra config.limiteCartao para config.cartao (abaixo)
db.version(3).stores({}).upgrade(/* migração do cartão */);

// Versão 2: plano de cada mês
db.version(2).stores({ planosDoMes: "mes" }).upgrade(/* migração, abaixo */);
```

**Migração da versão 1 para a 2:** se já existe config, o app cria um plano salvo no mês de `config.criadoEm` com os valores que as categorias tinham (`planejamentoInicial`). Assim, quem já usava o app não vê nada mudar. Há um teste que cria um banco na versão 1 e o abre com o código novo (`src/data/__tests__/migracao.test.ts`).

Gastos do mês: `db.gastos.where("data").between("2026-10-01", "2026-10-31", true, true)`. Strings no formato `AAAA-MM-DD` ordenam corretamente como texto.

## Primeiro uso

Se a tabela `config` estiver vazia ao abrir o app, mostrar uma tela com duas opções:
1. **"Começar com meus dados"**: carrega `docs/dados-iniciais.json`. O arquivo `src/data/dadosIniciais.ts` **importa** o JSON em vez de copiar os valores, para existir uma única fonte.
2. **"Começar do zero"**: salva uma config zerada (renda 0, reserva mínima 0, dia útil do salário 5, sem contas nem categorias) e abre Ajustes para o usuário preencher. Até a Etapa 4, sem a tela de Ajustes, o app mostra o plano zerado.

## Backup

Como os dados só existem no aparelho, apagar os dados do navegador apaga tudo. A tela Ajustes tem:
- **Exportar backup**: gera `respiro-backup-AAAA-MM-DD.json` com `{ versao: 3, config, contas, categorias, gastos, planosDoMes }`.
- **Backups antigos** continuam aceitos: os da versão 1 ganham o plano do primeiro mês; os das versões 1 e 2 com `limiteCartao` ganham o cartão (como na migração do banco).

**Migração da versão 2 para a 3:** se a config tem o antigo `limiteCartao`, ele vira `config.cartao` com fechamento 12, vencimento 20, orçamento igual ao limite (para o usuário ajustar) e `regraDesde` = mês seguinte ao da atualização. A conversão fica em `src/data/migracoes.ts`, usada pelo banco e pelo backup.
- **Importar backup**: lê o arquivo, valida a `versao` e os campos obrigatórios, mostra um resumo ("12 contas, 4 categorias, 87 gastos") e só substitui depois de o usuário confirmar.

## Armazenamento persistente

Ao abrir o app já com dados, `src/data/armazenamento.ts` chama `navigator.storage.persist()`. Assim, o navegador não apaga o IndexedDB sozinho quando o aparelho fica sem espaço; só o usuário pode apagar. No Chrome do Android, o pedido costuma ser aceito com o app instalado na tela inicial, e nenhuma pergunta aparece. Se o navegador recusar, o app funciona igual, e o backup continua sendo a proteção.
