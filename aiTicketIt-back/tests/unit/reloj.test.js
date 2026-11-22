import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ahora, fijarAhora, fijarAhoraDesdeEntorno } from "../../services/reloj.js";

// specs/004-compra-pago-mis-compras/research.md R15: FECHA_SIMULADA para la validación manual.
afterEach(() => fijarAhora(null));

describe("fijarAhoraDesdeEntorno (FECHA_SIMULADA)", () => {
  it("sin valor no fija nada y devuelve null", () => {
    for (const valor of [undefined, ""]) {
      const antes = Date.now();
      assert.equal(fijarAhoraDesdeEntorno(valor), null);
      const momento = ahora().getTime();
      assert.ok(momento >= antes && momento <= Date.now() + 5, "sigue el reloj real");
    }
  });

  it("con una fecha ISO válida fija el reloj y devuelve el ISO", () => {
    const iso = fijarAhoraDesdeEntorno("2026-11-09T12:00:00-03:00");
    assert.equal(iso, "2026-11-09T15:00:00.000Z");
    assert.equal(ahora().toISOString(), "2026-11-09T15:00:00.000Z");
  });

  it("con un valor inválido lanza un error que nombra FECHA_SIMULADA y no cambia el reloj", () => {
    for (const valor of ["mañana", "2026-13-40"]) {
      assert.throws(() => fijarAhoraDesdeEntorno(valor), (error) => error instanceof Error && /FECHA_SIMULADA/.test(error.message));
      assert.ok(Math.abs(ahora().getTime() - Date.now()) < 50, "sigue el reloj real");
    }
  });
});
