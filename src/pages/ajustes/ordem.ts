/** Próximo número de ordem: o item novo vai para o fim da lista. */
export function proximaOrdem(itens: { ordem: number }[]): number {
  return Math.max(0, ...itens.map((item) => item.ordem)) + 1
}
