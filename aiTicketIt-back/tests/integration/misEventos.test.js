import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { CLUB_DEL_CHISTE, HOY, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("GET /organizadores/eventos (US1)", () => {
  it("401 SESION_INVALIDA sin token", async () => {
    const res = await request(app).get("/organizadores/eventos");
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, "SESION_INVALIDA");
  });

  it("401 con un token de comprador", async () => {
    const token = await tokenDeComprador();
    const res = await conToken(request(app).get("/organizadores/eventos"), token);
    assert.equal(res.status, 401);
    assert.equal(res.body.error.codigo, "SESION_INVALIDA");
  });

  it("La Trama ve sus 4 eventos con estado, imagen y vendidas", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/organizadores/eventos"), token);
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.eventos.map((e) => e.id),
      ["evt-1", "evt-3", "evt-8", "evt-7"],
    );
    const [hamlet] = res.body.eventos;
    assert.deepEqual(hamlet, {
      id: "evt-1",
      nombre: "Hamlet en el Galpón",
      fechaHora: "2026-11-21T21:00:00-03:00",
      ubicacion: "Galpón de Guevara, Chacarita",
      categoria: "Teatro",
      estado: "Publicado",
      imagenUrl: "/imagenes/img-seed-hamlet",
      vendidas: 154,
      cupo: 250,
    });
    const estados = Object.fromEntries(res.body.eventos.map((e) => [e.id, e.estado]));
    assert.equal(estados["evt-7"], "Finalizado");
    assert.equal(estados["evt-8"], "Borrador");
  });

  it("Club del Chiste ve solo los suyos (SC-004)", async () => {
    const token = await tokenDeOrganizador(CLUB_DEL_CHISTE);
    const res = await conToken(request(app).get("/organizadores/eventos"), token);
    assert.deepEqual(
      res.body.eventos.map((e) => e.id),
      ["evt-2", "evt-5"],
    );
  });
});

describe("GET /organizadores/eventos/:id (US1)", () => {
  it("200 con el evento completo, sus tipos y los disponibles", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/organizadores/eventos/evt-1"), token);
    assert.equal(res.status, 200);
    const { evento } = res.body;
    assert.equal(evento.descripcion.length > 0, true);
    assert.equal(evento.imagenId, "img-seed-hamlet");
    assert.deepEqual(evento.tiposDeEntrada[1], {
      id: "tip-2",
      nombre: "Platea",
      cupo: 80,
      precio: 18000,
      vendidas: 68,
      disponibles: 12,
    });
    assert.deepEqual(evento.materialMultimedia[0], { nombre: "trailer.mp4", tipo: "video" });
  });

  it("404 EVENTO_NO_ENCONTRADO para un evento ajeno o inexistente (FR-022)", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    for (const id of ["evt-2", "evt-999"]) {
      const res = await conToken(request(app).get(`/organizadores/eventos/${id}`), token);
      assert.equal(res.status, 404, id);
      assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
      assert.equal(res.body.error.mensaje, "No encontramos el evento.");
    }
  });

  it("401 sin token", async () => {
    const res = await request(app).get("/organizadores/eventos/evt-1");
    assert.equal(res.status, 401);
  });
});
