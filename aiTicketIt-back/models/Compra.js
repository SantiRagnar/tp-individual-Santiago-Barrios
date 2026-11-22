/**
 * Ver specs/003-explorar-detalle-evento/data-model.md § Compra y § Calificacion (research R7).
 * Versión mínima: en la feature 003 solo existen las del seed y solo se leen. La calificación se
 * guarda en la compra, como indica el design system.
 */
export class Compra {
  constructor({
    numero,
    compradorId,
    eventoId,
    tipoDeEntradaId,
    cantidad,
    monto,
    medioDePago,
    estado,
    creadaEn,
    calificacion = null,
  }) {
    this.numero = numero;
    this.compradorId = compradorId;
    this.eventoId = eventoId;
    this.tipoDeEntradaId = tipoDeEntradaId;
    this.cantidad = cantidad;
    this.monto = monto;
    this.medioDePago = medioDePago;
    this.estado = estado;
    this.creadaEn = creadaEn;
    this.calificacion = calificacion ? new Calificacion(calificacion) : null;
  }
}

export class Calificacion {
  constructor({ puntaje, comentario = null, calificadaEn }) {
    this.puntaje = puntaje;
    this.comentario = comentario;
    this.calificadaEn = calificadaEn;
  }
}
