// Reglas de las ventas del evento (specs/005-panel-evento/data-model.md § Compra · Transición nueva
// y Valores derivados; research R4). Argentina usa UTC−3 fijo, sin horario de verano.

const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;
const NO_ACTIVAS = new Set(["Cancelada", "Reembolsada"]);

/** Las 00:00 (hora de Argentina) del día en que ocurre `iso`, como Date. */
export function inicioDelDiaEnArgentina(iso) {
  const enArgentina = new Date(new Date(iso).getTime() - OFFSET_ARGENTINA_MS);
  const dia = enArgentina.toISOString().slice(0, 10);
  return new Date(`${dia}T00:00:00-03:00`);
}

/** Una compra activa ocupa lugares: no está Cancelada ni Reembolsada (FR-006). */
export function esActiva(compra) {
  return !NO_ACTIVAS.has(compra.estado);
}

/** Confirmada y ya llegó el día del evento (desde las 00:00 −03:00, sin límite posterior). FR-012. */
export function puedeMarcarUtilizada(compra, evento, ahora) {
  if (compra.estado !== "Confirmada" || !evento.fechaHora) return false;
  return ahora.getTime() >= inicioDelDiaEnArgentina(evento.fechaHora).getTime();
}
