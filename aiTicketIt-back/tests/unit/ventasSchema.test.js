import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ventasSchema } from "../../schemas/ventasSchema.js";

// specs/005-panel-evento/data-model.md § Validaciones de entrada (estado, cursor).

const mensajes = (resultado) => resultado.error.issues.map((i) => i.message);

describe("ventasSchema", () => {
  it("sin parámetros: estado y cursor null", () => {
    assert.deepEqual(ventasSchema.parse({}), { estado: null, cursor: null });
  });

  it("estado y cursor vacíos → null", () => {
    assert.deepEqual(ventasSchema.parse({ estado: "", cursor: "" }), { estado: null, cursor: null });
  });

  for (const estado of ["Pendiente de pago", "Confirmada", "Utilizada", "Cancelada", "Reembolsada"]) {
    it(`acepta "${estado}"`, () => assert.equal(ventasSchema.parse({ estado }).estado, estado));
  }

  it('rechaza "Confirmadas" con "Elegí un estado válido"', () => {
    const resultado = ventasSchema.safeParse({ estado: "Confirmadas" });
    assert.equal(resultado.success, false);
    assert.deepEqual(mensajes(resultado), ["Elegí un estado válido"]);
  });

  it("deja pasar el cursor como texto", () => {
    assert.equal(ventasSchema.parse({ cursor: "abc" }).cursor, "abc");
  });
});
