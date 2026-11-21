import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eventoSchema } from "../../schemas/eventoSchema.js";

const errores = (body) => {
  const r = eventoSchema.safeParse(body);
  assert.equal(r.success, false, "debería fallar");
  return r.error.issues.map((i) => i.path.join("."));
};

describe("eventoSchema — solo forma (research R4; data-model.md § Validaciones de entrada)", () => {
  it("{ estado: 'Borrador' } es válido y completa los arrays vacíos", () => {
    const r = eventoSchema.safeParse({ estado: "Borrador" });
    assert.equal(r.success, true);
    assert.deepEqual(r.data.materialMultimedia, []);
    assert.deepEqual(r.data.tiposDeEntrada, []);
  });

  it("recorta los textos y convierte los vacíos en null", () => {
    const r = eventoSchema.parse({
      estado: "Borrador",
      nombre: "  Hamlet  ",
      descripcion: "   ",
      ubicacion: "",
      tiposDeEntrada: [{ nombre: "  Platea ", cupo: null, precio: 0 }],
    });
    assert.equal(r.nombre, "Hamlet");
    assert.equal(r.descripcion, null);
    assert.equal(r.ubicacion, null);
    assert.equal(r.tiposDeEntrada[0].nombre, "Platea");
    assert.equal(r.tiposDeEntrada[0].precio, 0);
  });

  it("acepta un evento completo con fecha ISO con offset", () => {
    const r = eventoSchema.safeParse({
      estado: "Publicado",
      nombre: "Las brujas de Salem",
      categoria: "Drama",
      fechaHora: "2026-12-19T21:00:00-03:00",
      ubicacion: "Galpón de Guevara",
      imagenId: "img-seed-hamlet",
      materialMultimedia: [{ nombre: "trailer.mp4", tipo: "video" }],
      tiposDeEntrada: [{ id: "tip-1", nombre: "General", cupo: 120, precio: 13000 }],
    });
    assert.equal(r.success, true);
  });

  it("exige estado Borrador o Publicado", () => {
    assert.deepEqual(errores({}), ["estado"]);
    assert.deepEqual(errores({ estado: "Finalizado" }), ["estado"]);
  });

  it("rechaza una categoría fuera de la lista", () => {
    assert.deepEqual(errores({ estado: "Borrador", categoria: "Rock" }), ["categoria"]);
  });

  it("rechaza cupo y precio no enteros", () => {
    assert.deepEqual(errores({ estado: "Borrador", tiposDeEntrada: [{ cupo: 1.5 }] }), ["tiposDeEntrada.0.cupo"]);
    assert.deepEqual(errores({ estado: "Borrador", tiposDeEntrada: [{ precio: "100" }] }), ["tiposDeEntrada.0.precio"]);
  });

  it("rechaza una fecha sin offset", () => {
    assert.deepEqual(errores({ estado: "Borrador", fechaHora: "2026-12-19T21:00:00" }), ["fechaHora"]);
    assert.deepEqual(errores({ estado: "Borrador", fechaHora: "mañana" }), ["fechaHora"]);
  });

  it("rechaza largos mayores a los de data-model.md", () => {
    assert.deepEqual(errores({ estado: "Borrador", nombre: "a".repeat(121) }), ["nombre"]); // Evento.nombre
    assert.deepEqual(errores({ estado: "Borrador", descripcion: "a".repeat(2001) }), ["descripcion"]); // Evento.descripcion
    assert.deepEqual(errores({ estado: "Borrador", ubicacion: "a".repeat(201) }), ["ubicacion"]); // Evento.ubicacion
    assert.deepEqual(errores({ estado: "Borrador", tiposDeEntrada: [{ nombre: "a".repeat(61) }] }), [
      "tiposDeEntrada.0.nombre",
    ]); // TipoDeEntrada.nombre
    assert.deepEqual(errores({ estado: "Borrador", materialMultimedia: [{ nombre: "a".repeat(201), tipo: "foto" }] }), [
      "materialMultimedia.0.nombre",
    ]); // MaterialMultimedia.nombre
    assert.deepEqual(errores({ estado: "Borrador", materialMultimedia: [{ nombre: "x.pdf", tipo: "pdf" }] }), [
      "materialMultimedia.0.tipo",
    ]); // MaterialMultimedia.tipo
  });

  it("acepta los largos máximos exactos", () => {
    const r = eventoSchema.safeParse({ estado: "Borrador", nombre: "a".repeat(120), ubicacion: "b".repeat(200) });
    assert.equal(r.success, true);
  });
});
