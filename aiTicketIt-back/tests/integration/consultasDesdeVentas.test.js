import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as consultasRepository from "../../repository/consultasRepository.js";
import * as compradoresRepository from "../../repository/compradoresRepository.js";
import { compraSinMensajes } from "../helpers/consultas.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { CONTRASENA_DESARROLLO, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

// US4 de specs/007-consultas-chat: el organizador abre el chat desde una venta y escribe primero (FR-013).

beforeEach(() => reiniciarEstado());

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("consulta de una compra sin mensajes, abierta desde Ventas (US4)", () => {
  it("GET devuelve la cabecera vacía; no aparece en la lista; PUT lectura no la crea", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    const { numero } = compraSinMensajes("evt-1");
    const res = await conToken(request(app).get(`/organizadores/eventos/evt-1/consultas/${numero}`), trama);
    assert.equal(res.status, 200);
    assert.equal(res.body.consulta.numero, numero);
    assert.equal(res.body.consulta.ultimoMensaje, null);
    assert.equal(res.body.consulta.noLeida, false);
    assert.deepEqual(res.body.mensajes, []);

    const lista = await conToken(request(app).get("/organizadores/eventos/evt-1/consultas"), trama);
    assert.ok(!lista.body.consultas.some((c) => c.numero === numero));

    assert.equal((await conToken(request(app).put(`/organizadores/eventos/evt-1/consultas/${numero}/lectura`), trama)).status, 204);
    assert.equal(consultasRepository.buscar(numero), null);
  });

  it("al escribir primero, aparece primera en la lista y el comprador la ve en su chat", async () => {
    const trama = await tokenDeOrganizador(LA_TRAMA);
    const compra = compraSinMensajes("evt-1");
    const post = await conToken(request(app).post(`/organizadores/eventos/evt-1/consultas/${compra.numero}/mensajes`), trama).send({
      texto: "Hola, la función empieza 15 minutos más tarde.",
    });
    assert.equal(post.status, 201);

    const lista = await conToken(request(app).get("/organizadores/eventos/evt-1/consultas"), trama);
    assert.equal(lista.body.consultas[0].numero, compra.numero);
    assert.equal(lista.body.consultas[0].noLeida, false);

    const email = compradoresRepository.buscarPorId(compra.compradorId).email;
    const sesion = await request(app).post("/compradores/sesiones").send({ email, contrasena: CONTRASENA_DESARROLLO });
    const delComprador = await conToken(request(app).get(`/compradores/compras/${compra.numero}/mensajes`), sesion.body.token);
    assert.deepEqual(delComprador.body.mensajes.map((m) => m.autor), ["organizador"]);
  });
});
