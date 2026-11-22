import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { cuerpoDeCompra } from "../helpers/compras.js";
import { HOY, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: US5 · Cancelar compra (FR-023, FR-024, FR-026).
let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const con = (req, t = token) => req.set("Authorization", `Bearer ${t}`);
const cancelar = (numero, t = token) => con(request(app).post(`/compradores/compras/${numero}/cancelacion`), t);
const disponiblesDe = async (eventoId, tipoId) =>
  (await con(request(app).get(`/compradores/eventos/${eventoId}`))).body.evento.tiposDeEntrada.find((t) => t.id === tipoId).disponibles;

describe("POST /compradores/compras/:numero/cancelacion — US5", () => {
  it("A-1042 → 200 Reembolsada y la Platea vuelve a 14 disponibles (66 vendidas para el organizador)", async () => {
    const res = await cancelar("A-1042");
    assert.equal(res.status, 200);
    assert.equal(res.body.compra.estado, "Reembolsada");
    assert.equal(res.body.compra.motivoNoCancelable, "REEMBOLSADA");
    assert.equal(res.body.compra.acciones.cancelar, false);
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 14);
    const organizador = await con(request(app).get("/organizadores/eventos/evt-1"), await tokenDeOrganizador(LA_TRAMA));
    assert.equal(organizador.body.evento.tiposDeEntrada.find((t) => t.id === "tip-2").vendidas, 66);
  });

  it("A-1037 → Cancelada y Risas General suma 1 lugar", async () => {
    const antes = await disponiblesDe("evt-2", "tip-4");
    const res = await cancelar("A-1037");
    assert.equal(res.status, 200);
    assert.equal(res.body.compra.estado, "Cancelada");
    assert.equal(res.body.compra.motivoNoCancelable, "CANCELADA");
    assert.equal(await disponiblesDe("evt-2", "tip-4"), antes + 1);
  });

  it("repetir una cancelación → 409 CANCELACION_NO_PERMITIDA", async () => {
    for (const numero of ["A-1042", "A-1037"]) {
      await cancelar(numero);
      const res = await cancelar(numero);
      assert.equal(res.status, 409, numero);
      assert.equal(res.body.error.codigo, "CANCELACION_NO_PERMITIDA");
    }
  });

  it("Utilizadas (A-0871, A-0655) → 409", async () => {
    for (const numero of ["A-0871", "A-0655"]) assert.equal((await cancelar(numero)).status, 409, numero);
  });

  it("una compra de Martín → 404", async () => {
    assert.equal((await cancelar("A-0612")).status, 404);
  });

  it("401 sin sesión", async () => {
    assert.equal((await request(app).post("/compradores/compras/A-1042/cancelacion")).status, 401);
  });

  it("comprar y cancelar deja los lugares como al principio", async () => {
    const { body } = await con(request(app).post("/compradores/compras")).send(cuerpoDeCompra());
    await cancelar(body.compra.numero);
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 12);
  });
});
