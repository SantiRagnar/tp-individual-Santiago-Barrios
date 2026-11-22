import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diasParaEvento, estadoTrasCancelar, motivoNoCancelable, puedeCompletarPago } from "../../services/reglasCompra.js";
import { HOY } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras/data-model.md § Transiciones y § Valores derivados (research R7).
const HAMLET = { fechaHora: "2026-11-21T21:00:00-03:00" };
const PASADO = { fechaHora: "2026-10-18T21:00:00-03:00" };
const compra = (estado) => ({ estado });
const horasAntes = (evento, horas) => new Date(new Date(evento.fechaHora).getTime() - horas * 3_600_000);

describe("reglasCompra.puedeCompletarPago", () => {
  it("solo una Pendiente de pago con el evento futuro", () => {
    assert.equal(puedeCompletarPago(compra("Pendiente de pago"), HAMLET, HOY), true);
    assert.equal(puedeCompletarPago(compra("Pendiente de pago"), PASADO, HOY), false);
    for (const estado of ["Confirmada", "Utilizada", "Cancelada", "Reembolsada"]) {
      assert.equal(puedeCompletarPago(compra(estado), HAMLET, HOY), false, estado);
    }
  });

  it("si el evento empieza justo ahora ya no se puede", () => {
    assert.equal(puedeCompletarPago(compra("Pendiente de pago"), HAMLET, new Date(HAMLET.fechaHora)), false);
  });
});

describe("reglasCompra.motivoNoCancelable", () => {
  it("null para Pendiente o Confirmada con el evento futuro", () => {
    assert.equal(motivoNoCancelable(compra("Pendiente de pago"), HAMLET, HOY), null);
    assert.equal(motivoNoCancelable(compra("Confirmada"), HAMLET, HOY), null);
  });

  it("el motivo según el estado", () => {
    assert.equal(motivoNoCancelable(compra("Utilizada"), HAMLET, HOY), "UTILIZADA");
    assert.equal(motivoNoCancelable(compra("Reembolsada"), HAMLET, HOY), "REEMBOLSADA");
    assert.equal(motivoNoCancelable(compra("Cancelada"), HAMLET, HOY), "CANCELADA");
  });

  it("EVENTO_REALIZADO para Pendiente o Confirmada de un evento que ya ocurrió", () => {
    assert.equal(motivoNoCancelable(compra("Pendiente de pago"), PASADO, HOY), "EVENTO_REALIZADO");
    assert.equal(motivoNoCancelable(compra("Confirmada"), PASADO, HOY), "EVENTO_REALIZADO");
    assert.equal(motivoNoCancelable(compra("Confirmada"), HAMLET, new Date(HAMLET.fechaHora)), "EVENTO_REALIZADO");
  });

  it("el estado tiene prioridad sobre la fecha: una Utilizada de un evento pasado da UTILIZADA", () => {
    assert.equal(motivoNoCancelable(compra("Utilizada"), PASADO, HOY), "UTILIZADA");
    assert.equal(motivoNoCancelable(compra("Reembolsada"), PASADO, HOY), "REEMBOLSADA");
  });
});

describe("reglasCompra.estadoTrasCancelar", () => {
  it("Confirmada → Reembolsada y Pendiente de pago → Cancelada", () => {
    assert.equal(estadoTrasCancelar(compra("Confirmada")), "Reembolsada");
    assert.equal(estadoTrasCancelar(compra("Pendiente de pago")), "Cancelada");
  });
});

describe("reglasCompra.diasParaEvento", () => {
  it("días hasta el evento redondeando hacia arriba", () => {
    assert.equal(diasParaEvento(compra("Confirmada"), HAMLET, HOY), 13);
    assert.equal(diasParaEvento(compra("Confirmada"), HAMLET, horasAntes(HAMLET, 25)), 2);
    assert.equal(diasParaEvento(compra("Confirmada"), HAMLET, horasAntes(HAMLET, 24)), 1);
    assert.equal(diasParaEvento(compra("Confirmada"), HAMLET, horasAntes(HAMLET, 1)), 1);
  });

  it("null si el evento ya pasó o la compra no está Confirmada", () => {
    assert.equal(diasParaEvento(compra("Confirmada"), PASADO, HOY), null);
    assert.equal(diasParaEvento(compra("Confirmada"), HAMLET, new Date(HAMLET.fechaHora)), null);
    for (const estado of ["Pendiente de pago", "Utilizada", "Cancelada", "Reembolsada"]) {
      assert.equal(diasParaEvento(compra(estado), HAMLET, HOY), null, estado);
    }
  });
});
