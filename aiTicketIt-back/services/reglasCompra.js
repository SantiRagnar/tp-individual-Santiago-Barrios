// Reglas de estado de una compra (specs/004-compra-pago-mis-compras/data-model.md § Transiciones y
// § Valores derivados, research R7). Funciones puras: reciben `ahora` para que el reloj lo fije el
// servicio (y los tests, con fijarAhora). Las usan el DTO, para mostrar las acciones, y comprasService,
// para permitirlas o rechazarlas: pantalla y servicio no pueden discrepar.

const UN_DIA_MS = 86_400_000;

const yaOcurrio = (evento, ahora) => new Date(evento.fechaHora).getTime() <= ahora.getTime();

/** Completar pago: solo una compra Pendiente de pago con el evento todavía por ocurrir (FR-022). */
export function puedeCompletarPago(compra, evento, ahora) {
  return compra.estado === "Pendiente de pago" && !yaOcurrio(evento, ahora);
}

/**
 * Por qué no se puede cancelar, o null si se puede (FR-020, FR-023). El estado tiene prioridad sobre la
 * fecha: una Utilizada de un evento pasado dice UTILIZADA.
 */
export function motivoNoCancelable(compra, evento, ahora) {
  if (compra.estado === "Utilizada") return "UTILIZADA";
  if (compra.estado === "Reembolsada") return "REEMBOLSADA";
  if (compra.estado === "Cancelada") return "CANCELADA";
  if (yaOcurrio(evento, ahora)) return "EVENTO_REALIZADO";
  return null;
}

/** Confirmada → Reembolsada (se reintegra la plata); Pendiente de pago → Cancelada (FR-024). */
export function estadoTrasCancelar(compra) {
  return compra.estado === "Confirmada" ? "Reembolsada" : "Cancelada";
}

/** Días hasta el evento redondeando hacia arriba; solo compras Confirmadas de eventos futuros. */
export function diasParaEvento(compra, evento, ahora) {
  if (compra.estado !== "Confirmada" || yaOcurrio(evento, ahora)) return null;
  return Math.ceil((new Date(evento.fechaHora).getTime() - ahora.getTime()) / UN_DIA_MS);
}
