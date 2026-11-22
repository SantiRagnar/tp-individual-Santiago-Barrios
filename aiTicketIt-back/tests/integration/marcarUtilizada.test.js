import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

// US3 de specs/005-panel-evento: Marcar utilizada (FR-012 a FR-015; contracts/ventas.openapi.yaml).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);
const marcar = (token, numero, evento = "evt-1") =>
  conToken(request(app).post(`/organizadores/eventos/${evento}/ventas/${numero}/utilizacion`), token);

const todasLasVentas = async (token, evento = "evt-1") => {
  const ventas = [];
  let cursor = null;
  do {
    const res = await conToken(request(app).get(`/organizadores/eventos/${evento}/ventas${cursor ? `?cursor=${cursor}` : ""}`), token);
    ventas.push(...res.body.ventas);
    cursor = res.body.siguiente;
  } while (cursor);
  return ventas;
};

describe("POST /organizadores/eventos/:id/ventas/:numero/utilizacion (US3)", () => {
  it("el día del evento: 200 con la venta Utilizada y el resumen actualizado", async () => {
    fijarAhora("2026-11-21T00:00:00-03:00");
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await marcar(token, "A-1042");
    assert.equal(res.status, 200);
    assert.equal(res.body.venta.numero, "A-1042");
    assert.equal(res.body.venta.estado, "Utilizada");
    assert.equal(res.body.venta.acciones.marcarUtilizada, false);
    assert.equal(res.body.resumen.porEstado.Confirmada, 50);
    assert.equal(res.body.resumen.porEstado.Utilizada, 1);
    assert.equal(res.body.resumen.comprasActivas, 60);
    // FR-015: la compra queda guardada como Utilizada (condición para calificarla).
    assert.equal(comprasRepository.buscarPorNumero("A-1042").estado, "Utilizada");
  });

  it("un segundo POST sobre la misma compra → 409 COMPRA_NO_CONFIRMADA", async () => {
    fijarAhora("2026-11-21T00:00:00-03:00");
    const token = await tokenDeOrganizador(LA_TRAMA);
    await marcar(token, "A-1042");
    const res = await marcar(token, "A-1042");
    assert.equal(res.status, 409);
    assert.deepEqual(res.body, { error: { codigo: "COMPRA_NO_CONFIRMADA", mensaje: "La compra ya no está confirmada." } });
  });

  it("el día anterior → 409 EVENTO_NO_COMENZO y la compra sigue Confirmada", async () => {
    fijarAhora("2026-11-20T23:59:00-03:00");
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await marcar(token, "A-1042");
    assert.equal(res.status, 409);
    assert.deepEqual(res.body, { error: { codigo: "EVENTO_NO_COMENZO", mensaje: "Todavía no es el día del evento." } });
    assert.equal(comprasRepository.buscarPorNumero("A-1042").estado, "Confirmada");
  });

  it("compra inexistente o de otro evento → 404 COMPRA_NO_ENCONTRADA", async () => {
    fijarAhora("2026-11-21T00:00:00-03:00");
    const token = await tokenDeOrganizador(LA_TRAMA);
    for (const numero of ["A-9999", "A-0655"]) {
      const res = await marcar(token, numero);
      assert.equal(res.status, 404, numero);
      assert.equal(res.body.error.codigo, "COMPRA_NO_ENCONTRADA", numero);
    }
  });

  it("antes del día ninguna fila de Hamlet ofrece Marcar utilizada; el día del evento, todas las Confirmadas sí", async () => {
    fijarAhora(HOY);
    const token = await tokenDeOrganizador(LA_TRAMA);
    const antes = await todasLasVentas(token);
    assert.ok(antes.every((v) => v.acciones.marcarUtilizada === false));

    fijarAhora("2026-11-21T10:00:00-03:00");
    const elDia = await todasLasVentas(token);
    for (const venta of elDia) assert.equal(venta.acciones.marcarUtilizada, venta.estado === "Confirmada", venta.numero);
  });
});
