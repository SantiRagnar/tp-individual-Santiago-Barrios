/**
 * Única regla de visibilidad del lado compradores (FR-001, research R2): solo los Publicados cuya
 * fecha y hora todavía no pasaron. `estadoVisible` ya convierte en Finalizado un Publicado con fecha
 * pasada, así que esto cubre Borradores, Finalizados y eventos que terminan mientras se navega.
 * La usan Explorar, el Detalle y Favoritos.
 */
export function esVisibleParaCompradores(evento, ahora) {
  return evento.estadoVisible(ahora) === "Publicado";
}
