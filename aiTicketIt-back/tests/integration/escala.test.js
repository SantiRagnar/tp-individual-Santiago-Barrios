import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { fijarAhora } from "../../services/reloj.js";
import { crearComprasCalificadas, crearEventosVisibles } from "../helpers/compradores.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY, tokenDeComprador } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

/** Promedio de varias mediciones, para que una pausa del recolector no haga fallar el test. */
async function medir(pedido, veces = 5) {
  await pedido(); // calentamiento
  const inicio = performance.now();
  for (let i = 0; i < veces; i++) await pedido();
  return (performance.now() - inicio) / veces;
}

// SC-007: con muchos datos, nunca viajan más de 10 eventos ni 5 reseñas por pedido.
describe("Escala (SC-007)", () => {
  it("1.000 eventos y 1.000 reseñas: páginas chicas, totales completos y respuestas rápidas", async () => {
    crearEventosVisibles(1000);
    crearComprasCalificadas("org-1", "evt-7", 996); // + 4 del seed = 1.000
    const token = await tokenDeComprador();
    const pedir = (ruta) => request(app).get(ruta).set("Authorization", `Bearer ${token}`);

    const explorar = await pedir("/compradores/eventos?orden=puntaje");
    assert.equal(explorar.body.eventos.length, 10);
    assert.equal(explorar.body.total, 1005);

    const detalle = await pedir("/compradores/eventos/evt-1");
    assert.equal(detalle.body.evento.resenas.resenas.length, 5);
    assert.equal(detalle.body.evento.organizador.cantidadResenas, 1000);

    const resenas = await pedir(`/compradores/organizadores/org-1/resenas?cursor=${detalle.body.evento.resenas.siguiente}`);
    assert.equal(resenas.body.resenas.length, 5);
    assert.equal(resenas.body.total, 1000);

    for (const ruta of ["/compradores/eventos?orden=puntaje", "/compradores/eventos/evt-1", "/compradores/eventos?busqueda=prueba&orden=precio"]) {
      const ms = await medir(() => pedir(ruta));
      assert.ok(ms < 200, `${ruta} tardó ${ms.toFixed(1)} ms`);
    }
  });
});
