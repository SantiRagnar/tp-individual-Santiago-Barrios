import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { crearEventoConCupo } from "../helpers/compras.js";
import { HOY, MARTIN, tokenDeComprador } from "../helpers/sesion.js";

// specs/006-calificaciones-opiniones: US3 · Recordatorio de calificación en Explorar (FR-014, FR-015).
// Contrato: contracts/calificaciones.openapi.yaml § GET /compradores/calificaciones/pendiente.
let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const con = (req, t = token) => req.set("Authorization", `Bearer ${t}`);
const pendiente = (t = token) => con(request(app).get("/compradores/calificaciones/pendiente"), t);
const calificar = (numero) => con(request(app).post(`/compradores/compras/${numero}/calificacion`)).send({ puntaje: 3 });

describe("GET /compradores/calificaciones/pendiente — US3", () => {
  it("Sofía → 200 con A-0871 (vista Compra completa)", async () => {
    const res = await pendiente();
    assert.equal(res.status, 200);
    assert.equal(res.body.compra.numero, "A-0871");
    assert.equal(res.body.compra.evento.nombre, "Tango en el Conventillo");
    assert.equal(res.body.compra.acciones.calificar, true);
  });

  it("un comprador sin compras pendientes → { compra: null }", async () => {
    const res = await pendiente(await tokenDeComprador(MARTIN));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { compra: null });
  });

  it("después de calificar A-0871 → null", async () => {
    await calificar("A-0871");
    assert.equal((await pendiente()).body.compra, null);
  });

  it("con dos pendientes, después de calificar la primera devuelve la otra (US3-4)", async () => {
    const { eventoId, tipoId } = crearEventoConCupo({ fecha: "2026-11-01T21:00:00-03:00", vendidas: 1 });
    comprasRepository.guardar(
      {
        numero: "A-5000",
        compradorId: "cmp-1",
        eventoId,
        tipoDeEntradaId: tipoId,
        tipoDeEntradaNombre: "General",
        precioUnitario: 10000,
        cantidad: 1,
        monto: 10000,
        medioDePago: "Mercado Pago",
        estado: "Utilizada",
        creadaEn: "2026-10-20T10:00:00-03:00",
      },
      { organizadorId: "org-1" },
    );
    assert.equal((await pendiente()).body.compra.numero, "A-5000"); // evento del 1/11, más reciente que Tango (18/10)
    await calificar("A-5000");
    assert.equal((await pendiente()).body.compra.numero, "A-0871");
  });

  it("sin sesión → 401", async () => {
    assert.equal((await request(app).get("/compradores/calificaciones/pendiente")).status, 401);
  });
});
