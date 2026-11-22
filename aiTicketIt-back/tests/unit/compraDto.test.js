import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aCompraDto } from "../../dto/compraDto.js";
import { Compra } from "../../models/Compra.js";
import { HOY } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras/contracts/compras.openapi.yaml § Compra (research R6, R7).
const ORGANIZADOR = { id: "org-1", nombre: "Compañía La Trama" };
const evento = (cambios = {}) => ({
  id: "evt-1",
  nombre: "Hamlet en el Galpón",
  fechaHora: "2026-11-21T21:00:00-03:00",
  ubicacion: "Galpón de Guevara, Chacarita",
  imagenId: "img-seed-hamlet",
  tiposDeEntrada: [{ id: "tip-2", nombre: "Platea", cupo: 80, precio: 18000, vendidas: 68 }],
  ...cambios,
});
const compra = (cambios = {}) =>
  new Compra({
    numero: "A-1042",
    compradorId: "cmp-1",
    eventoId: "evt-1",
    tipoDeEntradaId: "tip-2",
    tipoDeEntradaNombre: "Platea",
    precioUnitario: 18000,
    cantidad: 2,
    monto: 36000,
    medioDePago: "Tarjeta de crédito",
    estado: "Confirmada",
    creadaEn: "2026-11-06T19:20:00-03:00",
    ...cambios,
  });

describe("aCompraDto", () => {
  it("arma la vista completa con los datos actuales del evento", () => {
    assert.deepEqual(aCompraDto(compra(), evento(), ORGANIZADOR, HOY), {
      numero: "A-1042",
      estado: "Confirmada",
      cantidad: 2,
      monto: 36000,
      medioDePago: "Tarjeta de crédito",
      creadaEn: "2026-11-06T19:20:00-03:00",
      tipoDeEntrada: { id: "tip-2", nombre: "Platea", precioUnitario: 18000 },
      evento: {
        id: "evt-1",
        nombre: "Hamlet en el Galpón",
        fechaHora: "2026-11-21T21:00:00-03:00",
        ubicacion: "Galpón de Guevara, Chacarita",
        imagenUrl: "/imagenes/img-seed-hamlet",
        organizador: { id: "org-1", nombre: "Compañía La Trama" },
      },
      diasParaEvento: 13,
      calificacion: null,
      acciones: { completarPago: false, cancelar: true, calificar: false },
      motivoNoCancelable: null,
      motivoNoCalificable: "NO_UTILIZADA",
    });
  });

  it("el tipo de entrada sale de la copia de la compra aunque el evento lo haya renombrado o borrado", () => {
    const renombrado = evento({ tiposDeEntrada: [{ id: "tip-2", nombre: "Platea alta", cupo: 80, precio: 20000, vendidas: 0 }] });
    assert.deepEqual(aCompraDto(compra(), renombrado, ORGANIZADOR, HOY).tipoDeEntrada, { id: "tip-2", nombre: "Platea", precioUnitario: 18000 });
    const sinTipos = evento({ tiposDeEntrada: [] });
    assert.equal(aCompraDto(compra(), sinTipos, ORGANIZADOR, HOY).tipoDeEntrada.nombre, "Platea");
  });

  it("acciones, motivo y cuenta regresiva salen de reglasCompra con el ahora recibido", () => {
    const pendiente = aCompraDto(compra({ estado: "Pendiente de pago" }), evento(), ORGANIZADOR, HOY);
    assert.deepEqual(pendiente.acciones, { completarPago: true, cancelar: true, calificar: false });
    assert.equal(pendiente.diasParaEvento, null);

    const despues = aCompraDto(compra(), evento(), ORGANIZADOR, new Date("2026-11-22T10:00:00-03:00"));
    assert.deepEqual(despues.acciones, { completarPago: false, cancelar: false, calificar: false });
    assert.equal(despues.motivoNoCancelable, "EVENTO_REALIZADO");
    assert.equal(despues.diasParaEvento, null);
  });

  it("la calificación viaja con puntaje, comentario y fecha", () => {
    const calificacion = { puntaje: 4, comentario: "Muy buena", calificadaEn: "2026-09-13T18:00:00-03:00" };
    const dto = aCompraDto(compra({ estado: "Utilizada", calificacion }), evento(), ORGANIZADOR, HOY);
    assert.deepEqual(dto.calificacion, calificacion);
    assert.equal(dto.motivoNoCancelable, "UTILIZADA");
  });

  it("imagenUrl es null si el evento no tiene imagen", () => {
    assert.equal(aCompraDto(compra(), evento({ imagenId: null }), ORGANIZADOR, HOY).evento.imagenUrl, null);
  });

  // specs/006-calificaciones-opiniones/data-model.md § Vista Compra (acciones.calificar, motivoNoCalificable).
  it("acciones.calificar y motivoNoCalificable salen de reglasCalificacion", () => {
    const sinCalificar = aCompraDto(compra({ estado: "Utilizada" }), evento(), ORGANIZADOR, HOY);
    assert.equal(sinCalificar.acciones.calificar, true);
    assert.equal(sinCalificar.motivoNoCalificable, null);

    const calificacion = { puntaje: 4, comentario: null, calificadaEn: "2026-09-13T18:00:00-03:00" };
    const calificada = aCompraDto(compra({ estado: "Utilizada", calificacion }), evento(), ORGANIZADOR, HOY);
    assert.equal(calificada.acciones.calificar, false);
    assert.equal(calificada.motivoNoCalificable, "YA_CALIFICADA");

    const confirmada = aCompraDto(compra(), evento(), ORGANIZADOR, HOY);
    assert.equal(confirmada.acciones.calificar, false);
    assert.equal(confirmada.motivoNoCalificable, "NO_UTILIZADA");
  });
});
