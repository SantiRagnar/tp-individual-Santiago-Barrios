import { diasParaEvento, motivoNoCancelable, puedeCompletarPago } from "../services/reglasCompra.js";

// Vista Compra del lado compradores (specs/004-compra-pago-mis-compras/contracts/compras.openapi.yaml § Compra).
// Del evento se muestran los datos actuales; del tipo de entrada, la copia guardada al pagar (research R6).
// Acciones, motivo y cuenta regresiva se calculan con reglasCompra y el `ahora` del servicio (research R7).

const urlDeImagen = (imagenId) => (imagenId ? `/imagenes/${imagenId}` : null);

/** `consultaNoLeida` lo calcula comprasService (feature 007, FR-023): el DTO no lee repositorios. */
export function aCompraDto(compra, evento, organizador, ahora, { consultaNoLeida = false } = {}) {
  const motivo = motivoNoCancelable(compra, evento, ahora);
  return {
    numero: compra.numero,
    estado: compra.estado,
    cantidad: compra.cantidad,
    monto: compra.monto,
    medioDePago: compra.medioDePago,
    creadaEn: compra.creadaEn,
    tipoDeEntrada: { id: compra.tipoDeEntradaId, nombre: compra.tipoDeEntradaNombre, precioUnitario: compra.precioUnitario },
    evento: {
      id: evento.id,
      nombre: evento.nombre,
      fechaHora: evento.fechaHora,
      ubicacion: evento.ubicacion,
      imagenUrl: urlDeImagen(evento.imagenId),
      organizador: { id: organizador.id, nombre: organizador.nombre },
    },
    diasParaEvento: diasParaEvento(compra, evento, ahora),
    calificacion: compra.calificacion
      ? { puntaje: compra.calificacion.puntaje, comentario: compra.calificacion.comentario, calificadaEn: compra.calificacion.calificadaEn }
      : null,
    acciones: { completarPago: puedeCompletarPago(compra, evento, ahora), cancelar: motivo === null },
    motivoNoCancelable: motivo,
    consultaNoLeida,
  };
}
