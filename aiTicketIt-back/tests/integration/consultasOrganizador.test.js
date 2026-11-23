import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// US2 de specs/007-consultas-chat: el organizador responde (FR-009 a FR-012; contracts/consultas.openapi.yaml).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);
const lista = (token, evento = "evt-1") => conToken(request(app).get(`/organizadores/eventos/${evento}/consultas`), token);
const detalle = (token, numero, { evento = "evt-1", despuesDe } = {}) =>
  conToken(request(app).get(`/organizadores/eventos/${evento}/consultas/${numero}${despuesDe ? `?despuesDe=${despuesDe}` : ""}`), token);
const responder = (token, numero, body, evento = "evt-1") =>
  conToken(request(app).post(`/organizadores/eventos/${evento}/consultas/${numero}/mensajes`), token).send(body);

describe("GET /organizadores/eventos/:id/consultas", () => {
  it("lista las consultas con mensajes, A-1042 primera y no leída, y noLeidas 1", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await lista(token);
    assert.equal(res.status, 200);
    assert.equal(res.body.noLeidas, 1);
    const [primera] = res.body.consultas;
    assert.deepEqual(
      { ...primera, ultimoMensaje: primera.ultimoMensaje.id },
      {
        numero: "A-1042",
        comprador: { nombre: "Sofía Gómez" },
        tipoDeEntrada: { nombre: "Platea" },
        cantidad: 2,
        monto: 36000,
        estado: "Confirmada",
        ultimoMensaje: "msj-3",
        noLeida: true,
      },
    );
    assert.equal(res.body.consultas.length, 2);
  });
});

describe("GET /organizadores/eventos/:id/consultas/:numero", () => {
  it("devuelve la consulta y sus mensajes; con despuesDe solo los nuevos", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await detalle(token, "A-1042");
    assert.equal(res.status, 200);
    assert.equal(res.body.consulta.numero, "A-1042");
    assert.equal(res.body.mensajes.length, 3);
    const nuevos = await detalle(token, "A-1042", { despuesDe: "msj-3" });
    assert.deepEqual(nuevos.body.mensajes, []);
    assert.equal((await detalle(token, "A-1042", { despuesDe: "msj-7" })).status, 400);
  });
});

describe("POST /organizadores/eventos/:id/consultas/:numero/mensajes", () => {
  it("201 con autor organizador; el comprador lo ve y la lista lo pone primero", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await responder(token, "A-1042", { texto: "Sí, hay lugar para dejarlo en el hall." });
    assert.equal(res.status, 201);
    assert.equal(res.body.mensaje.autor, "organizador");

    const sofia = await tokenDeComprador();
    const delComprador = await conToken(request(app).get("/compradores/compras/A-1042/mensajes?despuesDe=msj-3"), sofia);
    assert.deepEqual(delComprador.body.mensajes.map((m) => m.id), [res.body.mensaje.id]);

    const despues = await lista(token);
    assert.equal(despues.body.consultas[0].numero, "A-1042");
    assert.equal(despues.body.consultas[0].ultimoMensaje.id, res.body.mensaje.id);
    assert.equal(despues.body.consultas[0].noLeida, false);
  });

  it("mensaje inválido → 400", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    assert.equal((await responder(token, "A-1042", { texto: "  " })).status, 400);
  });

  it("se puede responder en un evento Finalizado (Edipo, evt-7)", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    assert.equal((await responder(token, "A-0655", { texto: "¡Gracias por venir!" }, "evt-7")).status, 201);
  });
});
