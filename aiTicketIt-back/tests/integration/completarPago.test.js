import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: US4 · Completar pago (FR-022). POST /compradores/compras/:numero/pago.
let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const completar = (numero, t = token) => request(app).post(`/compradores/compras/${numero}/pago`).set("Authorization", `Bearer ${t}`);

describe("POST /compradores/compras/:numero/pago — US4", () => {
  it("A-1037 → 200 Confirmada, con 6 días para Risas a Domicilio", async () => {
    const res = await completar("A-1037");
    assert.equal(res.status, 200);
    assert.equal(res.body.compra.estado, "Confirmada");
    assert.equal(res.body.compra.diasParaEvento, 6);
    assert.deepEqual(res.body.compra.acciones, { completarPago: false, cancelar: true });
  });

  it("repetirlo → 409 PAGO_NO_PERMITIDO", async () => {
    await completar("A-1037");
    const res = await completar("A-1037");
    assert.equal(res.status, 409);
    assert.equal(res.body.error.codigo, "PAGO_NO_PERMITIDO");
  });

  it("una Confirmada → 409", async () => {
    assert.equal((await completar("A-1042")).status, 409);
  });

  it("después de Risas a Domicilio → 409", async () => {
    fijarAhora(new Date("2026-11-15T10:00:00-03:00"));
    assert.equal((await completar("A-1037")).status, 409);
  });

  it("una compra de Martín → 404 COMPRA_NO_ENCONTRADA", async () => {
    const res = await completar("A-0612");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "COMPRA_NO_ENCONTRADA");
  });

  it("401 sin sesión", async () => {
    assert.equal((await request(app).post("/compradores/compras/A-1037/pago")).status, 401);
  });
});
