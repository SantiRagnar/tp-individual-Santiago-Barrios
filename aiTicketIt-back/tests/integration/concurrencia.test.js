import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { crearEventoConCupo, cuerpoDeCompra } from "../helpers/compras.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: SC-003 / FR-010. Nunca se venden más entradas que el cupo, aunque
// muchos compradores paguen a la vez (research R2: sección crítica sincrónica).
const COMPRADORES = [
  "sofia.gomez@correo.com",
  "martin.perez@correo.com",
  "lucia.fernandez@correo.com",
  "diego.romero@correo.com",
  "valentina.sosa@correo.com",
];

let tokens;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  tokens = await Promise.all(COMPRADORES.map((email) => tokenDeComprador(email)));
});

const vendidas = (eventoId) => eventosRepository.buscarPorId(eventoId).tiposDeEntrada[0].vendidas;

/** Dispara `pedidos` pagos en paralelo, repartidos entre los 5 compradores. */
function pagarEnParalelo(eventoId, tipoId, pedidos, cantidad) {
  return Promise.all(
    Array.from({ length: pedidos }, (_, i) =>
      request(app)
        .post("/compradores/compras")
        .set("Authorization", `Bearer ${tokens[i % tokens.length]}`)
        .send(cuerpoDeCompra({ eventoId, tipoDeEntradaId: tipoId, precioUnitario: 10000, cantidad })),
    ),
  );
}

describe("Concurrencia de pagos — SC-003", () => {
  it("50 pagos simultáneos de 1 entrada sobre 10 lugares: exactamente 10 compras", async () => {
    const { eventoId, tipoId } = crearEventoConCupo({ cupo: 10 });
    const respuestas = await pagarEnParalelo(eventoId, tipoId, 50, 1);

    const creadas = respuestas.filter((r) => r.status === 201);
    const rechazadas = respuestas.filter((r) => r.status === 409);
    assert.equal(creadas.length, 10);
    assert.equal(rechazadas.length, 40);
    assert.ok(rechazadas.every((r) => r.body.error.codigo === "LUGARES_INSUFICIENTES"));
    assert.equal(vendidas(eventoId), 10);
    assert.equal(new Set(creadas.map((r) => r.body.compra.numero)).size, 10, "números de compra distintos");
  });

  it("6 pagos simultáneos de 3 entradas sobre 10 lugares: 3 compras (9 vendidas) y 3 rechazos", async () => {
    const { eventoId, tipoId } = crearEventoConCupo({ cupo: 10 });
    const respuestas = await pagarEnParalelo(eventoId, tipoId, 6, 3);

    assert.equal(respuestas.filter((r) => r.status === 201).length, 3);
    assert.equal(respuestas.filter((r) => r.status === 409).length, 3);
    assert.equal(vendidas(eventoId), 9);
  });
});

// specs/006-calificaciones-opiniones: SC-003 / research R6. Una sola calificación por compra, aunque lleguen
// varios pedidos a la vez.
describe("Concurrencia de calificaciones — SC-003 (feature 006)", () => {
  it("20 calificaciones simultáneas de A-0871: un 201, 19 × 409 y una sola reseña nueva", async () => {
    const sofia = tokens[0];
    const resenasDeLumbre = async () =>
      (await request(app).get("/compradores/organizadores/org-3/resenas").set("Authorization", `Bearer ${sofia}`)).body.total;
    const antes = await resenasDeLumbre();

    const respuestas = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post("/compradores/compras/A-0871/calificacion")
          .set("Authorization", `Bearer ${sofia}`)
          .send({ puntaje: (i % 5) + 1 }),
      ),
    );

    const creadas = respuestas.filter((r) => r.status === 201);
    assert.equal(creadas.length, 1);
    assert.equal(respuestas.filter((r) => r.status === 409 && r.body.error.codigo === "COMPRA_YA_CALIFICADA").length, 19);
    assert.equal(await resenasDeLumbre(), antes + 1);
    const guardada = await request(app).get("/compradores/compras/A-0871").set("Authorization", `Bearer ${sofia}`);
    assert.equal(guardada.body.compra.calificacion.puntaje, creadas[0].body.compra.calificacion.puntaje);
  });
});
