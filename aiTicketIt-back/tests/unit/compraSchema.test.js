import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compraSchema } from "../../schemas/compraSchema.js";
import { cuerpoDeCompra } from "../helpers/compras.js";

// specs/004-compra-pago-mis-compras/data-model.md § Validaciones de entrada (solo forma).
const errores = (body) =>
  compraSchema.safeParse(body).error?.issues.map((i) => ({ campo: i.path.join(".") || "body", mensaje: i.message })) ?? [];

describe("compraSchema", () => {
  it("un body válido pasa sin cambios", () => {
    assert.deepEqual(compraSchema.parse(cuerpoDeCompra()), cuerpoDeCompra());
  });

  it("acepta una entrada gratuita (precioUnitario 0) y los 4 medios de pago", () => {
    for (const medioDePago of ["Tarjeta de crédito", "Tarjeta de débito", "Mercado Pago", "Transferencia"]) {
      assert.equal(compraSchema.safeParse(cuerpoDeCompra({ medioDePago, precioUnitario: 0 })).success, true, medioDePago);
    }
  });

  it("sin evento o sin tipo de entrada", () => {
    assert.deepEqual(errores(cuerpoDeCompra({ eventoId: "" })), [{ campo: "eventoId", mensaje: "Indicá el evento" }]);
    const { tipoDeEntradaId, ...sinTipo } = cuerpoDeCompra();
    assert.deepEqual(errores(sinTipo), [{ campo: "tipoDeEntradaId", mensaje: "Elegí un tipo de entrada" }]);
  });

  it("cantidad fuera de 1 a 10, no entera o texto", () => {
    for (const cantidad of [0, 11, 1.5, "2", -1]) {
      assert.deepEqual(errores(cuerpoDeCompra({ cantidad })), [{ campo: "cantidad", mensaje: "La cantidad tiene que ser de 1 a 10" }], String(cantidad));
    }
  });

  it("medio de pago fuera de los 4", () => {
    assert.deepEqual(errores(cuerpoDeCompra({ medioDePago: "Efectivo" })), [{ campo: "medioDePago", mensaje: "Elegí un medio de pago" }]);
  });

  it("precio unitario negativo o no entero", () => {
    for (const precioUnitario of [-1, 10.5, undefined]) {
      assert.deepEqual(
        errores(cuerpoDeCompra({ precioUnitario })),
        [{ campo: "precioUnitario", mensaje: "Indicá el precio de la entrada" }],
        String(precioUnitario),
      );
    }
  });

  it("rechaza campos extra: el pago es simulado y no recibe datos de tarjeta ni monto (FR-008)", () => {
    assert.equal(compraSchema.safeParse(cuerpoDeCompra({ numeroDeTarjeta: "4111111111111111" })).success, false);
    assert.equal(compraSchema.safeParse(cuerpoDeCompra({ monto: 1 })).success, false);
  });
});
