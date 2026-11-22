import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import * as organizadoresRepository from "../../repository/organizadoresRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { crearEventoConCupo } from "../helpers/compras.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

// specs/006-calificaciones-opiniones: US2 · La calificación se publica como reseña del organizador
// (FR-005, FR-017, FR-018, SC-002, SC-005). Lumbre (org-3) tiene en el seed 2 reseñas que suman 8 (4.0).
const LUMBRE = "org-3";
const CARTAS_A_JULIETA = "evt-4";

let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const con = (req) => req.set("Authorization", `Bearer ${token}`);
const calificar = (numero, body) => con(request(app).post(`/compradores/compras/${numero}/calificacion`)).send(body);
const detalle = async (eventoId) => (await con(request(app).get(`/compradores/eventos/${eventoId}`))).body.evento;

/** Compra Utilizada sin calificar de Sofía (cmp-1) en `eventoId`. */
function utilizada(numero, eventoId, tipoDeEntradaId, organizadorId) {
  comprasRepository.guardar(
    {
      numero,
      compradorId: "cmp-1",
      eventoId,
      tipoDeEntradaId,
      tipoDeEntradaNombre: "General",
      precioUnitario: 10000,
      cantidad: 1,
      monto: 10000,
      medioDePago: "Tarjeta de débito",
      estado: "Utilizada",
      creadaEn: "2026-10-01T10:00:00-03:00",
    },
    { organizadorId },
  );
}

describe("La calificación se publica como reseña del organizador — US2", () => {
  it("la reseña nueva sale primera en el Detalle de los eventos del organizador, con contador y promedio nuevos", async () => {
    const antes = await detalle(CARTAS_A_JULIETA);
    assert.equal(antes.organizador.cantidadResenas, 2);
    assert.equal(antes.organizador.puntaje, 4);

    assert.equal((await calificar("A-0871", { puntaje: 5, comentario: "Hermosa puesta." })).status, 201);

    const despues = await detalle(CARTAS_A_JULIETA);
    assert.equal(despues.organizador.cantidadResenas, 3);
    assert.equal(despues.organizador.puntaje, 4.3); // (8 + 5) / 3 = 4.33 → 4.3
    assert.deepEqual(despues.resenas.resenas[0], {
      numeroCompra: "A-0871",
      autor: "Sofía G.",
      puntaje: 5,
      comentario: "Hermosa puesta.",
      evento: { id: "evt-6", nombre: "Tango en el Conventillo" },
      calificadaEn: HOY.toISOString(),
    });
  });

  it("también sale primera en las reseñas paginadas del organizador, con el total actualizado", async () => {
    await calificar("A-0871", { puntaje: 4 });
    const res = await con(request(app).get(`/compradores/organizadores/${LUMBRE}/resenas`));
    assert.equal(res.body.total, 3);
    assert.equal(res.body.resenas[0].numeroCompra, "A-0871");
    assert.equal(res.body.resenas[0].comentario, null); // el front lo muestra como "Sin comentario."
  });

  it("un organizador sin reseñas pasa a tener puntaje y su primera reseña", async () => {
    organizadoresRepository.agregar({ id: "org-4", nombre: "Teatro Nuevo", email: "hola@teatronuevo.com", contrasenaHash: "scrypt$00$00" });
    const { eventoId, tipoId } = crearEventoConCupo({ organizadorId: "org-4", vendidas: 1 });
    utilizada("A-5000", eventoId, tipoId, "org-4");

    const antes = await detalle(eventoId);
    assert.equal(antes.organizador.puntaje, null);
    assert.equal(antes.organizador.cantidadResenas, 0);

    assert.equal((await calificar("A-5000", { puntaje: 3 })).status, 201);
    const despues = await detalle(eventoId);
    assert.equal(despues.organizador.puntaje, 3);
    assert.equal(despues.organizador.cantidadResenas, 1);
    assert.equal(despues.resenas.resenas[0].numeroCompra, "A-5000");
  });

  it("el orden por Puntaje de Explorar usa los puntajes con las calificaciones nuevas", async () => {
    const organizadoresEnOrden = async () =>
      (await con(request(app).get("/compradores/eventos?orden=puntaje"))).body.eventos.map((e) => e.organizador.id);

    // Seed: La Trama 4.5 > Lumbre 4.0 > Club del Chiste 3.7.
    const antes = await organizadoresEnOrden();
    assert.ok(antes.indexOf("org-1") < antes.indexOf(LUMBRE));

    // Lumbre recibe cuatro 5★: (8 + 20) / 6 = 4.67 > 4.5.
    utilizada("A-5001", "evt-6", "tip-11", LUMBRE);
    utilizada("A-5002", "evt-6", "tip-11", LUMBRE);
    utilizada("A-5003", "evt-6", "tip-11", LUMBRE);
    for (const numero of ["A-0871", "A-5001", "A-5002", "A-5003"]) {
      assert.equal((await calificar(numero, { puntaje: 5 })).status, 201, numero);
    }

    const despues = await organizadoresEnOrden();
    assert.equal(despues[0], LUMBRE);
    assert.ok(despues.indexOf(LUMBRE) < despues.indexOf("org-1"));
    assert.equal((await detalle(CARTAS_A_JULIETA)).organizador.puntaje, 4.7);
  });
});
