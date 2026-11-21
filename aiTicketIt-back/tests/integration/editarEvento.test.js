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
const editar = (id, body) => autorizado(request(app).put(`/organizadores/eventos/${id}`)).send(body);

/** Bodas de sangre (evt-3) tal como la manda el formulario de edición. */
const bodas = (cambios = {}) => ({
  nombre: "Bodas de sangre",
  descripcion: "El clásico de Lorca, con música en vivo y un elenco de doce actores.",
  categoria: "Drama",
  fechaHora: "2026-12-05T20:00:00-03:00",
  ubicacion: "Teatro San Martín, Sala Casacuberta",
  imagenId: "img-seed-bodas",
  materialMultimedia: [],
  tiposDeEntrada: [
    { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
    { id: "tip-7", nombre: "Platea", cupo: 60, precio: 21000 },
  ],
  estado: "Publicado",
  ...cambios,
});

describe("PUT /organizadores/eventos/:id — editar con ventas (US4)", () => {
  it("cambia descripción y precio de Platea y agrega VIP; las vendidas se conservan (SC-006)", async () => {
    const res = await editar(
      "evt-3",
      bodas({
        descripcion: "Nueva versión con música en vivo.",
        tiposDeEntrada: [
          { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
          { id: "tip-7", nombre: "Platea", cupo: 60, precio: 23000 },
          { nombre: "VIP", cupo: 20, precio: 30000 },
        ],
      }),
    );
    assert.equal(res.status, 200);
    const { evento } = res.body;
    assert.equal(evento.descripcion, "Nueva versión con música en vivo.");
    assert.deepEqual(
      evento.tiposDeEntrada.map((t) => [t.nombre, t.precio, t.vendidas]),
      [
        ["General", 15000, 80],
        ["Platea", 23000, 30],
        ["VIP", 30000, 0],
      ],
    );
    assert.equal(evento.vendidas, 110);
    assert.equal(evento.cupo, 280);

    const lista = await autorizado(request(app).get("/organizadores/eventos"));
    const enLista = lista.body.eventos.find((e) => e.id === "evt-3");
    assert.deepEqual([enLista.vendidas, enLista.cupo], [110, 280]);
  });

  it("sin el tipo Platea → 400 'Tiene ventas: no se puede quitar'", async () => {
    const res = await editar("evt-3", bodas({ tiposDeEntrada: [{ id: "tip-6", nombre: "General", cupo: 200, precio: 15000 }] }));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [{ campo: "tiposDeEntrada", mensaje: "Tiene ventas: no se puede quitar" }]);
  });

  it("Platea con cupo 20 → 400 'El cupo no puede ser menor a las vendidas (30)'", async () => {
    const res = await editar(
      "evt-3",
      bodas({
        tiposDeEntrada: [
          { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
          { id: "tip-7", nombre: "Platea", cupo: 20, precio: 21000 },
        ],
      }),
    );
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [
      { campo: "tiposDeEntrada.1.cupo", mensaje: "El cupo no puede ser menor a las vendidas (30)" },
    ]);
  });

  it("estado Borrador sobre un Publicado → 409 NO_SE_PUEDE_DESPUBLICAR", async () => {
    const res = await editar("evt-3", bodas({ estado: "Borrador" }));
    assert.equal(res.status, 409);
    assert.equal(res.body.error.codigo, "NO_SE_PUEDE_DESPUBLICAR");
  });

  it("Edipo Rey (Finalizado) → 409 EVENTO_FINALIZADO", async () => {
    const res = await editar("evt-7", {
      nombre: "Edipo Rey",
      fechaHora: "2026-12-12T21:00:00-03:00",
      ubicacion: "Galpón de Guevara, Chacarita",
      tiposDeEntrada: [{ id: "tip-12", nombre: "General", cupo: 150, precio: 10000 }],
      estado: "Publicado",
    });
    assert.equal(res.status, 409);
    assert.deepEqual(res.body.error, {
      codigo: "EVENTO_FINALIZADO",
      mensaje: "El evento ya se realizó: no se puede editar.",
    });
  });

  it("un evento ajeno → 404 (FR-022)", async () => {
    const res = await editar("evt-2", bodas());
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
  });

  it("un Publicado sin nombre → 400 'Poné un nombre al evento'", async () => {
    const res = await editar("evt-3", bodas({ nombre: "   " }));
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [{ campo: "nombre", mensaje: "Poné un nombre al evento" }]);
  });
});
