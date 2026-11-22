import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { motivoNoCalificable, puedeCalificar } from "../../services/reglasCalificacion.js";

// specs/006-calificaciones-opiniones/data-model.md § Valores derivados (research R3).
const CALIFICACION = { puntaje: 4, comentario: null, calificadaEn: "2026-09-13T18:00:00-03:00" };
const compra = (estado, calificacion = null) => ({ numero: "A-0871", estado, calificacion });

describe("reglasCalificacion", () => {
  it("una Utilizada sin calificar se puede calificar", () => {
    assert.equal(motivoNoCalificable(compra("Utilizada")), null);
    assert.equal(puedeCalificar(compra("Utilizada")), true);
  });

  it("una Utilizada ya calificada → YA_CALIFICADA", () => {
    assert.equal(motivoNoCalificable(compra("Utilizada", CALIFICACION)), "YA_CALIFICADA");
    assert.equal(puedeCalificar(compra("Utilizada", CALIFICACION)), false);
  });

  it("cualquier otro estado → NO_UTILIZADA", () => {
    for (const estado of ["Pendiente de pago", "Confirmada", "Cancelada", "Reembolsada"]) {
      assert.equal(motivoNoCalificable(compra(estado)), "NO_UTILIZADA", estado);
      assert.equal(puedeCalificar(compra(estado)), false, estado);
    }
  });

  it("ya calificada se verifica antes que el estado", () => {
    assert.equal(motivoNoCalificable(compra("Confirmada", CALIFICACION)), "YA_CALIFICADA");
  });

  it("no depende de la fecha: las funciones reciben solo la compra (sin plazo, Clarifications)", () => {
    assert.equal(motivoNoCalificable.length, 1);
    assert.equal(puedeCalificar.length, 1);
  });
});
