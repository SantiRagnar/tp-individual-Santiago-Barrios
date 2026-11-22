import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: US3 · Detalle de compra (FR-018 a FR-021, SC-004).
beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const con = (req, token) => req.set("Authorization", `Bearer ${token}`);
const detalle = async (numero, token) => con(request(app).get(`/compradores/compras/${numero}`), token ?? (await tokenDeComprador()));

describe("GET /compradores/compras/:numero — base", () => {
  it("200 con la compra de Sofía", async () => {
    const res = await detalle("A-1042");
    assert.equal(res.status, 200);
    assert.equal(res.body.compra.numero, "A-1042");
    assert.equal(res.body.compra.evento.nombre, "Hamlet en el Galpón");
  });

  it("401 sin token y con token de organizador", async () => {
    const sinToken = await request(app).get("/compradores/compras/A-1042");
    assert.equal(sinToken.status, 401);
    const organizador = await detalle("A-1042", await tokenDeOrganizador(LA_TRAMA));
    assert.equal(organizador.status, 401);
    assert.equal(organizador.body.error.codigo, "SESION_INVALIDA");
  });

  it("404 COMPRA_NO_ENCONTRADA para una inexistente y para una de otro comprador", async () => {
    for (const numero of ["A-9999", "A-0612"]) {
      const res = await detalle(numero);
      assert.equal(res.status, 404, numero);
      assert.equal(res.body.error.codigo, "COMPRA_NO_ENCONTRADA");
      assert.equal(res.body.error.mensaje, "No encontramos esta compra.");
    }
  });
});

describe("GET /compradores/compras/:numero — US3 (compras del seed de Sofía)", () => {
  it("A-1042: Platea × 2, $ 36.000, crédito, Galpón de Guevara, 13 días y se puede cancelar", async () => {
    const { compra } = (await detalle("A-1042")).body;
    assert.equal(compra.estado, "Confirmada");
    assert.equal(compra.tipoDeEntrada.nombre, "Platea");
    assert.equal(compra.cantidad, 2);
    assert.equal(compra.monto, 36000);
    assert.equal(compra.medioDePago, "Tarjeta de crédito");
    assert.equal(compra.evento.ubicacion, "Galpón de Guevara, Chacarita");
    assert.equal(compra.evento.fechaHora, "2026-11-21T21:00:00-03:00");
    assert.equal(compra.diasParaEvento, 13);
    assert.deepEqual(compra.acciones, { completarPago: false, cancelar: true, calificar: false });
    assert.equal(compra.motivoNoCancelable, null);
  });

  it("A-1037 (Pendiente): se puede completar el pago y cancelar", async () => {
    const { compra } = (await detalle("A-1037")).body;
    assert.deepEqual(compra.acciones, { completarPago: true, cancelar: true, calificar: false });
  });

  it("A-0871 (Utilizada sin calificar): UTILIZADA y sin calificación", async () => {
    const { compra } = (await detalle("A-0871")).body;
    assert.equal(compra.motivoNoCancelable, "UTILIZADA");
    assert.equal(compra.calificacion, null);
    assert.deepEqual(compra.acciones, { completarPago: false, cancelar: false, calificar: true });
  });

  it("A-0790 (Reembolsada): REEMBOLSADA", async () => {
    assert.equal((await detalle("A-0790")).body.compra.motivoNoCancelable, "REEMBOLSADA");
  });

  it("A-0655 (Utilizada y calificada): UTILIZADA con su calificación", async () => {
    const { compra } = (await detalle("A-0655")).body;
    assert.equal(compra.motivoNoCancelable, "UTILIZADA");
    assert.equal(compra.calificacion.puntaje, 4);
    assert.equal(compra.calificacion.comentario, "Muy buena puesta, el final te deja pensando.");
    assert.equal(compra.evento.organizador.nombre, "Compañía La Trama");
  });

  it("después de Hamlet, A-1042 dice EVENTO_REALIZADO y no tiene cuenta regresiva", async () => {
    fijarAhora(new Date("2026-11-22T10:00:00-03:00"));
    const { compra } = (await detalle("A-1042")).body;
    assert.equal(compra.motivoNoCancelable, "EVENTO_REALIZADO");
    assert.equal(compra.diasParaEvento, null);
    assert.deepEqual(compra.acciones, { completarPago: false, cancelar: false, calificar: false });
  });

  it("si el organizador renombra el tipo después, la compra conserva el nombre comprado (research R6)", async () => {
    const organizador = await tokenDeOrganizador(LA_TRAMA);
    const actual = (await con(request(app).get("/organizadores/eventos/evt-1"), organizador)).body.evento;
    const edicion = await con(request(app).put("/organizadores/eventos/evt-1"), organizador).send({
      nombre: actual.nombre,
      descripcion: actual.descripcion,
      categoria: actual.categoria,
      fechaHora: actual.fechaHora,
      ubicacion: actual.ubicacion,
      imagenId: actual.imagenId,
      materialMultimedia: actual.materialMultimedia,
      tiposDeEntrada: actual.tiposDeEntrada.map(({ id, nombre, cupo, precio }) => ({ id, nombre: id === "tip-2" ? "Platea baja" : nombre, cupo, precio })),
      estado: "Publicado",
    });
    assert.equal(edicion.status, 200);
    assert.equal((await detalle("A-1042")).body.compra.tipoDeEntrada.nombre, "Platea");
  });
});
