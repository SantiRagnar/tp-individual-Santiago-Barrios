import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

// US2 de specs/005-panel-evento: tabla de Ventas con chips y "Ver más" (contracts/ventas.openapi.yaml).

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const ventas = async (token, query = "", evento = "evt-1") =>
  request(app).get(`/organizadores/eventos/${evento}/ventas${query}`).set("Authorization", `Bearer ${token}`);

describe("GET /organizadores/eventos/:id/ventas (US2)", () => {
  it("las filas tienen la forma Venta; A-1042 sale con Sofía Gómez, Platea × 2, Confirmada y $ 36.000", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const vistas = [];
    let cursor = null;
    do {
      const res = await ventas(token, cursor ? `?cursor=${cursor}` : "");
      assert.equal(res.status, 200);
      vistas.push(...res.body.ventas);
      cursor = res.body.siguiente;
    } while (cursor);
    const a1042 = vistas.find((v) => v.numero === "A-1042");
    assert.deepEqual(a1042, {
      numero: "A-1042",
      comprador: { nombre: "Sofía Gómez" },
      tipoDeEntrada: { id: "tip-2", nombre: "Platea" },
      cantidad: 2,
      estado: "Confirmada",
      medioDePago: "Tarjeta de crédito",
      monto: 36000,
      creadaEn: "2026-11-06T19:20:00-03:00",
      acciones: { marcarUtilizada: false },
    });
  });

  it("de la más reciente a la más antigua; 20 + 20 + 20 + 2 = 62 números únicos", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const tamanos = [];
    const numeros = [];
    let anterior = null;
    let cursor = null;
    do {
      const res = await ventas(token, cursor ? `?cursor=${cursor}` : "");
      tamanos.push(res.body.ventas.length);
      for (const venta of res.body.ventas) {
        if (anterior) assert.ok(anterior.creadaEn >= venta.creadaEn, `${anterior.numero} antes que ${venta.numero}`);
        anterior = venta;
        numeros.push(venta.numero);
      }
      cursor = res.body.siguiente;
    } while (cursor);
    assert.deepEqual(tamanos, [20, 20, 20, 2]);
    assert.equal(new Set(numeros).size, 62);
  });

  it("?estado=Utilizada en Hamlet → ventas vacío y porEstado sin cambios", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await ventas(token, "?estado=Utilizada");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.ventas, []);
    assert.equal(res.body.siguiente, null);
    assert.deepEqual(res.body.resumen.porEstado, { Todas: 62, "Pendiente de pago": 9, Confirmada: 51, Utilizada: 0, Cancelada: 1, Reembolsada: 1 });
  });

  it("?estado=Pendiente de pago → solo esas 9", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await ventas(token, "?estado=Pendiente%20de%20pago");
    assert.equal(res.body.ventas.length, 9);
    assert.ok(res.body.ventas.every((v) => v.estado === "Pendiente de pago"));
  });

  it("Edipo Rey lista A-0655 de Sofía Gómez como Utilizada", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await ventas(token, "?estado=Utilizada", "evt-7");
    const numeros = [];
    let body = res.body;
    numeros.push(...body.ventas.map((v) => v.numero));
    while (body.siguiente) {
      body = (await ventas(token, `?estado=Utilizada&cursor=${body.siguiente}`, "evt-7")).body;
      numeros.push(...body.ventas.map((v) => v.numero));
    }
    assert.ok(numeros.includes("A-0655"));
  });

  it("?estado=Confirmadas → 400 DATOS_INVALIDOS en el campo estado", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await ventas(token, "?estado=Confirmadas");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    assert.deepEqual(res.body.error.campos, [{ campo: "estado", mensaje: "Elegí un estado válido" }]);
  });

  it("?cursor=xyz → 400 en el campo cursor", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await ventas(token, "?cursor=xyz");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.campos[0].campo, "cursor");
  });
});
