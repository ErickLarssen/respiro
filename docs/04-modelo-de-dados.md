# 04 — Modelo de dados

## Tipos (`src/domain/tipos.ts`)

```ts
export type Mes = string;      // "AAAA-MM"
export type DataISO = string;  // "AAAA-MM-DD"
export type Centavos = number; // sempre inteiro

export interface Config {
  id: "principal";             // só existe uma
  renda: Centavos;
  diaUtilSalario: number;      // 1 a 22
  reservaMinima: Centavos;
  limiteCartao?: Centavos;    // opcional, só para mostrar o limite livre
  criadoEm: DataISO;
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
  desejo: Centavos;            // quanto o usuário gostaria de gastar por mês
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
  criadoEm: string;            // ISO completo, para desempate na ordenação
}

export interface Plano {
  mes: Mes;
  renda: Centavos;
  contasFixas: Centavos;
  sobra: Centavos;
  tetos: Record<string, Centavos>;
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
```

Gastos do mês: `db.gastos.where("data").between("2026-10-01", "2026-10-31", true, true)`. Strings no formato `AAAA-MM-DD` ordenam corretamente como texto.

## Primeiro uso

Se a tabela `config` estiver vazia ao abrir o app, mostrar uma tela com duas opções:
1. **"Começar com meus dados"**: carrega `docs/dados-iniciais.json`. O arquivo `src/data/dadosIniciais.ts` **importa** o JSON em vez de copiar os valores, para existir uma única fonte.
2. **"Começar do zero"**: salva uma config zerada (renda 0, reserva mínima 0, dia útil do salário 5, sem contas nem categorias) e abre Ajustes para o usuário preencher. Até a Etapa 4, sem a tela de Ajustes, o app mostra o plano zerado.

## Backup

Como os dados só existem no aparelho, apagar os dados do navegador apaga tudo. A tela Ajustes tem:
- **Exportar backup**: gera `respiro-backup-AAAA-MM-DD.json` com `{ versao: 1, config, contas, categorias, gastos }`.
- **Importar backup**: lê o arquivo, valida a `versao` e os campos obrigatórios, mostra um resumo ("12 contas, 4 categorias, 87 gastos") e só substitui depois de o usuário confirmar.
