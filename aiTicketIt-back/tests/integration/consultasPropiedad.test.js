import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import * as consultasRepository from "../../repository/consultasRepository.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { CLUB_DEL_CHISTE, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// US5 de specs/007-consultas-chat: cada uno ve solo sus consultas (FR-008, FR-014, SC-005).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);
const totalDeMensajes = () =>
  ["A-1042", "A-1037"].reduce((t, n) => t + consultasRepository.buscar(n).mensajes.length, 0);

describe("comprador: compra ajena o inexistente", () => {
  it("GET, POST y PUT lectura sobre una compra de otro comprador o inexistente → 404 sin cambios", async () => {
    const sofia = await tokenDeComprador();
    const ajena = comprasRepository.todasDelEvento("evt-1").find((c) => c.compradorId === "cmp-6").numero;
    const antes = totalDeMensajes();
    for (const numero of [ajena, "A-9999"]) {
      const get = await conToken(request(app).get(`/compradores/compras/${numero}/mensajes`), sofia);
      const post = await conToken(request(app).post(`/compradores/compras/${numero}/mensajes`), sofia).send({ texto: "hola" });
      const put = await conToken(request(app).put(`/compradores/compras/${numero}/mensajes/lectura`), sofia);
      for (const res of [get, post, put]) {
        assert.equal(res.status, 404, numero);
        assert.equal(res.body.error.codigo, "COMPRA_NO_ENCONTRADA");
      }
    }
    // Una compra ajena responde 404 aunque el despuesDe sea inválido: la propiedad va primero.
    const conCursor = await conToken(request(app).get(`/compradores/compras/${ajena}/mensajes?despuesDe=msj-1`), sofia);
    assert.equal(conCursor.status, 404);
    assert.equal(totalDeMensajes(), antes);
    assert.equal(consultasRepository.buscar("A-9999"), null);
  });

  it("con un token de organizador → 401", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/compradores/compras/A-1042/mensajes"), trama);
    assert.equal(res.status, 401);
  });
});

describe("organizador: evento o compra ajenos", () => {
  it("Club del Chiste sobre evt-1 → 404 EVENTO_NO_ENCONTRADO en todos los endpoints", async () => {
    const club = await tokenDeOrganizador(CLUB_DEL_CHISTE);
    const respuestas = [
      await conToken(request(app).get("/organizadores/eventos/evt-1/consultas"), club),
      await conToken(request(app).get("/organizadores/eventos/evt-1/consultas/A-1042"), club),
      await conToken(request(app).post("/organizadores/eventos/evt-1/consultas/A-1042/mensajes"), club).send({ texto: "hola" }),
      await conToken(request(app).put("/organizadores/eventos/evt-1/consultas/A-1042/lectura"), club),
    ];
    for (const res of respuestas) {
      assert.equal(res.status, 404);
      assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
    }
    assert.equal(consultasRepository.buscar("A-1042").mensajes.length, 3);
    assert.equal(consultasRepository.buscar("A-1042").vistosPorOrganizador, 2);
  });

  it("La Trama sobre evt-1 con una compra de Bodas (evt-3) → 404 COMPRA_NO_ENCONTRADA", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    const deBodas = comprasRepository.todasDelEvento("evt-3")[0].numero;
    const respuestas = [
      await conToken(request(app).get(`/organizadores/eventos/evt-1/consultas/${deBodas}`), trama),
      await conToken(request(app).post(`/organizadores/eventos/evt-1/consultas/${deBodas}/mensajes`), trama).send({ texto: "hola" }),
      await conToken(request(app).put(`/organizadores/eventos/evt-1/consultas/${deBodas}/lectura`), trama),
    ];
    for (const res of respuestas) {
      assert.equal(res.status, 404);
      assert.equal(res.body.error.codigo, "COMPRA_NO_ENCONTRADA");
    }
  });
});
