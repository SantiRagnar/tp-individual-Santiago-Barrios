import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { validar } from "../../middlewares/validar.js";
import { validarQuery } from "../../middlewares/validarQuery.js";
import { DatosInvalidos } from "../../errors/ErrorDeDominio.js";

/** Corre el middleware y devuelve el error que pasa a next() (o undefined). */
function correr(schema, body) {
  const req = { body };
  let recibido;
  validar(schema)(req, {}, (error) => {
    recibido = error;
  });
  return { req, error: recibido };
}

const schemaTipos = z.object({
  tiposDeEntrada: z.array(z.object({ cupo: z.number({ error: "El cupo tiene que ser un número" }) })),
});

describe("validar (research R5)", () => {
  it("un error dentro de un array sale con la ruta completa unida por puntos", () => {
    const { error } = correr(schemaTipos, { tiposDeEntrada: [{ cupo: 1 }, { cupo: "x" }] });
    assert.ok(error instanceof DatosInvalidos);
    assert.deepEqual(error.campos, [{ campo: "tiposDeEntrada.1.cupo", mensaje: "El cupo tiene que ser un número" }]);
  });

  it("un campo plano sale igual que antes (feature 001)", () => {
    const schema = z.object({ email: z.string({ error: "Ingresá tu email" }) });
    const { error } = correr(schema, {});
    assert.deepEqual(error.campos, [{ campo: "email", mensaje: "Ingresá tu email" }]);
  });

  it("deja un solo mensaje por campo: el primero que falla", () => {
    const schema = z.object({
      nombre: z.string().min(3, { error: "Muy corto" }).regex(/^[a-z]+$/, { error: "Solo letras" }),
    });
    const { error } = correr(schema, { nombre: "1" });
    assert.deepEqual(error.campos, [{ campo: "nombre", mensaje: "Muy corto" }]);
  });

  it("si el body no es un objeto, el campo es body", () => {
    const { error } = correr(z.object({}), "texto");
    assert.equal(error.campos[0].campo, "body");
  });

  it("si es válido reemplaza req.body por los datos normalizados", () => {
    const schema = z.object({ email: z.string().trim() });
    const { req, error } = correr(schema, { email: "  a@b.com " });
    assert.equal(error, undefined);
    assert.deepEqual(req.body, { email: "a@b.com" });
  });
});

/** Como en Express 5: req.query es un getter del prototipo, sin setter. */
function requestConQuery(query) {
  const prototipo = {};
  Object.defineProperty(prototipo, "query", { get: () => query, configurable: true });
  return Object.create(prototipo);
}

describe("validarQuery (feature 003)", () => {
  const schema = z.object({
    orden: z.enum(["fecha", "precio"], { error: "Elegí un orden válido" }).default("fecha"),
    busqueda: z.string().trim().optional(),
  });

  it("si es válido reemplaza req.query por los datos normalizados, aunque req.query sea un getter", () => {
    const req = requestConQuery({ busqueda: "  galpon " });
    let recibido = "sin llamar";
    validarQuery(schema)(req, {}, (error) => (recibido = error));
    assert.equal(recibido, undefined);
    assert.deepEqual(req.query, { orden: "fecha", busqueda: "galpon" });
  });

  it("si es inválido devuelve DATOS_INVALIDOS con un error por campo", () => {
    const req = requestConQuery({ orden: "nombre" });
    let recibido;
    validarQuery(schema)(req, {}, (error) => (recibido = error));
    assert.ok(recibido instanceof DatosInvalidos);
    assert.deepEqual(recibido.campos, [{ campo: "orden", mensaje: "Elegí un orden válido" }]);
  });
});
