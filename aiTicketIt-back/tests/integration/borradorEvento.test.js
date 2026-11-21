import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeOrganizador(LA_TRAMA);
});

const autorizado = (req) => req.set("Authorization", `Bearer ${token}`);
const crear = (body) => autorizado(request(app).post("/organizadores/eventos")).send(body);
const editar = (id, body) => autorizado(request(app).put(`/organizadores/eventos/${id}`)).send(body);

const gaviotaCompleta = (cambios = {}) => ({
  nombre: "La gaviota",
  descripcion: "Chéjov en clave de comedia triste.",
  categoria: "Drama",
  fechaHora: "2027-03-06T20:30:00-03:00",
  ubicacion: "Galpón de Guevara, Chacarita",
  imagenId: "img-seed-gaviota",
  materialMultimedia: [],
  tiposDeEntrada: [{ id: "tip-13", nombre: "General", cupo: 120, precio: 14000 }],
  estado: "Publicado",
  ...cambios,
});

describe("POST /organizadores/eventos — guardar borrador (US3, FR-014)", () => {
  it("201 Borrador con todo en null y sin tipos", async () => {
    const res = await crear({ estado: "Borrador" });
    assert.equal(res.status, 201);
    const { evento } = res.body;
    assert.equal(evento.estado, "Borrador");
    for (const campo of ["nombre", "descripcion", "categoria", "fechaHora", "ubicacion", "imagenId", "imagenUrl"]) {
      assert.equal(evento[campo], null, campo);
    }
    assert.deepEqual(evento.tiposDeEntrada, []);
    assert.deepEqual(evento.materialMultimedia, []);
  });

  it("un borrador con fecha pasada y precio negativo también se guarda", async () => {
    const res = await crear({
      estado: "Borrador",
      nombre: "Ensayo abierto",
      fechaHora: "2026-01-01T20:00:00-03:00",
      tiposDeEntrada: [{ nombre: "General", cupo: 10, precio: -5 }],
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.evento.tiposDeEntrada[0].precio, -5);
  });

  it("la forma se valida igual: cupo 1.5 → 400", async () => {
    const res = await crear({ estado: "Borrador", tiposDeEntrada: [{ cupo: 1.5 }] });
    assert.equal(res.status, 400);
    assert.deepEqual(
      res.body.error.campos.map((c) => c.campo),
      ["tiposDeEntrada.0.cupo"],
    );
  });

  it("aparece en Mis eventos con cupo 0 y vendidas 0", async () => {
    const { body } = await crear({ estado: "Borrador", nombre: "Ensayo abierto" });
    const res = await autorizado(request(app).get("/organizadores/eventos"));
    const borrador = res.body.eventos.find((e) => e.id === body.evento.id);
    assert.deepEqual(
      { estado: borrador.estado, cupo: borrador.cupo, vendidas: borrador.vendidas, fechaHora: borrador.fechaHora },
      { estado: "Borrador", cupo: 0, vendidas: 0, fechaHora: null },
    );
  });
});

describe("PUT /organizadores/eventos/:id — completar y publicar un borrador (US3)", () => {
  it("La gaviota con datos completos y estado Publicado → 200 Publicado", async () => {
    const res = await editar("evt-8", gaviotaCompleta());
    assert.equal(res.status, 200);
    assert.equal(res.body.evento.estado, "Publicado");
    assert.equal(res.body.evento.categoria, "Drama");
    assert.equal(res.body.evento.imagenUrl, "/imagenes/img-seed-gaviota");
  });

  it("con datos incompletos y estado Publicado → 400 y sigue Borrador", async () => {
    const res = await editar("evt-8", gaviotaCompleta({ ubicacion: null }));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [{ campo: "ubicacion", mensaje: "Indicá dónde se hace el evento" }]);

    const despues = await autorizado(request(app).get("/organizadores/eventos/evt-8"));
    assert.equal(despues.body.evento.estado, "Borrador");
    assert.equal(despues.body.evento.ubicacion, "A confirmar");
  });

  it("Borrador → Borrador guarda sin reglas de publicación", async () => {
    const res = await editar("evt-8", { estado: "Borrador", nombre: "La gaviota (versión 2)" });
    assert.equal(res.status, 200);
    assert.equal(res.body.evento.nombre, "La gaviota (versión 2)");
    assert.equal(res.body.evento.estado, "Borrador");
  });

  it("401 sin token y 400 con forma inválida", async () => {
    assert.equal((await request(app).put("/organizadores/eventos/evt-8").send({ estado: "Borrador" })).status, 401);
    assert.equal((await editar("evt-8", { estado: "Cancelado" })).status, 400);
  });
});
