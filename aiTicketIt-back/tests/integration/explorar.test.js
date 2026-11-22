import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { crearEventosVisibles } from "../helpers/compradores.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const explorar = async (query = "", token) => {
  const t = token ?? (await tokenDeComprador());
  return request(app).get(`/compradores/eventos${query}`).set("Authorization", `Bearer ${t}`);
};

describe("GET /compradores/eventos — US1 (FR-001, FR-002, FR-008)", () => {
  it("401 SESION_INVALIDA sin token", async () => {
    const res = await request(app).get("/compradores/eventos");
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, "SESION_INVALIDA");
  });

  it("401 con un token de organizador", async () => {
    const res = await explorar("", await tokenDeOrganizador(LA_TRAMA));
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, "SESION_INVALIDA");
  });

  it("200 con los 5 eventos visibles, por fecha, sin Borradores ni Finalizados", async () => {
    const res = await explorar();
    assert.equal(res.status, 200);
    assert.equal(res.body.total, 5);
    assert.equal(res.body.siguiente, null);
    const ids = res.body.eventos.map((e) => e.id);
    assert.deepEqual(ids, ["evt-2", "evt-1", "evt-4", "evt-3", "evt-5"]);
    for (const oculto of ["evt-6", "evt-7", "evt-8", "evt-9"]) assert.ok(!ids.includes(oculto), oculto);
  });

  it("la tarjeta de Hamlet trae todo lo que muestra la EventCard", async () => {
    const res = await explorar();
    const hamlet = res.body.eventos.find((e) => e.id === "evt-1");
    assert.deepEqual(hamlet, {
      id: "evt-1",
      nombre: "Hamlet en el Galpón",
      categoria: "Teatro",
      fechaHora: "2026-11-21T21:00:00-03:00",
      ubicacion: "Galpón de Guevara, Chacarita",
      imagenUrl: "/imagenes/img-seed-hamlet",
      precioDesde: 12000,
      agotado: false,
      organizador: { id: "org-1", nombre: "Compañía La Trama", puntaje: 4.5, cantidadResenas: 4 },
      esFavorito: false,
    });
  });
});

const idsDe = (res) => res.body.eventos.map((e) => e.id);

describe("GET /compradores/eventos — búsqueda, categoría y orden (US2, FR-004 a FR-007)", () => {
  it("?busqueda=galpon → solo Hamlet en el Galpón", async () => {
    const res = await explorar("?busqueda=galpon");
    assert.equal(res.status, 200);
    assert.deepEqual(idsDe(res), ["evt-1"]);
    assert.equal(res.body.total, 1);
  });

  it("?categoria=Comedia&orden=precio → Impro Express y después Risas a Domicilio", async () => {
    const res = await explorar("?categoria=Comedia&orden=precio");
    assert.deepEqual(idsDe(res), ["evt-5", "evt-2"]);
  });

  it("?orden=puntaje → La Trama, Lumbre, Club del Chiste", async () => {
    const res = await explorar("?orden=puntaje");
    assert.deepEqual(idsDe(res), ["evt-1", "evt-3", "evt-4", "evt-2", "evt-5"]);
  });

  it("?busqueda=xyz → total 0 y lista vacía", async () => {
    const res = await explorar("?busqueda=xyz");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { eventos: [], total: 0, siguiente: null });
  });

  for (const [query, campo, mensaje] of [
    ["?orden=nombre", "orden", "Elegí un orden válido"],
    ["?categoria=Rock", "categoria", "Elegí una categoría válida"],
    ["?cursor=roto!", "cursor", "El cursor no es válido"],
    [`?busqueda=${"a".repeat(101)}`, "busqueda", "La búsqueda puede tener hasta 100 caracteres"],
  ]) {
    it(`400 DATOS_INVALIDOS con ${query.slice(0, 20)}`, async () => {
      const res = await explorar(query);
      assert.equal(res.status, 400);
      assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
      assert.deepEqual(res.body.error.campos, [{ campo, mensaje }]);
    });
  }
});

describe("GET /compradores/eventos — paginación (US2, FR-025)", () => {
  it("con 23 eventos: páginas de 10, 10 y 3 siguiendo `siguiente`, con total 23", async () => {
    crearEventosVisibles(18);
    const token = await tokenDeComprador();
    const tamanos = [];
    const vistos = new Set();
    let cursor = null;
    do {
      const res = await explorar(cursor ? `?cursor=${cursor}` : "", token);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 23);
      tamanos.push(res.body.eventos.length);
      res.body.eventos.forEach((e) => vistos.add(e.id));
      cursor = res.body.siguiente;
    } while (cursor);
    assert.deepEqual(tamanos, [10, 10, 3]);
    assert.equal(vistos.size, 23);
  });
});
