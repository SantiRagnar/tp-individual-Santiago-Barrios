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
      acciones: { completarPago: false, cancelar: true },
      motivoNoCancelable: null,
      consultaNoLeida: false,
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
    assert.deepEqual(pendiente.acciones, { completarPago: true, cancelar: true });
    assert.equal(pendiente.diasParaEvento, null);

    const despues = aCompraDto(compra(), evento(), ORGANIZADOR, new Date("2026-11-22T10:00:00-03:00"));
    assert.deepEqual(despues.acciones, { completarPago: false, cancelar: false });
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
});

// specs/007-consultas-chat (FR-023, research R6): el DTO recibe `consultaNoLeida` ya calculado por el servicio.
describe("aCompraDto · consultaNoLeida (feature 007)", () => {
  it("es false por defecto y refleja el valor que le pasan", () => {
    assert.equal(aCompraDto(compra(), evento(), ORGANIZADOR, HOY).consultaNoLeida, false);
    assert.equal(aCompraDto(compra(), evento(), ORGANIZADOR, HOY, { consultaNoLeida: true }).consultaNoLeida, true);
  });
});
