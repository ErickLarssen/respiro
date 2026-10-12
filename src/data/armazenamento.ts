// Pede ao navegador para não apagar os dados do app sozinho.
//
// Sem isso, se o celular ficar sem espaço, o navegador pode limpar o IndexedDB de
// sites pouco usados, e com ele todos os dados do Respiro. Com "armazenamento
// persistente", ele só apaga se o usuário mandar. No Chrome do Android, o pedido
// costuma ser aceito em apps instalados na tela inicial; não aparece nenhuma pergunta.

export async function pedirArmazenamentoPersistente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false // navegador sem suporte: o app funciona igual
  }
}
