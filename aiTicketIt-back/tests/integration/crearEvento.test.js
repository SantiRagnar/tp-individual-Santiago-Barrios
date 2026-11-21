import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { CLUB_DEL_CHISTE, HOY, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeOrganizador(LA_TRAMA);
});

const crear = (body, conToken = token) =>
  request(app).post("/organizadores/eventos").set("Authorization", `Bearer ${conToken}`).send(body);

const valido = (cambios = {}) => ({
  nombre: "Las brujas de Salem",
  descripcion: "Clásico de Arthur Miller en versión de cámara.",
  categoria: "Drama",
  fechaHora: "2026-12-19T21:00:00-03:00",
  ubicacion: "Galpón de Guevara, Chacarita",
  materialMultimedia: [{ nombre: "trailer.mp4", tipo: "video" }],
  tiposDeEntrada: [
    { nombre: "General", cupo: 120, precio: 13000 },
    { nombre: "Platea", cupo: 60, precio: 19000 },
  ],
  estado: "Publicado",
  ...cambios,
});

const campos = (res) => res.body.error.campos.map((c) => c.campo);

describe("POST /organizadores/eventos — publicar (US2)", () => {
  it("401 sin token", async () => {
    const res = await request(app).post("/organizadores/eventos").send(valido());
    assert.equal(res.status, 401);
  });

  it("400 con todos los campos que faltan para publicar", async () => {
    const res = await crear({ estado: "Publicado" });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    assert.deepEqual(campos(res), ["nombre", "fechaHora", "ubicacion", "tiposDeEntrada"]);
  });

  it("400 'La fecha tiene que ser futura' con una fecha pasada", async () => {
    const res = await crear(valido({ fechaHora: "2026-11-01T21:00:00-03:00" }));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [{ campo: "fechaHora", mensaje: "La fecha tiene que ser futura" }]);
  });

  it("400 con 'Platea' y 'platea' en el segundo tipo", async () => {
    const res = await crear(
      valido({
        tiposDeEntrada: [
          { nombre: "Platea", cupo: 10, precio: 1 },
          { nombre: "platea", cupo: 10, precio: 1 },
        ],
      }),
    );
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [
      { campo: "tiposDeEntrada.1.nombre", mensaje: "Ya hay una entrada con este nombre" },
    ]);
  });

  it("400 por forma inválida antes de las reglas (cupo no entero)", async () => {
    const res = await crear(valido({ tiposDeEntrada: [{ nombre: "General", cupo: 1.5, precio: 1 }] }));
    assert.equal(res.status, 400);
    assert.deepEqual(campos(res), ["tiposDeEntrada.0.cupo"]);
  });

  it("201 Publicado con 0 vendidas; aparece en Mis eventos de La Trama y no en el de otro (SC-002)", async () => {
    const res = await crear(valido());
    assert.equal(res.status, 201);
    const { evento } = res.body;
    assert.equal(evento.id, "evt-9");
    assert.equal(evento.estado, "Publicado");
    assert.equal(evento.vendidas, 0);
    assert.equal(evento.cupo, 180);
    assert.deepEqual(evento.materialMultimedia, [{ nombre: "trailer.mp4", tipo: "video" }]);
    assert.ok(evento.tiposDeEntrada.every((t) => t.vendidas === 0 && t.disponibles === t.cupo));

    const mios = await request(app).get("/organizadores/eventos").set("Authorization", `Bearer ${token}`);
    assert.ok(mios.body.eventos.some((e) => e.id === "evt-9"));

    const otro = await tokenDeOrganizador(CLUB_DEL_CHISTE);
    const ajenos = await request(app).get("/organizadores/eventos").set("Authorization", `Bearer ${otro}`);
    assert.ok(!ajenos.body.eventos.some((e) => e.id === "evt-9"));
    const directo = await request(app).get("/organizadores/eventos/evt-9").set("Authorization", `Bearer ${otro}`);
    assert.equal(directo.status, 404);
  });
});
