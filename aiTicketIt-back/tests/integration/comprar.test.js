import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { crearEventoConCupo, cuerpoDeCompra } from "../helpers/compras.js";
import { HOY, LA_TRAMA, tokenDeComprador, tokenDeOrganizador } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: US1 · Comprar con pago simulado (FR-005, FR-008 a FR-011, FR-026,
// FR-028, FR-030). Contrato: contracts/compras.openapi.yaml POST /compradores/compras.
let token;
beforeEach(async () => {
  reiniciarEstado();
  fijarAhora(HOY);
  token = await tokenDeComprador();
});

const con = (req, t = token) => req.set("Authorization", `Bearer ${t}`);
const pagar = (body, t = token) => con(request(app).post("/compradores/compras"), t).send(body);
const disponiblesDe = async (eventoId, tipoId) =>
  (await con(request(app).get(`/compradores/eventos/${eventoId}`))).body.evento.tiposDeEntrada.find((t) => t.id === tipoId).disponibles;

describe("POST /compradores/compras — US1", () => {
  it("201 con la compra Confirmada del ejemplo del contrato", async () => {
    const res = await pagar(cuerpoDeCompra());
    assert.equal(res.status, 201);
    const { compra } = res.body;
    assert.equal(compra.numero, "A-1043");
    assert.equal(compra.estado, "Confirmada");
    assert.equal(compra.monto, 36000);
    assert.equal(compra.medioDePago, "Tarjeta de crédito");
    assert.deepEqual(compra.tipoDeEntrada, { id: "tip-2", nombre: "Platea", precioUnitario: 18000 });
    assert.equal(compra.evento.nombre, "Hamlet en el Galpón");
    assert.equal(compra.evento.organizador.nombre, "Compañía La Trama");
    assert.equal(compra.diasParaEvento, 13);
    assert.deepEqual(compra.acciones, { completarPago: false, cancelar: true });
    assert.equal(compra.motivoNoCancelable, null);
  });

  it("descuenta los lugares: el comprador ve 10 Plateas y el organizador 70 vendidas (FR-026)", async () => {
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 12);
    await pagar(cuerpoDeCompra());
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 10);
    const organizador = await con(request(app).get("/organizadores/eventos/evt-1"), await tokenDeOrganizador(LA_TRAMA));
    assert.equal(organizador.body.evento.tiposDeEntrada.find((t) => t.id === "tip-2").vendidas, 70);
  });

  it("la compra aparece en el detalle de compra del comprador", async () => {
    const { body } = await pagar(cuerpoDeCompra());
    const detalle = await con(request(app).get(`/compradores/compras/${body.compra.numero}`));
    assert.equal(detalle.status, 200);
    assert.equal(detalle.body.compra.estado, "Confirmada");
  });

  it("400 DATOS_INVALIDOS con campos (cantidad 11, medio inválido)", async () => {
    const res = await pagar(cuerpoDeCompra({ cantidad: 11, medioDePago: "Efectivo" }));
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    assert.deepEqual(
      res.body.error.campos.map((c) => c.campo).sort(),
      ["cantidad", "medioDePago"],
    );
  });

  it("401 sin token y con token de organizador", async () => {
    const sinToken = await request(app).post("/compradores/compras").send(cuerpoDeCompra());
    assert.equal(sinToken.status, 401);
    const organizador = await pagar(cuerpoDeCompra(), await tokenDeOrganizador(LA_TRAMA));
    assert.equal(organizador.status, 401);
  });

  it("404 EVENTO_NO_ENCONTRADO para un Borrador y un Finalizado", async () => {
    for (const body of [
      cuerpoDeCompra({ eventoId: "evt-8", tipoDeEntradaId: "tip-13", precioUnitario: 14000, cantidad: 1 }),
      cuerpoDeCompra({ eventoId: "evt-7", tipoDeEntradaId: "tip-12", precioUnitario: 10000, cantidad: 1 }),
    ]) {
      const res = await pagar(body);
      assert.equal(res.status, 404, body.eventoId);
      assert.equal(res.body.error.codigo, "EVENTO_NO_ENCONTRADO");
    }
  });

  it("409 PRECIO_CAMBIADO si el organizador cambió el precio mientras el comprador pagaba (FR-030)", async () => {
    const organizador = await tokenDeOrganizador(LA_TRAMA);
    const edicion = await con(request(app).put("/organizadores/eventos/evt-3"), organizador).send({
      nombre: "Bodas de sangre",
      descripcion: "El clásico de Lorca, con música en vivo y un elenco de doce actores.",
      categoria: "Drama",
      fechaHora: "2026-12-05T20:00:00-03:00",
      ubicacion: "Teatro San Martín, Sala Casacuberta",
      imagenId: "img-seed-bodas",
      materialMultimedia: [],
      tiposDeEntrada: [
        { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
        { id: "tip-7", nombre: "Platea", cupo: 60, precio: 23000 },
      ],
      estado: "Publicado",
    });
    assert.equal(edicion.status, 200);

    const res = await pagar(cuerpoDeCompra({ eventoId: "evt-3", tipoDeEntradaId: "tip-7", precioUnitario: 21000, cantidad: 1 }));
    assert.equal(res.status, 409);
    assert.equal(res.body.error.codigo, "PRECIO_CAMBIADO");
    // Con el precio nuevo, sí.
    const conPrecioNuevo = await pagar(cuerpoDeCompra({ eventoId: "evt-3", tipoDeEntradaId: "tip-7", precioUnitario: 23000, cantidad: 1 }));
    assert.equal(conPrecioNuevo.status, 201);
    assert.equal(conPrecioNuevo.body.compra.monto, 23000);
  });

  it("409 PRECIO_CAMBIADO con un tipo que no existe en el evento", async () => {
    const res = await pagar(cuerpoDeCompra({ tipoDeEntradaId: "tip-6" }));
    assert.equal(res.status, 409);
    assert.equal(res.body.error.codigo, "PRECIO_CAMBIADO");
  });

  it("409 LUGARES_INSUFICIENTES para el VIP agotado y para un evento sin lugares en ningún tipo (FR-028)", async () => {
    const vip = await pagar(cuerpoDeCompra({ tipoDeEntradaId: "tip-3", precioUnitario: 26000, cantidad: 1 }));
    assert.equal(vip.status, 409);
    assert.equal(vip.body.error.codigo, "LUGARES_INSUFICIENTES");

    const { eventoId, tipoId } = crearEventoConCupo({ cupo: 5, vendidas: 5 });
    const agotado = await pagar(cuerpoDeCompra({ eventoId, tipoDeEntradaId: tipoId, precioUnitario: 10000, cantidad: 1 }));
    assert.equal(agotado.status, 409);
    assert.equal(agotado.body.error.codigo, "LUGARES_INSUFICIENTES");
  });

  it("un 409 no crea compras ni toca lugares", async () => {
    await pagar(cuerpoDeCompra({ precioUnitario: 1 }));
    await pagar(cuerpoDeCompra({ tipoDeEntradaId: "tip-3", precioUnitario: 26000, cantidad: 1 }));
    // El número siguiente no se consumió y no existe ninguna compra nueva.
    assert.equal((await con(request(app).get("/compradores/compras/A-1043"))).status, 404);
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 12);
    assert.equal((await pagar(cuerpoDeCompra())).body.compra.numero, "A-1043");
  });

  it("el mismo comprador puede volver a comprar el mismo tipo (FR-005)", async () => {
    assert.equal((await pagar(cuerpoDeCompra())).status, 201);
    assert.equal((await pagar(cuerpoDeCompra())).status, 201);
    assert.equal(await disponiblesDe("evt-1", "tip-2"), 8);
  });
});
