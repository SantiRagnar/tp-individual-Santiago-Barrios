import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { esActiva, inicioDelDiaEnArgentina, puedeMarcarUtilizada } from "../../services/reglasVenta.js";

// specs/005-panel-evento/data-model.md § Compra · Valores derivados y Transición nueva (research R4).

const HAMLET = { fechaHora: "2026-11-21T21:00:00-03:00" };
const confirmada = { estado: "Confirmada" };

describe("inicioDelDiaEnArgentina", () => {
  it("evento a las 21:00 −03:00 → 00:00 −03:00 del mismo día", () => {
    assert.equal(inicioDelDiaEnArgentina("2026-11-21T21:00:00-03:00").toISOString(), new Date("2026-11-21T00:00:00-03:00").toISOString());
  });

  it("evento a las 00:30 −03:00 → ese mismo día", () => {
    assert.equal(inicioDelDiaEnArgentina("2026-11-21T00:30:00-03:00").toISOString(), new Date("2026-11-21T00:00:00-03:00").toISOString());
  });

  it("instante en UTC: 2026-11-22T01:00Z es el 21/11 a las 22:00 en Argentina", () => {
    assert.equal(inicioDelDiaEnArgentina("2026-11-22T01:00:00Z").toISOString(), new Date("2026-11-21T00:00:00-03:00").toISOString());
  });
});

describe("esActiva", () => {
  for (const [estado, esperado] of [
    ["Pendiente de pago", true],
    ["Confirmada", true],
    ["Utilizada", true],
    ["Cancelada", false],
    ["Reembolsada", false],
  ]) {
    it(`${estado} → ${esperado}`, () => assert.equal(esActiva({ estado }), esperado));
  }
});

describe("puedeMarcarUtilizada", () => {
  it("Confirmada a las 23:59 del día anterior → false", () => {
    assert.equal(puedeMarcarUtilizada(confirmada, HAMLET, new Date("2026-11-20T23:59:00-03:00")), false);
  });

  it("Confirmada a las 00:00 del día del evento → true", () => {
    assert.equal(puedeMarcarUtilizada(confirmada, HAMLET, new Date("2026-11-21T00:00:00-03:00")), true);
  });

  it("Confirmada una semana después del evento → true", () => {
    assert.equal(puedeMarcarUtilizada(confirmada, HAMLET, new Date("2026-11-28T12:00:00-03:00")), true);
  });

  for (const estado of ["Pendiente de pago", "Utilizada", "Cancelada", "Reembolsada"]) {
    it(`${estado} el día del evento → false`, () => {
      assert.equal(puedeMarcarUtilizada({ estado }, HAMLET, new Date("2026-11-21T12:00:00-03:00")), false);
    });
  }

  it("evento sin fechaHora → false", () => {
    assert.equal(puedeMarcarUtilizada(confirmada, { fechaHora: null }, new Date("2026-11-21T12:00:00-03:00")), false);
  });
});
