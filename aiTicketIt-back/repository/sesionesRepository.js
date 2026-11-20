// Indexado por data-model.md Sesion.tokenHash. El token en claro nunca se guarda.
const porTokenHash = new Map();

export function guardar(sesion) {
  porTokenHash.set(sesion.tokenHash, sesion);
  return sesion;
}

export function buscarPorTokenHash(tokenHash) {
  return porTokenHash.get(tokenHash) ?? null;
}

export function eliminar(tokenHash) {
  porTokenHash.delete(tokenHash);
}

export function reiniciar() {
  porTokenHash.clear();
}
