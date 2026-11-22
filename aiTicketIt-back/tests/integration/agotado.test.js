import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const pedir = async (ruta) => request(app).get(ruta).set("Authorization", `Bearer ${await tokenDeComprador()}`);

describe("Agotado — US4 (FR-014)", () => {
  it("un evento sin lugares en ningún tipo sigue en Explorar con agotado true y el mismo precioDesde", async () => {
    eventosRepository.buscarPorId("evt-3").tiposDeEntrada.forEach((t) => (t.vendidas = t.cupo));
    const res = await pedir("/compradores/eventos");
    const bodas = res.body.eventos.find((e) => e.id === "evt-3");
    assert.ok(bodas, "sigue listado");
    assert.equal(bodas.agotado, true);
    assert.equal(bodas.precioDesde, 15000);
  });

  it("el Detalle trae agotado true y 0 disponibles en cada tipo", async () => {
    eventosRepository.buscarPorId("evt-3").tiposDeEntrada.forEach((t) => (t.vendidas = t.cupo));
    const { body } = await pedir("/compradores/eventos/evt-3");
    assert.equal(body.evento.agotado, true);
    assert.ok(body.evento.tiposDeEntrada.every((t) => t.disponibles === 0));
  });

  it("Hamlet (solo VIP agotado) no está agotado", async () => {
    const { body } = await pedir("/compradores/eventos/evt-1");
    assert.equal(body.evento.agotado, false);
  });
});
