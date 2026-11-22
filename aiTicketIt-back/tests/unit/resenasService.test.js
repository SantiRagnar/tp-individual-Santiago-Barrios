import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { DatosInvalidos, OrganizadorNoEncontrado } from "../../errors/ErrorDeDominio.js";
import * as organizadoresRepository from "../../repository/organizadoresRepository.js";
import * as resenasService from "../../services/resenasService.js";
import { crearComprasCalificadas } from "../helpers/compradores.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

const numeros = (pagina) => pagina.resenas.map(({ compra }) => compra.numero);

// research R8, R9 y FR-024.
describe("resenasService.pagina", () => {
  it("La Trama: sus 4 reseñas, la más reciente primero, con comprador y evento", () => {
    const pagina = resenasService.pagina("org-1", null);
    assert.deepEqual(numeros(pagina), ["A-0631", "A-0618", "A-0612", "A-0655"]);
    assert.equal(pagina.total, 4);
    assert.equal(pagina.siguiente, null);
    const [primera] = pagina.resenas;
    assert.equal(primera.comprador.nombre, "Diego");
    assert.equal(primera.evento.nombre, "Edipo Rey");
  });

  it("con 12 reseñas: páginas de 5, 5 y 2 siguiendo `siguiente`", () => {
    crearComprasCalificadas("org-2", "evt-9", 9, { desde: "2026-10-01T10:00:00-03:00" }); // 3 del seed + 9
    const tamanos = [];
    const vistos = [];
    let cursor = null;
    do {
      const pagina = resenasService.pagina("org-2", cursor);
      assert.equal(pagina.total, 12);
      tamanos.push(pagina.resenas.length);
      vistos.push(...numeros(pagina));
      cursor = pagina.siguiente;
    } while (cursor);
    assert.deepEqual(tamanos, [5, 5, 2]);
    assert.equal(new Set(vistos).size, 12);
    assert.deepEqual(vistos.slice(-3), ["A-0559", "A-0547", "A-0540"]);
  });

  it("una reseña nueva entre dos páginas no repite ni saltea las siguientes", () => {
    crearComprasCalificadas("org-2", "evt-9", 9, { desde: "2026-10-01T10:00:00-03:00" });
    const primera = resenasService.pagina("org-2", null);
    crearComprasCalificadas("org-2", "evt-9", 1, { desde: "2026-11-01T10:00:00-03:00" });
    const resto = [];
    let cursor = primera.siguiente;
    while (cursor) {
      const pagina = resenasService.pagina("org-2", cursor);
      resto.push(...numeros(pagina));
      cursor = pagina.siguiente;
    }
    assert.equal(resto.filter((n) => numeros(primera).includes(n)).length, 0);
    assert.equal(numeros(primera).length + resto.length, 12);
  });

  it("un organizador sin reseñas: lista vacía y total 0", () => {
    organizadoresRepository.agregar({ id: "org-4", nombre: "Teatro Nuevo", email: "hola@teatronuevo.com", contrasenaHash: "scrypt$00$00" });
    assert.deepEqual(resenasService.pagina("org-4", null), { resenas: [], total: 0, siguiente: null });
  });

  it("organizador inexistente → OrganizadorNoEncontrado", () => {
    assert.throws(() => resenasService.pagina("org-999", null), OrganizadorNoEncontrado);
  });

  it("cursor inválido → DatosInvalidos en el campo cursor", () => {
    assert.throws(
      () => resenasService.pagina("org-1", "roto!"),
      (error) => error instanceof DatosInvalidos && error.campos[0].campo === "cursor",
    );
  });
});

describe("resenasService.resumen", () => {
  it("devuelve suma y cantidad del organizador", () => {
    assert.deepEqual(resenasService.resumen("org-2"), { suma: 11, cantidad: 3 });
  });
});
