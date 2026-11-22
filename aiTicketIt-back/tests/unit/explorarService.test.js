import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as explorarService from "../../services/explorarService.js";
import { fijarAhora } from "../../services/reloj.js";
import { DatosInvalidos, EventoNoEncontrado } from "../../errors/ErrorDeDominio.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import { codificar } from "../../services/cursor.js";
import { crearComprasCalificadas, crearEventosVisibles } from "../helpers/compradores.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const ids = (pagina) => pagina.eventos.map(({ evento }) => evento.id);
const SOFIA = "cmp-1";

describe("explorarService.listar — US1 (FR-001, research R2, R5)", () => {
  it("solo eventos visibles, por fecha (el más próximo primero)", () => {
    const pagina = explorarService.listar(SOFIA, {});
    assert.deepEqual(ids(pagina), ["evt-2", "evt-1", "evt-4", "evt-3", "evt-5"]);
    assert.equal(pagina.total, 5);
    assert.equal(pagina.siguiente, null);
  });

  it("cada evento trae su contexto: organizador, resumen de calificaciones y esFavorito", () => {
    const { contexto } = explorarService.listar(SOFIA, {}).eventos.find(({ evento }) => evento.id === "evt-1");
    assert.equal(contexto.organizador.nombre, "Compañía La Trama");
    assert.deepEqual(contexto.resumen, { suma: 18, cantidad: 4 });
    assert.equal(contexto.esFavorito, false);
  });

  it("un evento cuya fecha ya pasó deja de aparecer", () => {
    fijarAhora("2026-11-15T10:00:00-03:00");
    assert.deepEqual(ids(explorarService.listar(SOFIA, {})), ["evt-1", "evt-4", "evt-3", "evt-5"]);
  });
});

describe("explorarService.listar — búsqueda y categoría (US2, research R6)", () => {
  it("la búsqueda no distingue mayúsculas ni tildes y mira nombre, ubicación y organizador", () => {
    assert.deepEqual(ids(explorarService.listar(SOFIA, { busqueda: "galpon" })), ["evt-1"]);
    assert.deepEqual(ids(explorarService.listar(SOFIA, { busqueda: "LUMBRE" })), ["evt-4"]);
    assert.deepEqual(ids(explorarService.listar(SOFIA, { busqueda: "konex" })), ["evt-4"]);
    assert.deepEqual(ids(explorarService.listar(SOFIA, { busqueda: "Bodas" })), ["evt-3"]);
  });

  it("filtra por categoría", () => {
    assert.deepEqual(ids(explorarService.listar(SOFIA, { categoria: "Comedia" })), ["evt-2", "evt-5"]);
  });

  it("búsqueda y categoría se combinan, y total es el del resultado", () => {
    const pagina = explorarService.listar(SOFIA, { categoria: "Comedia", busqueda: "impro" });
    assert.deepEqual(ids(pagina), ["evt-5"]);
    assert.equal(pagina.total, 1);
  });

  it("sin resultados: lista vacía y total 0", () => {
    const pagina = explorarService.listar(SOFIA, { busqueda: "xyz" });
    assert.deepEqual(pagina.eventos, []);
    assert.equal(pagina.total, 0);
    assert.equal(pagina.siguiente, null);
  });
});

describe("explorarService.listar — orden (US2, research R5)", () => {
  it("precio: menor precioDesde primero", () => {
    assert.deepEqual(ids(explorarService.listar(SOFIA, { orden: "precio" })), ["evt-5", "evt-2", "evt-4", "evt-1", "evt-3"]);
  });

  it("puntaje: La Trama 4.5, Lumbre 4.0, Club del Chiste 3.7; dentro de cada uno por fecha", () => {
    assert.deepEqual(ids(explorarService.listar(SOFIA, { orden: "puntaje" })), ["evt-1", "evt-3", "evt-4", "evt-2", "evt-5"]);
  });

  it("puntaje: un organizador sin reseñas va al final", () => {
    const [nuevo] = crearEventosVisibles(1, { organizadorId: "org-9", desde: "2026-11-10" });
    assert.equal(ids(explorarService.listar(SOFIA, { orden: "puntaje" })).at(-1), nuevo.id);
  });

  it("puntaje: ordena por el promedio sin redondear", () => {
    // Lumbre pasa de 8/2 a 58/13 = 4.46: redondeado se ve "4.5" como La Trama (18/4 = 4.5), pero va debajo.
    crearComprasCalificadas("org-3", "evt-6", 6, { puntaje: 5 });
    crearComprasCalificadas("org-3", "evt-6", 5, { puntaje: 4, desde: "2026-10-05T10:00:00-03:00" });
    assert.deepEqual(ids(explorarService.listar(SOFIA, { orden: "puntaje" })).slice(0, 3), ["evt-1", "evt-3", "evt-4"]);
  });

  it("empates: por fecha y después por id", () => {
    const evento = eventosRepository.buscarPorId("evt-4");
    evento.tiposDeEntrada[0].precio = 8000; // empata con Impro Express ($ 8.000), que es más tarde
    assert.deepEqual(ids(explorarService.listar(SOFIA, { orden: "precio" })).slice(0, 2), ["evt-4", "evt-5"]);
  });
});

