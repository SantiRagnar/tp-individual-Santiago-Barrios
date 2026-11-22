import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

// US1 de specs/005-panel-evento: disponibilidad por tipo de entrada y Recaudado.

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("Panel del evento: disponibilidad y Recaudado (US1)", () => {
  it("GET /organizadores/eventos/evt-1 devuelve vendidas y disponibles por tipo (VIP agotada)", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/organizadores/eventos/evt-1"), token);
    assert.equal(res.status, 200);
    const tipos = res.body.evento.tiposDeEntrada.map(({ nombre, cupo, precio, vendidas, disponibles }) => ({ nombre, cupo, precio, vendidas, disponibles }));
    assert.deepEqual(tipos, [
      { nombre: "General", cupo: 150, precio: 12000, vendidas: 66, disponibles: 84 },
      { nombre: "Platea", cupo: 80, precio: 18000, vendidas: 68, disponibles: 12 },
      { nombre: "VIP", cupo: 20, precio: 26000, vendidas: 20, disponibles: 0 },
    ]);
  });

  it("GET …/evt-1/ventas devuelve el resumen de Hamlet y una página con la forma PaginaDeVentas", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/organizadores/eventos/evt-1/ventas"), token);
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), ["resumen", "siguiente", "ventas"]);
    assert.deepEqual(res.body.resumen, {
      recaudado: 2536000,
      entradasVendidas: 154,
      comprasActivas: 60,
      porEstado: { Todas: 62, "Pendiente de pago": 9, Confirmada: 51, Utilizada: 0, Cancelada: 1, Reembolsada: 1 },
    });
    assert.ok(Array.isArray(res.body.ventas));
    assert.ok(res.body.ventas.length <= 20);
    for (const venta of res.body.ventas) {
      assert.deepEqual(Object.keys(venta).sort(), [
        "acciones",
        "cantidad",
        "comprador",
        "creadaEn",
        "estado",
        "medioDePago",
        "monto",
        "numero",
        "tipoDeEntrada",
      ]);
    }
  });

  it("La gaviota (Borrador): resumen en cero y sin ventas", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await conToken(request(app).get("/organizadores/eventos/evt-8/ventas"), token);
    assert.equal(res.status, 200);
    assert.equal(res.body.resumen.recaudado, 0);
    assert.equal(res.body.resumen.entradasVendidas, 0);
    assert.equal(res.body.resumen.comprasActivas, 0);
    assert.equal(res.body.resumen.porEstado.Todas, 0);
    assert.deepEqual(res.body.ventas, []);
    assert.equal(res.body.siguiente, null);
  });
});
