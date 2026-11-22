/**
 * Ver specs/004-compra-pago-mis-compras/data-model.md § Compra (y la 003 para § Calificacion).
 * `tipoDeEntradaNombre` y `precioUnitario` son una copia del tipo al pagar (research R6): la compra sigue
 * diciendo qué se compró aunque el organizador renombre o borre el tipo. La calificación se guarda en la
 * compra, como indica el design system.
 */
export class Compra {
  constructor({
    numero,
    compradorId,
    eventoId,
    tipoDeEntradaId,
    tipoDeEntradaNombre = null,
    precioUnitario = null,
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
    this.tipoDeEntradaNombre = tipoDeEntradaNombre;
    this.precioUnitario = precioUnitario;
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
