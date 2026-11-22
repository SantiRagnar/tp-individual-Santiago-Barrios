import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as consultasRepository from "../../repository/consultasRepository.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { tokenDeComprador } from "../helpers/sesion.js";

// US1 de specs/007-consultas-chat: el comprador hace una consulta (FR-002 a FR-007; contracts/consultas.openapi.yaml).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);
const mensajes = (token, numero, despuesDe) =>
  conToken(request(app).get(`/compradores/compras/${numero}/mensajes${despuesDe ? `?despuesDe=${despuesDe}` : ""}`), token);
const enviar = (token, numero, body) => conToken(request(app).post(`/compradores/compras/${numero}/mensajes`), token).send(body);

describe("GET /compradores/compras/:numero/mensajes", () => {
  it("devuelve los mensajes del seed en orden cronológico", async () => {
    const token = await tokenDeComprador();
    const res = await mensajes(token, "A-1042");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.mensajes.map((m) => [m.id, m.autor]), [
      ["msj-1", "comprador"],
      ["msj-2", "organizador"],
      ["msj-3", "comprador"],
    ]);
    assert.deepEqual(Object.keys(res.body.mensajes[0]).sort(), ["autor", "enviadoEn", "id", "texto"]);
  });

  it("una compra sin mensajes devuelve [] y un despuesDe desconocido → 400", async () => {
    const token = await tokenDeComprador();
    assert.deepEqual((await mensajes(token, "A-0790")).body, { mensajes: [] });
    const res = await mensajes(token, "A-1042", "msj-999");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    assert.equal(res.body.error.campos[0].campo, "despuesDe");
  });

  it("sin token → 401", async () => {
    const res = await request(app).get("/compradores/compras/A-1042/mensajes");
    assert.equal(res.status, 401);
  });
});

describe("POST /compradores/compras/:numero/mensajes", () => {
  it("201 con el texto recortado y autor comprador; el sondeo con despuesDe lo trae solo a él", async () => {
    const token = await tokenDeComprador();
    const res = await enviar(token, "A-1042", { texto: "  ¿Se puede entrar con cochecito?  " });
    assert.equal(res.status, 201);
    assert.equal(res.body.mensaje.texto, "¿Se puede entrar con cochecito?");
    assert.equal(res.body.mensaje.autor, "comprador");
    const nuevos = await mensajes(token, "A-1042", "msj-3");
    assert.deepEqual(nuevos.body.mensajes.map((m) => m.id), [res.body.mensaje.id]);
  });

  it("vacío, solo espacios, 1001 caracteres o campos extra → 400 sin guardar nada (SC-006)", async () => {
    const token = await tokenDeComprador();
    for (const body of [{ texto: "" }, { texto: "   " }, { texto: "a".repeat(1001) }, { texto: "hola", autor: "organizador" }, {}]) {
      const res = await enviar(token, "A-1042", body);
      assert.equal(res.status, 400, JSON.stringify(body).slice(0, 40));
      assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    }
    assert.equal(consultasRepository.buscar("A-1042").mensajes.length, 3);
  });

  it("se puede escribir en una compra Reembolsada y en una Utilizada de un evento pasado (FR-004)", async () => {
    const token = await tokenDeComprador();
    assert.equal((await enviar(token, "A-0790", { texto: "¿Ya me reintegraron?" })).status, 201);
    assert.equal((await enviar(token, "A-0655", { texto: "¡Gracias por la función!" })).status, 201);
  });
});

describe("PUT /compradores/compras/:numero/mensajes/lectura", () => {
  it("204, también en una compra sin mensajes (no la crea)", async () => {
    const token = await tokenDeComprador();
    assert.equal((await conToken(request(app).put("/compradores/compras/A-1037/mensajes/lectura"), token)).status, 204);
    assert.equal((await conToken(request(app).put("/compradores/compras/A-0790/mensajes/lectura"), token)).status, 204);
    assert.equal(consultasRepository.buscar("A-0790"), null);
  });
});
