import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { crearComprasCalificadas } from "../helpers/compradores.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const pedir = async (ruta, token) =>
  request(app).get(ruta).set("Authorization", `Bearer ${token ?? (await tokenDeComprador())}`);

describe("GET /compradores/eventos/:id — US3 (FR-012 a FR-016)", () => {
  it("Hamlet: descripción, precios, tipos con disponibles y las 4 reseñas de La Trama", async () => {
    const res = await pedir("/compradores/eventos/evt-1");
    assert.equal(res.status, 200);
    const { evento } = res.body;
    assert.equal(evento.descripcion, "La tragedia de Shakespeare en una puesta íntima, con el público alrededor de la escena.");
    assert.equal(evento.precioDesde, 12000);
    assert.equal(evento.precioHasta, 26000);
    assert.equal(evento.agotado, false);
    assert.deepEqual(evento.tiposDeEntrada.map((t) => [t.nombre, t.disponibles]), [["General", 84], ["Platea", 12], ["VIP", 0]]);
    assert.deepEqual(evento.organizador, { id: "org-1", nombre: "Compañía La Trama", puntaje: 4.5, cantidadResenas: 4 });

    const { resenas, siguiente } = evento.resenas;
    assert.equal(siguiente, null);
    assert.equal(resenas.length, 4);
    assert.deepEqual(resenas[0], {
      numeroCompra: "A-0631",
      autor: "Diego R.",
      puntaje: 4,
      comentario: "Buena, aunque la sala hacía mucho frío.",
      evento: { id: "evt-7", nombre: "Edipo Rey" },
      calificadaEn: "2026-09-20T18:00:00-03:00",
    });
    const lucia = resenas.find((r) => r.autor === "Lucía F.");
    assert.equal(lucia.comentario, null);
  });

  it("Impro Express (un solo tipo): precioDesde = precioHasta = 8000", async () => {
    const { body } = await pedir("/compradores/eventos/evt-5");
    assert.equal(body.evento.precioDesde, 8000);
    assert.equal(body.evento.precioHasta, 8000);
    assert.equal(body.evento.organizador.puntaje, 3.7);
  });

  for (const id of ["evt-7", "evt-8", "evt-999"]) {
    it(`${id} (Finalizado, Borrador o inexistente) → 404 EVENTO_NO_ENCONTRADO`, async () => {
      const res = await pedir(`/compradores/eventos/${id}`);
      assert.equal(res.status, 404);
      assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
    });
  }

  it("401 sin sesión", async () => {
    const res = await request(app).get("/compradores/eventos/evt-1");
    assert.equal(res.status, 401);
  });

  it("con más de 5 reseñas, el detalle trae solo 5 y el cursor de la siguiente", async () => {
    crearComprasCalificadas("org-1", "evt-7", 8);
    const { body } = await pedir("/compradores/eventos/evt-1");
    assert.equal(body.evento.resenas.resenas.length, 5);
    assert.equal(typeof body.evento.resenas.siguiente, "string");
    assert.equal(body.evento.organizador.cantidadResenas, 12);
  });
});

describe("GET /compradores/organizadores/:id/resenas — Ver más (FR-024)", () => {
  it("con 12 reseñas: páginas de 5, 5 y 2, con total 12 y sin repetidos", async () => {
    crearComprasCalificadas("org-1", "evt-7", 8);
    const token = await tokenDeComprador();
    const detalle = await pedir("/compradores/eventos/evt-1", token);
    const vistos = detalle.body.evento.resenas.resenas.map((r) => r.numeroCompra);
    const tamanos = [vistos.length];
    let cursor = detalle.body.evento.resenas.siguiente;
    while (cursor) {
      const res = await pedir(`/compradores/organizadores/org-1/resenas?cursor=${cursor}`, token);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 12);
      tamanos.push(res.body.resenas.length);
      vistos.push(...res.body.resenas.map((r) => r.numeroCompra));
      cursor = res.body.siguiente;
    }
    assert.deepEqual(tamanos, [5, 5, 2]);
    assert.equal(new Set(vistos).size, 12);
  });

  it("sin cursor devuelve la primera página", async () => {
    const res = await pedir("/compradores/organizadores/org-3/resenas");
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 2);
    assert.deepEqual(res.body.resenas.map((r) => r.autor), ["Valentina S.", "Lucía F."]);
  });

  it("organizador inexistente → 404 ORGANIZADOR_NO_ENCONTRADO", async () => {
    const res = await pedir("/compradores/organizadores/org-999/resenas");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "ORGANIZADOR_NO_ENCONTRADO");
  });

  it("cursor roto → 400 DATOS_INVALIDOS", async () => {
    const res = await pedir("/compradores/organizadores/org-1/resenas?cursor=roto!");
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [{ campo: "cursor", mensaje: "El cursor no es válido" }]);
  });

  it("401 sin sesión", async () => {
    const res = await request(app).get("/compradores/organizadores/org-1/resenas");
    assert.equal(res.status, 401);
  });
});
