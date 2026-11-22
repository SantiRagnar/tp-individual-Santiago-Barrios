import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { consultaQuerySchema, mensajeSchema } from "../../schemas/mensajeSchema.js";

// specs/007-consultas-chat/data-model.md Mensaje.texto; research R7. FR-002, FR-003.

const mensajeDe = (resultado) => resultado.error.issues[0].message;

describe("mensajeSchema", () => {
  it("recorta los extremos y conserva los saltos de línea internos", () => {
    const r = mensajeSchema.safeParse({ texto: "  Hola\n¿a qué hora abren?  " });
    assert.equal(r.success, true);
    assert.equal(r.data.texto, "Hola\n¿a qué hora abren?");
  });

  it("vacío, solo espacios o sin texto → 'Escribí un mensaje'", () => {
    for (const body of [{ texto: "" }, { texto: "   \n " }, {}]) {
      const r = mensajeSchema.safeParse(body);
      assert.equal(r.success, false);
      assert.equal(mensajeDe(r), "Escribí un mensaje");
    }
  });

  it("1000 caracteres pasa y 1001 no", () => {
    assert.equal(mensajeSchema.safeParse({ texto: "a".repeat(1000) }).success, true);
    const r = mensajeSchema.safeParse({ texto: "a".repeat(1001) });
    assert.equal(r.success, false);
    assert.equal(mensajeDe(r), "El mensaje puede tener hasta 1000 caracteres");
  });

  it("el largo se mide después de recortar", () => {
    assert.equal(mensajeSchema.safeParse({ texto: ` ${"a".repeat(1000)} ` }).success, true);
  });

  it("rechaza campos extra (el autor lo pone el servidor)", () => {
    assert.equal(mensajeSchema.safeParse({ texto: "hola", autor: "organizador" }).success, false);
  });
});

describe("consultaQuerySchema", () => {
  it("despuesDe es opcional", () => {
    assert.deepEqual(consultaQuerySchema.parse({}), {});
    assert.equal(consultaQuerySchema.parse({ despuesDe: "msj-3" }).despuesDe, "msj-3");
  });

  it("despuesDe vacío es inválido", () => {
    assert.equal(consultaQuerySchema.safeParse({ despuesDe: "" }).success, false);
  });
});
