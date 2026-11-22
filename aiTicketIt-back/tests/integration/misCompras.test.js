import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as compradoresRepository from "../../repository/compradoresRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { cuerpoDeCompra } from "../helpers/compras.js";
import { HOY, LA_TRAMA, MARTIN, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: US2 · Mis compras (FR-013 a FR-017). Contrato: GET /compradores/compras.
beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const con = (req, token) => req.set("Authorization", `Bearer ${token}`);
const misCompras = async (token) => con(request(app).get("/compradores/compras"), token);

describe("GET /compradores/compras — US2", () => {
  it("Sofía ve sus 5 compras de la más nueva a la más antigua, con estado, cuenta regresiva y calificación", async () => {
    const res = await misCompras(await tokenDeComprador());
    assert.equal(res.status, 200);
    const compras = res.body.compras;
    assert.deepEqual(compras.map((c) => c.numero), ["A-1042", "A-1037", "A-0871", "A-0790", "A-0655"]);

    const porNumero = Object.fromEntries(compras.map((c) => [c.numero, c]));
    assert.equal(porNumero["A-1042"].estado, "Confirmada");
    assert.equal(porNumero["A-1042"].diasParaEvento, 13);
    assert.equal(porNumero["A-1042"].tipoDeEntrada.nombre, "Platea");
    assert.equal(porNumero["A-1042"].cantidad, 2);
    assert.equal(porNumero["A-1037"].estado, "Pendiente de pago");
    assert.equal(porNumero["A-1037"].diasParaEvento, null);
    assert.equal(porNumero["A-0871"].estado, "Utilizada");
    assert.equal(porNumero["A-0871"].calificacion, null);
    assert.equal(porNumero["A-0790"].estado, "Reembolsada");
    assert.equal(porNumero["A-0655"].calificacion.puntaje, 4);
  });

  it("una compra recién hecha aparece primera", async () => {
    const token = await tokenDeComprador();
    const nueva = await con(request(app).post("/compradores/compras"), token).send(cuerpoDeCompra());
    const res = await misCompras(token);
    assert.equal(res.body.compras[0].numero, nueva.body.compra.numero);
    assert.equal(res.body.compras.length, 6);
  });

  it("cada comprador ve solo las suyas: Martín ve A-0612 y A-0540", async () => {
    const res = await misCompras(await tokenDeComprador(MARTIN));
    assert.deepEqual(res.body.compras.map((c) => c.numero), ["A-0612", "A-0540"]);
  });

  it("un comprador sin compras recibe una lista vacía", async () => {
    const sofia = compradoresRepository.buscarPorEmail("sofia.gomez@correo.com");
    compradoresRepository.agregar({
      id: "cmp-90",
      nombre: "Ana",
      apellido: "Nueva",
      email: "ana.nueva@correo.com",
      contrasenaHash: sofia.contrasenaHash,
    });
    const res = await misCompras(await tokenDeComprador("ana.nueva@correo.com"));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { compras: [] });
  });

  it("401 sin token y con token de organizador", async () => {
    assert.equal((await request(app).get("/compradores/compras")).status, 401);
    assert.equal((await misCompras(await tokenDeOrganizador(LA_TRAMA))).status, 401);
  });
});
