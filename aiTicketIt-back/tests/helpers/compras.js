import * as eventosRepository from "../../repository/eventosRepository.js";

// Helpers de la feature 004 (specs/004-compra-pago-mis-compras/tasks.md T016).

/**
 * Guarda un evento Publicado y visible (fecha futura respecto de HOY = 2026-11-09) con un solo tipo de
 * entrada. Sirve para probar cupos chicos y concurrencia (SC-003). Devuelve { eventoId, tipoId }.
 */
export function crearEventoConCupo({ cupo = 10, precio = 10000, fecha = "2027-02-01T21:00:00-03:00", organizadorId = "org-1", vendidas = 0 } = {}) {
  const eventoId = eventosRepository.siguienteIdEvento();
  const tipoId = eventosRepository.siguienteIdTipo();
  eventosRepository.guardar({
    id: eventoId,
    organizadorId,
    nombre: `Evento con cupo ${eventoId}`,
    descripcion: null,
    categoria: "Teatro",
    fechaHora: fecha,
    ubicacion: "Sala de prueba",
    imagenId: null,
    tiposDeEntrada: [{ id: tipoId, nombre: "General", cupo, precio, vendidas }],
    estado: "Publicado",
    creadoEn: "2026-11-01T10:00:00-03:00",
  });
  return { eventoId, tipoId };
}

/** Body válido de POST /compradores/compras (Platea × 2 de Hamlet por defecto). */
export function cuerpoDeCompra(cambios = {}) {
  return {
    eventoId: "evt-1",
    tipoDeEntradaId: "tip-2",
    cantidad: 2,
    medioDePago: "Tarjeta de crédito",
    precioUnitario: 18000,
    ...cambios,
  };
}
