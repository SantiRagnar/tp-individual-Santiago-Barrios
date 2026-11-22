import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aVentaDto } from "../../dto/ventaDto.js";

// specs/005-panel-evento/data-model.md § Venta (research R7).

const evento = {
  id: "evt-1",
  fechaHora: "2026-11-21T21:00:00-03:00",
  tiposDeEntrada: [
    { id: "tip-2", nombre: "Platea" },
    { id: "tip-x", nombre: null },
  ],
};
const compra = {
  numero: "A-1042",
  compradorId: "cmp-1",
  eventoId: "evt-1",
  tipoDeEntradaId: "tip-2",
  cantidad: 2,
  monto: 36000,
  medioDePago: "Tarjeta de crédito",
  estado: "Confirmada",
  creadaEn: "2026-11-06T19:20:00-03:00",
};
const sofia = { id: "cmp-1", nombre: "Sofía", apellido: "Gómez", email: "sofia.gomez@correo.com" };
const ANTES = new Date("2026-11-09T12:00:00-03:00");
const EL_DIA = new Date("2026-11-21T10:00:00-03:00");

describe("aVentaDto", () => {
  it("arma la fila con los campos del contrato", () => {
    assert.deepEqual(aVentaDto(compra, { comprador: sofia, evento, ahora: ANTES }), {
      numero: "A-1042",
      comprador: { nombre: "Sofía Gómez" },
      tipoDeEntrada: { id: "tip-2", nombre: "Platea" },
      cantidad: 2,
      estado: "Confirmada",
      medioDePago: "Tarjeta de crédito",
      monto: 36000,
      creadaEn: "2026-11-06T19:20:00-03:00",
      acciones: { marcarUtilizada: false },
    });
  });

  it("no expone el email ni el compradorId cuando hay nombre", () => {
    const texto = JSON.stringify(aVentaDto(compra, { comprador: sofia, evento, ahora: ANTES }));
    assert.ok(!texto.includes("sofia.gomez@correo.com"));
    assert.ok(!texto.includes("cmp-1"));
  });

  it("sin nombre usa el email", () => {
    const sinNombre = { ...sofia, nombre: null, apellido: null };
    assert.equal(aVentaDto(compra, { comprador: sinNombre, evento, ahora: ANTES }).comprador.nombre, "sofia.gomez@correo.com");
  });

  it("un tipo sin nombre devuelve nombre null", () => {
    const dto = aVentaDto({ ...compra, tipoDeEntradaId: "tip-x" }, { comprador: sofia, evento, ahora: ANTES });
    assert.deepEqual(dto.tipoDeEntrada, { id: "tip-x", nombre: null });
  });

  it("acciones.marcarUtilizada es true para una Confirmada el día del evento y false si no está Confirmada", () => {
    assert.equal(aVentaDto(compra, { comprador: sofia, evento, ahora: EL_DIA }).acciones.marcarUtilizada, true);
    const pendiente = { ...compra, estado: "Pendiente de pago" };
    assert.equal(aVentaDto(pendiente, { comprador: sofia, evento, ahora: EL_DIA }).acciones.marcarUtilizada, false);
  });
});
