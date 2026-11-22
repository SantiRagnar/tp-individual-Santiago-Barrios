import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { explorarSchema, resenasSchema } from "../../schemas/explorarSchema.js";

// data-model.md § Validaciones de entrada (busqueda, categoria, orden, cursor).
const errores = (query) =>
  explorarSchema.safeParse(query).error?.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })) ?? [];

describe("explorarSchema", () => {
  it("sin parámetros: orden fecha, sin búsqueda, categoría ni cursor", () => {
    assert.deepEqual(explorarSchema.parse({}), { orden: "fecha", busqueda: null, categoria: null, cursor: null });
  });

  it("acepta los valores válidos", () => {
    const datos = explorarSchema.parse({ orden: "puntaje", busqueda: "galpon", categoria: "Teatro", cursor: "abc" });
    assert.deepEqual(datos, { orden: "puntaje", busqueda: "galpon", categoria: "Teatro", cursor: "abc" });
  });

  it("recorta la búsqueda; solo espacios equivale a sin búsqueda", () => {
    assert.equal(explorarSchema.parse({ busqueda: "  galpon  " }).busqueda, "galpon");
    assert.equal(explorarSchema.parse({ busqueda: "   " }).busqueda, null);
  });

  it("categoría fuera de la lista → Elegí una categoría válida", () => {
    assert.deepEqual(errores({ categoria: "Rock" }), [{ campo: "categoria", mensaje: "Elegí una categoría válida" }]);
  });

  it("orden inválido → Elegí un orden válido", () => {
    assert.deepEqual(errores({ orden: "nombre" }), [{ campo: "orden", mensaje: "Elegí un orden válido" }]);
  });

  it("búsqueda de más de 100 caracteres → La búsqueda puede tener hasta 100 caracteres", () => {
    assert.deepEqual(errores({ busqueda: "a".repeat(101) }), [
      { campo: "busqueda", mensaje: "La búsqueda puede tener hasta 100 caracteres" },
    ]);
  });

  it("un parámetro repetido (array) se rechaza", () => {
    assert.equal(errores({ orden: ["fecha", "precio"] })[0].campo, "orden");
  });
});

describe("resenasSchema", () => {
  it("cursor opcional", () => {
    assert.deepEqual(resenasSchema.parse({}), { cursor: null });
    assert.deepEqual(resenasSchema.parse({ cursor: "abc" }), { cursor: "abc" });
  });
});
