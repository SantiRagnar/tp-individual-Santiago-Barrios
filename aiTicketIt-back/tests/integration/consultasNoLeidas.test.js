import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// US3 y US6 de specs/007-consultas-chat: no leídas del organizador (FR-015 a FR-017) y del comprador (FR-022 a FR-024).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);
const noLeidasDelEvento = async (token, evento = "evt-1") =>
  (await conToken(request(app).get(`/organizadores/eventos/${evento}/consultas`), token)).body.noLeidas;

describe("no leídas del organizador (US3)", () => {
  it("los GET no marcan nada; PUT lectura → 204 y el contador baja; un mensaje del comprador lo vuelve a subir", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    assert.equal(await noLeidasDelEvento(trama), 1);
    await conToken(request(app).get("/organizadores/eventos/evt-1/consultas/A-1042"), trama);
    assert.equal(await noLeidasDelEvento(trama), 1);

    const put = await conToken(request(app).put("/organizadores/eventos/evt-1/consultas/A-1042/lectura"), trama);
    assert.equal(put.status, 204);
    assert.equal(await noLeidasDelEvento(trama), 0);

    const sofia = await tokenDeComprador();
    await conToken(request(app).post("/compradores/compras/A-1042/mensajes"), sofia).send({ texto: "¿Y para la salida?" });
    assert.equal(await noLeidasDelEvento(trama), 1);
    const lista = await conToken(request(app).get("/organizadores/eventos/evt-1/consultas"), trama);
    assert.equal(lista.body.consultas[0].numero, "A-1042");
    assert.equal(lista.body.consultas[0].noLeida, true);
  });

  it("Bodas de sangre arranca con 1 no leída", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    assert.equal(await noLeidasDelEvento(trama, "evt-3"), 1);
  });
});

describe("no leídas del comprador (US6)", () => {
  const noLeidas = async (token) => (await conToken(request(app).get("/compradores/consultas/no-leidas"), token)).body.consultas;
  const consultaNoLeidaDe = async (token, numero) =>
    (await conToken(request(app).get("/compradores/compras"), token)).body.compras.find((c) => c.numero === numero).consultaNoLeida;

  it("GET /compradores/consultas/no-leidas devuelve A-1037 con evento y organizador", async () => {
    const sofia = await tokenDeComprador();
    const consultas = await noLeidas(sofia);
    assert.equal(consultas.length, 1);
    assert.deepEqual(
      { ...consultas[0], ultimoMensaje: consultas[0].ultimoMensaje.autor },
      { numero: "A-1037", evento: { id: "evt-2", nombre: "Risas a Domicilio" }, organizador: { nombre: "Club del Chiste" }, ultimoMensaje: "organizador" },
    );
  });

  it("Mis compras y el detalle traen consultaNoLeida", async () => {
    const sofia = await tokenDeComprador();
    assert.equal(await consultaNoLeidaDe(sofia, "A-1037"), true);
    assert.equal(await consultaNoLeidaDe(sofia, "A-1042"), false);
    const detalle = await conToken(request(app).get("/compradores/compras/A-1037"), sofia);
    assert.equal(detalle.body.compra.consultaNoLeida, true);
  });

  it("al abrir el chat (PUT lectura) desaparece; si el organizador responde, aparece", async () => {
    const sofia = await tokenDeComprador();
    await conToken(request(app).put("/compradores/compras/A-1037/mensajes/lectura"), sofia);
    assert.deepEqual(await noLeidas(sofia), []);
    assert.equal(await consultaNoLeidaDe(sofia, "A-1037"), false);

    const trama = await tokenDeOrganizador(LA_TRAMA);
    await conToken(request(app).post("/organizadores/eventos/evt-1/consultas/A-1042/mensajes"), trama).send({ texto: "Sí, hay lugar." });
    assert.deepEqual((await noLeidas(sofia)).map((c) => c.numero), ["A-1042"]);
    assert.equal(await consultaNoLeidaDe(sofia, "A-1042"), true);
  });

  it("otro comprador no ve las de Sofía; sin sesión → 401", async () => {
    const martin = await tokenDeComprador("martin.perez@correo.com");
    assert.deepEqual(await noLeidas(martin), []);
    assert.equal((await request(app).get("/compradores/consultas/no-leidas")).status, 401);
  });
});
