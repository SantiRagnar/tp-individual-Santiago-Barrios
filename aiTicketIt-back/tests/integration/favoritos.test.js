import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { CONTRASENA_DESARROLLO, HOY, MARTIN, tokenDeComprador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const con = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("Favoritos — US5 (FR-019 a FR-023)", () => {
  it("PUT dos veces → 204; GET lista el evento y Explorar y el Detalle traen esFavorito true", async () => {
    const token = await tokenDeComprador();
    for (let i = 0; i < 2; i++) {
      const res = await con(request(app).put("/compradores/favoritos/evt-3"), token);
      assert.equal(res.status, 204);
    }
    const lista = await con(request(app).get("/compradores/favoritos"), token);
    assert.equal(lista.status, 200);
    assert.deepEqual(lista.body.eventos.map((e) => e.id), ["evt-3"]);
    assert.equal(lista.body.eventos[0].esFavorito, true);
    assert.equal(lista.body.eventos[0].precioDesde, 15000);

    const explorar = await con(request(app).get("/compradores/eventos"), token);
    assert.equal(explorar.body.eventos.find((e) => e.id === "evt-3").esFavorito, true);
    assert.equal(explorar.body.eventos.find((e) => e.id === "evt-1").esFavorito, false);
    const detalle = await con(request(app).get("/compradores/eventos/evt-3"), token);
    assert.equal(detalle.body.evento.esFavorito, true);
  });

  it("DELETE dos veces → 204 y la lista queda vacía", async () => {
    const token = await tokenDeComprador();
    await con(request(app).put("/compradores/favoritos/evt-3"), token);
    for (let i = 0; i < 2; i++) {
      const res = await con(request(app).delete("/compradores/favoritos/evt-3"), token);
      assert.equal(res.status, 204);
    }
    const lista = await con(request(app).get("/compradores/favoritos"), token);
    assert.deepEqual(lista.body.eventos, []);
  });

  it("PUT sobre un Borrador → 404 EVENTO_NO_ENCONTRADO", async () => {
    const token = await tokenDeComprador();
    const res = await con(request(app).put("/compradores/favoritos/evt-8"), token);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
  });

  it("los favoritos de Sofía no aparecen para Martín", async () => {
    await con(request(app).put("/compradores/favoritos/evt-3"), await tokenDeComprador());
    const martin = await tokenDeComprador(MARTIN);
    const lista = await con(request(app).get("/compradores/favoritos"), martin);
    assert.deepEqual(lista.body.eventos, []);
    const explorar = await con(request(app).get("/compradores/eventos"), martin);
    assert.ok(explorar.body.eventos.every((e) => e.esFavorito === false));
  });

  it("siguen después de cerrar sesión y volver a ingresar", async () => {
    const token = await tokenDeComprador();
    await con(request(app).put("/compradores/favoritos/evt-1"), token);
    const cierre = await con(request(app).delete("/compradores/sesiones/actual"), token);
    assert.ok([200, 204].includes(cierre.status), `cerrar sesión respondió ${cierre.status}`);
    const otra = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: CONTRASENA_DESARROLLO });
    const lista = await con(request(app).get("/compradores/favoritos"), otra.body.token);
    assert.deepEqual(lista.body.eventos.map((e) => e.id), ["evt-1"]);
  });

  it("401 sin sesión en las tres operaciones", async () => {
    assert.equal((await request(app).get("/compradores/favoritos")).status, 401);
    assert.equal((await request(app).put("/compradores/favoritos/evt-1")).status, 401);
    assert.equal((await request(app).delete("/compradores/favoritos/evt-1")).status, 401);
  });
});
