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
