import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, MARTIN, tokenDeComprador } from "../helpers/sesion.js";

// specs/006-calificaciones-opiniones: US1 · Calificar desde la compra (FR-001 a FR-004, FR-011).
// Contrato: contracts/calificaciones.openapi.yaml § POST /compradores/compras/{numero}/calificacion.
let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const con = (req, t = token) => req.set("Authorization", `Bearer ${t}`);
const calificar = (numero, body, t = token) => con(request(app).post(`/compradores/compras/${numero}/calificacion`), t).send(body);

describe("POST /compradores/compras/:numero/calificacion — US1", () => {
  it("A-0871 → 201 con la calificación, sin acción de calificar y motivo YA_CALIFICADA", async () => {
    const res = await calificar("A-0871", { puntaje: 5, comentario: "  Hermosa puesta.  " });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.compra.calificacion, { puntaje: 5, comentario: "Hermosa puesta.", calificadaEn: HOY.toISOString() });
    assert.equal(res.body.compra.estado, "Utilizada");
    assert.equal(res.body.compra.acciones.calificar, false);
    assert.equal(res.body.compra.motivoNoCalificable, "YA_CALIFICADA");
  });

  it("sin comentario (o solo espacios) guarda comentario null", async () => {
    const res = await calificar("A-0871", { puntaje: 3, comentario: "   " });
    assert.equal(res.status, 201);
    assert.equal(res.body.compra.calificacion.comentario, null);
  });

  it("el detalle y Mis compras reflejan la calificación", async () => {
    assert.equal((await con(request(app).get("/compradores/compras/A-0871"))).body.compra.acciones.calificar, true);
    await calificar("A-0871", { puntaje: 4 });
    const detalle = await con(request(app).get("/compradores/compras/A-0871"));
    assert.equal(detalle.body.compra.calificacion.puntaje, 4);
    const lista = await con(request(app).get("/compradores/compras"));
    assert.equal(lista.body.compras.find((c) => c.numero === "A-0871").calificacion.puntaje, 4);
  });

  it("repetir → 409 COMPRA_YA_CALIFICADA y la calificación no cambia", async () => {
    await calificar("A-0871", { puntaje: 2 });
    const res = await calificar("A-0871", { puntaje: 5 });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.codigo, "COMPRA_YA_CALIFICADA");
    assert.equal(res.body.error.mensaje, "Esta compra ya fue calificada.");
    assert.equal((await con(request(app).get("/compradores/compras/A-0871"))).body.compra.calificacion.puntaje, 2);
  });

  it("A-0655 (ya calificada en el seed) → 409 COMPRA_YA_CALIFICADA", async () => {
    assert.equal((await calificar("A-0655", { puntaje: 5 })).body.error.codigo, "COMPRA_YA_CALIFICADA");
  });

  it("Confirmada, Pendiente de pago o Reembolsada → 409 CALIFICACION_NO_PERMITIDA", async () => {
    for (const numero of ["A-1042", "A-1037", "A-0790"]) {
      const res = await calificar(numero, { puntaje: 4 });
      assert.equal(res.status, 409, numero);
      assert.equal(res.body.error.codigo, "CALIFICACION_NO_PERMITIDA", numero);
      assert.equal(res.body.error.mensaje, "Solo podés calificar una entrada utilizada.");
    }
  });

  it("compra de otro comprador o inexistente → 404 COMPRA_NO_ENCONTRADA", async () => {
    const deMartin = await calificar("A-0871", { puntaje: 4 }, await tokenDeComprador(MARTIN));
    assert.equal(deMartin.status, 404);
    assert.equal(deMartin.body.error.codigo, "COMPRA_NO_ENCONTRADA");
    assert.equal((await calificar("A-9999", { puntaje: 4 })).status, 404);
  });

  it("datos inválidos → 400 DATOS_INVALIDOS con el campo", async () => {
    for (const [body, campo] of [
      [{ puntaje: 0 }, "puntaje"],
      [{ puntaje: 6 }, "puntaje"],
      [{ puntaje: 4.5 }, "puntaje"],
      [{}, "puntaje"],
      [{ puntaje: 4, comentario: "a".repeat(501) }, "comentario"],
    ]) {
      const res = await calificar("A-0871", body);
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 40));
      assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
      assert.equal(res.body.error.campos[0].campo, campo);
    }
    assert.equal((await calificar("A-0871", { puntaje: 4, autor: "Sofía" })).status, 400);
    assert.equal((await con(request(app).get("/compradores/compras/A-0871"))).body.compra.calificacion, null);
  });

  it("sin sesión → 401", async () => {
    const res = await request(app).post("/compradores/compras/A-0871/calificacion").send({ puntaje: 5 });
    assert.equal(res.status, 401);
  });
});
