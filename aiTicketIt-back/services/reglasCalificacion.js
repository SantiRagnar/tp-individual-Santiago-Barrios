// Reglas para calificar una compra (specs/006-calificaciones-opiniones/data-model.md § Valores derivados,
// research R3). Funciones puras que usan el DTO, para mostrar la acción y la nota, y comprasService, para
// permitirla o rechazarla. No dependen del reloj: alcanza con que la compra esté Utilizada y no hay plazo
// (Clarifications de la spec).

/** Por qué no se puede calificar, o null si se puede. Ya calificada se verifica antes que el estado. */
export function motivoNoCalificable(compra) {
  if (compra.calificacion) return "YA_CALIFICADA";
  if (compra.estado !== "Utilizada") return "NO_UTILIZADA";
  return null;
}

/** Solo una compra Utilizada y todavía sin calificar (FR-002). */
export function puedeCalificar(compra) {
  return motivoNoCalificable(compra) === null;
}
