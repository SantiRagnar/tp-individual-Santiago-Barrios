// Favoritos de cada comprador (specs/003-explorar-detalle-evento/data-model.md § Favorito, research R10):
// compradorId → (eventoId → marcadoEn). Un evento es favorito a lo sumo una vez por comprador.
const porComprador = new Map();

/** Idempotente: si ya era favorito, conserva la fecha original. */
export function marcar(compradorId, eventoId, marcadoEn) {
  let favoritos = porComprador.get(compradorId);
  if (!favoritos) {
    favoritos = new Map();
    porComprador.set(compradorId, favoritos);
  }
  if (!favoritos.has(eventoId)) favoritos.set(eventoId, marcadoEn);
}

/** Idempotente. */
export function desmarcar(compradorId, eventoId) {
  porComprador.get(compradorId)?.delete(eventoId);
}

export function esFavorito(compradorId, eventoId) {
  return porComprador.get(compradorId)?.has(eventoId) ?? false;
}

export function marcadoEn(compradorId, eventoId) {
  return porComprador.get(compradorId)?.get(eventoId) ?? null;
}

export function idsDe(compradorId) {
  return [...(porComprador.get(compradorId)?.keys() ?? [])];
}

/** El seed no tiene favoritos. */
export function reiniciar() {
  porComprador.clear();
}
