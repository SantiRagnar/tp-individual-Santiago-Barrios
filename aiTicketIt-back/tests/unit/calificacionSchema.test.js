import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calificacionSchema } from "../../schemas/calificacionSchema.js";

// specs/006-calificaciones-opiniones/data-model.md § Calificación (puntaje, comentario) y
// § Validaciones de entrada (research R5).
const validar = (body) => calificacionSchema.safeParse(body);
const mensajeDe = (resultado, campo) => resultado.error.issues.find((i) => i.path[0] === campo)?.message;

describe("calificacionSchema · puntaje", () => {
  it("acepta 1 y 5", () => {
    assert.equal(validar({ puntaje: 1 }).data.puntaje, 1);
    assert.equal(validar({ puntaje: 5 }).data.puntaje, 5);
  });

  it("rechaza 0, 6, 4.5, texto y ausente con 'Elegí de 1 a 5 estrellas'", () => {
    for (const body of [{ puntaje: 0 }, { puntaje: 6 }, { puntaje: 4.5 }, { puntaje: "5" }, {}]) {
      const resultado = validar(body);
      assert.equal(resultado.success, false, JSON.stringify(body));
      assert.equal(mensajeDe(resultado, "puntaje"), "Elegí de 1 a 5 estrellas", JSON.stringify(body));
    }
  });
});

describe("calificacionSchema · comentario", () => {
  it("ausente, null, vacío o solo espacios → null", () => {
    for (const body of [{ puntaje: 3 }, { puntaje: 3, comentario: null }, { puntaje: 3, comentario: "" }, { puntaje: 3, comentario: "   " }]) {
      assert.equal(validar(body).data.comentario, null, JSON.stringify(body));
    }
  });

  it("recorta los espacios del principio y del final", () => {
    assert.equal(validar({ puntaje: 3, comentario: "  hola  " }).data.comentario, "hola");
  });

  it("el límite de 500 se cuenta después de recortar", () => {
    const quinientos = "a".repeat(500);
    assert.equal(validar({ puntaje: 3, comentario: `  ${quinientos}  ` }).data.comentario, quinientos);

    const resultado = validar({ puntaje: 3, comentario: "a".repeat(501) });
    assert.equal(resultado.success, false);
    assert.equal(mensajeDe(resultado, "comentario"), "El comentario puede tener hasta 500 caracteres");
  });

  it("rechaza un comentario que no es texto", () => {
    assert.equal(validar({ puntaje: 3, comentario: 7 }).success, false);
  });
});

describe("calificacionSchema · forma", () => {
  it("rechaza campos que no corresponden a una calificación", () => {
    const resultado = validar({ puntaje: 3, autor: "Sofía" });
    assert.equal(resultado.success, false);
    assert.equal(resultado.error.issues[0].message, "Hay datos que no corresponden a una calificación");
  });
});
