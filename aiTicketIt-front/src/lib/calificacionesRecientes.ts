// Avisa a Explorar que hubo una calificación nueva desde su última carga, para que recargue la lista y muestre
// el puntaje y el orden actualizados (specs/006-calificaciones-opiniones, SC-002). Si no hubo ninguna, Explorar
// no recarga al volver a la pestaña y conserva el scroll y las páginas cargadas.

let version = 0;

/** Llamar después de cada calificación guardada (Calificar experiencia y recordatorio de Explorar). */
export function marcarCalificacionNueva(): void {
  version += 1;
}

/** Cambia cada vez que se guarda una calificación. */
export function versionCalificaciones(): number {
  return version;
}
