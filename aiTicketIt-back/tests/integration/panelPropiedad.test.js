import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// US4 de specs/005-panel-evento: solo el organizador dueño ve el panel y sus ventas (FR-003, FR-004).

beforeEach(() => {
  reiniciarEstado();
  // El día de Risas a Domicilio (evt-2): sus Confirmadas serían marcables por su dueño.
  fijarAhora("2026-11-14T12:00:00-03:00");
});

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("Panel del evento: propiedad (US4)", () => {
  for (const evento of ["evt-2", "evt-999"]) {
    it(`GET /organizadores/eventos/${evento}/ventas con la sesión de La Trama → 404 sin datos`, async () => {
      const token = await tokenDeOrganizador(LA_TRAMA);
      const res = await conToken(request(app).get(`/organizadores/eventos/${evento}/ventas`), token);
      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { error: { codigo: "EVENTO_NO_ENCONTRADO", mensaje: "No encontramos el evento." } });
    });
  }

  it("sin token → 401 SESION_INVALIDA", async () => {
    const res = await request(app).get("/organizadores/eventos/evt-1/ventas");
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, "SESION_INVALIDA");
  });

  it("con token de comprador → 401", async () => {
    const token = await tokenDeComprador();
    const res = await conToken(request(app).get("/organizadores/eventos/evt-1/ventas"), token);
    assert.equal(res.status, 401);
  });

  it("marcar utilizada una compra de un evento ajeno → 404 EVENTO_NO_ENCONTRADO y la compra no cambia", async () => {
    const ajena = comprasRepository.todasDelEvento("evt-2").find((c) => c.estado === "Confirmada");
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).post(`/organizadores/eventos/evt-2/ventas/${ajena.numero}/utilizacion`), token);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
    assert.equal(comprasRepository.buscarPorNumero(ajena.numero).estado, "Confirmada");
  });

  it("marcar utilizada sin token → 401", async () => {
    const res = await request(app).post("/organizadores/eventos/evt-1/ventas/A-1042/utilizacion");
    assert.equal(res.status, 401);
  });
});