describe("explorarService.listar — paginación por cursor (US2, research R4)", () => {
  const recorrer = (criterio) => {
    const paginas = [];
    let cursor = null;
    do {
      const pagina = explorarService.listar(SOFIA, { ...criterio, cursor });
      paginas.push(pagina);
      cursor = pagina.siguiente;
    } while (cursor);
    return paginas;
  };

  it("con 23 eventos visibles: páginas de 10, 10 y 3, sin repetidos y con total 23", () => {
    crearEventosVisibles(18);
    for (const orden of ["fecha", "precio", "puntaje"]) {
      const paginas = recorrer({ orden });
      assert.deepEqual(paginas.map((p) => p.eventos.length), [10, 10, 3], orden);
      assert.ok(paginas.every((p) => p.total === 23));
      const todos = paginas.flatMap(ids);
      assert.equal(new Set(todos).size, 23, orden);
      if (orden === "fecha") {
        const fechas = paginas.flatMap((p) => p.eventos.map(({ evento }) => new Date(evento.fechaHora).getTime()));
        assert.ok(fechas.every((f, i) => i === 0 || fechas[i - 1] <= f), "ordenado por fecha a través de las páginas");
      }
    }
  });

  it("un evento que se publica entre dos páginas no repite ni saltea los que ya se veían", () => {
    crearEventosVisibles(18);
    const primera = explorarService.listar(SOFIA, {});
    const vistos = ids(primera);
    // Uno nuevo más temprano que todos: queda antes del cursor.
    crearEventosVisibles(1, { organizadorId: "org-2", desde: "2026-11-10" });
    const resto = [];
    let cursor = primera.siguiente;
    while (cursor) {
      const pagina = explorarService.listar(SOFIA, { cursor });
      resto.push(...ids(pagina));
      cursor = pagina.siguiente;
    }
    assert.equal(resto.filter((id) => vistos.includes(id)).length, 0);
    assert.equal(vistos.length + resto.length, 23);
  });

  it("un cursor inválido o de otro orden → DatosInvalidos en el campo cursor", () => {
    crearEventosVisibles(18);
    const deFecha = explorarService.listar(SOFIA, { orden: "fecha" }).siguiente;
    for (const [orden, cursor] of [["fecha", "roto!"], ["precio", deFecha], ["fecha", codificar([1, 2, 3])]]) {
      assert.throws(
        () => explorarService.listar(SOFIA, { orden, cursor }),
        (error) => error instanceof DatosInvalidos && error.campos[0].campo === "cursor" && error.campos[0].mensaje === "El cursor no es válido",
      );
    }
  });
});

describe("explorarService.obtener — US3 (research R3)", () => {
  it("un evento visible trae su contexto y la primera página de reseñas del organizador", () => {
    const { evento, contexto, resenas } = explorarService.obtener(SOFIA, "evt-1");
    assert.equal(evento.nombre, "Hamlet en el Galpón");
    assert.equal(contexto.organizador.id, "org-1");
    assert.deepEqual(contexto.resumen, { suma: 18, cantidad: 4 });
    assert.equal(resenas.resenas.length, 4);
    assert.equal(resenas.siguiente, null);
  });

  for (const [caso, id] of [["Borrador", "evt-8"], ["Finalizado", "evt-7"], ["inexistente", "evt-999"]]) {
    it(`${caso} → EventoNoEncontrado`, () => {
      assert.throws(() => explorarService.obtener(SOFIA, id), EventoNoEncontrado);
    });
  }
});
