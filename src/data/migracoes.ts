import { somarMeses } from '../domain/datas'
import type { Cartao, Mes } from '../domain/tipos'

// Conversões de dados antigos, usadas pela migração do banco (db.ts) e pela
// importação de backups antigos (backup.ts).

/** Fechamento e vencimento sugeridos ao converter um limite antigo (os do PicPay Card do usuário). */
export const CARTAO_PADRAO = { diaFechamento: 12, diaVencimento: 20 } as const

/**
 * Cartão criado a partir do antigo config.limiteCartao. O orçamento começa igual ao
 * limite (o usuário ajusta em Ajustes) e a regra da fatura vale a partir do mês seguinte.
 */
export function cartaoDoLimiteAntigo(limite: number, mesAtual: Mes): Cartao {
  return { limite, ...CARTAO_PADRAO, orcamento: limite, regraDesde: somarMeses(mesAtual, 1) }
}
