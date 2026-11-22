import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as eventosService from "../../services/eventosService.js";
import {
  DatosInvalidos,
  EventoFinalizado,
  EventoNoEncontrado,
  NoSePuedeDespublicar,
} from "../../errors/ErrorDeDominio.js";
import * as imagenesService from "../../services/imagenesService.js";
import { ahora, fijarAhora } from "../../services/reloj.js";
import { aEventoResumenDto } from "../../dto/eventoDto.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

// El estado se deriva en el DTO a partir del evento guardado (research R1).
const estadoDe = (id) => aEventoResumenDto(eventosRepository.buscarPorId(id)).estado;

describe("eventosService — estado derivado (research R1, R2)", () => {
  it("un Publicado con fecha pasada sale Finalizado", () => {
    assert.equal(estadoDe("evt-7"), "Finalizado"); // Edipo Rey
    assert.equal(estadoDe("evt-6"), "Finalizado"); // Tango en el Conventillo
  });

  it("un Publicado con fecha futura sigue Publicado y un Borrador sigue Borrador", () => {
    assert.equal(estadoDe("evt-1"), "Publicado"); // Hamlet
    assert.equal(estadoDe("evt-8"), "Borrador"); // La gaviota
  });

  it("un Borrador con fecha pasada sigue Borrador", () => {
    const gaviota = eventosRepository.buscarPorId("evt-8");
    gaviota.fechaHora = "2026-01-01T20:00:00-03:00";
    assert.equal(estadoDe("evt-8"), "Borrador");
  });

  it("el estado se calcula con el reloj: al pasar la fecha, Hamlet queda Finalizado", () => {
    fijarAhora(new Date("2026-11-21T21:00:00-03:00"));
    assert.equal(estadoDe("evt-1"), "Finalizado");
  });

  it("reiniciarEstado() vuelve al reloj real", () => {
    reiniciarEstado();
    assert.ok(Math.abs(ahora().getTime() - Date.now()) < 1000);
  });
});

describe("eventosService — listar (research R15, R16)", () => {
  it("devuelve solo los eventos del organizador, en orden: próximos, sin fecha y Finalizados", () => {
    const ids = eventosService.listar("org-1").map((e) => e.id);
    // Hamlet (21/11), Bodas de sangre (5/12), La gaviota (6/3/2027), Edipo Rey (Finalizado)
    assert.deepEqual(ids, ["evt-1", "evt-3", "evt-8", "evt-7"]);
  });

  it("los Finalizados van del más reciente al más viejo", () => {
    const gaviota = eventosRepository.buscarPorId("evt-8");
    gaviota.estado = "Publicado";
    gaviota.fechaHora = "2026-08-01T20:00:00-03:00"; // Finalizado más viejo que Edipo Rey (12/9)
    const ids = eventosService.listar("org-1").map((e) => e.id);
    assert.deepEqual(ids, ["evt-1", "evt-3", "evt-7", "evt-8"]);
  });

  it("un borrador sin fecha va después de los que tienen fecha, ordenado por creación", () => {
    eventosRepository.guardar({ id: "evt-90", organizadorId: "org-1", estado: "Borrador", creadoEn: "2026-11-05T10:00:00-03:00" });
    eventosRepository.guardar({ id: "evt-91", organizadorId: "org-1", estado: "Borrador", creadoEn: "2026-11-01T10:00:00-03:00" });
    const ids = eventosService.listar("org-1").map((e) => e.id);
    assert.deepEqual(ids, ["evt-1", "evt-3", "evt-8", "evt-91", "evt-90", "evt-7"]);
  });

  it("no mezcla organizadores", () => {
    assert.deepEqual(eventosService.listar("org-2").map((e) => e.id), ["evt-2", "evt-5", "evt-9"]);
    assert.deepEqual(eventosService.listar("org-99"), []);
  });
});

describe("eventosService — obtener (research R16)", () => {
  it("devuelve un evento propio", () => {
    assert.equal(eventosService.obtener("org-1", "evt-1").nombre, "Hamlet en el Galpón");
  });

  it("un evento ajeno o inexistente lanza EventoNoEncontrado", () => {
    assert.throws(() => eventosService.obtener("org-1", "evt-2"), EventoNoEncontrado);
    assert.throws(() => eventosService.obtener("org-1", "evt-999"), EventoNoEncontrado);
  });
});

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const entradaValida = (cambios = {}) => ({
  nombre: "Las brujas de Salem",
  descripcion: "Clásico de Arthur Miller.",
  categoria: "Drama",
  fechaHora: "2026-12-19T21:00:00-03:00",
  ubicacion: "Galpón de Guevara",
  imagenId: null,
  materialMultimedia: [{ nombre: "trailer.mp4", tipo: "video" }],
  tiposDeEntrada: [
    { nombre: "General", cupo: 120, precio: 13000 },
    { nombre: "Platea", cupo: 60, precio: 19000 },
  ],
  estado: "Publicado",
  ...cambios,
});

/** Lanza y devuelve el error para inspeccionarlo. */
function errorDe(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  assert.fail("debería haber lanzado un error");
}

describe("eventosService — crear (FR-011, FR-012, FR-015, FR-016)", () => {
  it("Publicado inválido lanza DatosInvalidos con los campos de reglasEvento", () => {
    const error = errorDe(() => eventosService.crear("org-1", entradaValida({ nombre: null, ubicacion: null })));
    assert.ok(error instanceof DatosInvalidos);
    assert.deepEqual(
      error.campos.map((c) => c.campo),
      ["nombre", "ubicacion"],
    );
  });

  it("Publicado válido asigna evt-10, tipos nuevos con 0 vendidas, el organizador de la sesión y creadoEn", () => {
    const evento = eventosService.crear("org-1", entradaValida());
    assert.equal(evento.id, "evt-10");
    assert.equal(evento.organizadorId, "org-1"); // Evento.organizadorId
    assert.equal(evento.estado, "Publicado");
    assert.equal(evento.creadoEn, HOY.toISOString()); // Evento.creadoEn
    assert.deepEqual(
      evento.tiposDeEntrada.map((t) => [t.id, t.nombre, t.vendidas]), // TipoDeEntrada.vendidas
      [
        ["tip-15", "General", 0],
        ["tip-16", "Platea", 0],
      ],
    );
    assert.equal(eventosService.obtener("org-1", "evt-10").nombre, "Las brujas de Salem");
  });

  it("ignora los id y las vendidas que mande el cliente", () => {
    const evento = eventosService.crear(
      "org-1",
      entradaValida({ tiposDeEntrada: [{ id: "tip-1", nombre: "General", cupo: 10, precio: 1, vendidas: 9 }] }),
    );
    assert.equal(evento.tiposDeEntrada[0].id, "tip-15");
    assert.equal(evento.tiposDeEntrada[0].vendidas, 0);
    assert.equal(eventosRepository.buscarPorId("evt-1").tiposDeEntrada[0].vendidas, 66);
  });

  it("acepta una imagen subida por el mismo organizador", () => {
    const { id } = imagenesService.subir("org-1", "image/png", PNG);
    assert.equal(eventosService.crear("org-1", entradaValida({ imagenId: id })).imagenId, id);
  });

  it("una imagen inexistente o de otro organizador → DatosInvalidos en imagenId", () => {
    const ajena = imagenesService.subir("org-2", "image/png", PNG).id;
    for (const imagenId of ["no-existe", ajena]) {
      const error = errorDe(() => eventosService.crear("org-1", entradaValida({ imagenId })));
      assert.ok(error instanceof DatosInvalidos);
      assert.deepEqual(error.campos, [{ campo: "imagenId", mensaje: "Elegí una imagen que hayas subido" }]);
    }
  });
});

describe("eventosService — editar borrador (US3)", () => {
  const gaviota = (cambios = {}) =>
    entradaValida({
      nombre: "La gaviota",
      fechaHora: "2027-03-06T20:30:00-03:00",
      imagenId: "img-seed-gaviota",
      tiposDeEntrada: [{ id: "tip-13", nombre: "General", cupo: 120, precio: 14000 }],
      ...cambios,
    });

  it("un evento ajeno o inexistente lanza EventoNoEncontrado", () => {
    assert.throws(() => eventosService.editar("org-1", "evt-2", gaviota()), EventoNoEncontrado);
    assert.throws(() => eventosService.editar("org-1", "evt-999", gaviota()), EventoNoEncontrado);
  });

  it("Borrador → Borrador guarda sin reglas de publicación", () => {
    const evento = eventosService.editar("org-1", "evt-8", gaviota({ estado: "Borrador", ubicacion: null, tiposDeEntrada: [] }));
    assert.equal(evento.estado, "Borrador");
    assert.equal(evento.ubicacion, null);
    assert.deepEqual(evento.tiposDeEntrada, []);
  });

  it("Borrador → Publicado inválido lanza DatosInvalidos con los campos de reglasEvento", () => {
    const error = errorDe(() => eventosService.editar("org-1", "evt-8", gaviota({ nombre: null })));
    assert.ok(error instanceof DatosInvalidos);
    assert.deepEqual(error.campos, [{ campo: "nombre", mensaje: "Poné un nombre al evento" }]);
    assert.equal(eventosRepository.buscarPorId("evt-8").nombre, "La gaviota");
  });

  it("Borrador → Publicado válido queda Publicado", () => {
    assert.equal(eventosService.editar("org-1", "evt-8", gaviota()).estado, "Publicado");
  });

  it("conserva Evento.id, Evento.organizadorId y Evento.creadoEn aunque la entrada traiga otros", () => {
    const evento = eventosService.editar(
      "org-1",
      "evt-8",
      gaviota({ id: "evt-77", organizadorId: "org-2", creadoEn: "2020-01-01T00:00:00Z" }),
    );
    assert.equal(evento.id, "evt-8");
    assert.equal(evento.organizadorId, "org-1");
    assert.equal(evento.creadoEn, "2026-11-02T10:00:00-03:00");
  });

  it("un imagenId de otro organizador → error en imagenId", () => {
    const ajena = imagenesService.subir("org-2", "image/png", PNG).id;
    const error = errorDe(() => eventosService.editar("org-1", "evt-8", gaviota({ imagenId: ajena })));
    assert.deepEqual(error.campos, [{ campo: "imagenId", mensaje: "Elegí una imagen que hayas subido" }]);
  });
});

describe("eventosService — editar con ventas (US4, FR-019, FR-020)", () => {
  const bodas = (cambios = {}) =>
    entradaValida({
      nombre: "Bodas de sangre",
      fechaHora: "2026-12-05T20:00:00-03:00",
      imagenId: "img-seed-bodas",
      tiposDeEntrada: [
        { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
        { id: "tip-7", nombre: "Platea", cupo: 60, precio: 21000 },
      ],
      ...cambios,
    });

  it("Edipo Rey (Finalizado) lanza EventoFinalizado", () => {
    const edipo = entradaValida({ nombre: "Edipo Rey", tiposDeEntrada: [{ id: "tip-12", nombre: "General", cupo: 150, precio: 1 }] });
    assert.throws(() => eventosService.editar("org-1", "evt-7", edipo), EventoFinalizado);
  });

  it("Publicado → Borrador lanza NoSePuedeDespublicar", () => {
    assert.throws(() => eventosService.editar("org-1", "evt-3", bodas({ estado: "Borrador" })), NoSePuedeDespublicar);
  });

  it("cambiar el precio de Platea conserva TipoDeEntrada.vendidas por TipoDeEntrada.id", () => {
    const evento = eventosService.editar(
      "org-1",
      "evt-3",
      bodas({
        tiposDeEntrada: [
          // Otro orden: las vendidas siguen al id, no a la posición.
          { id: "tip-7", nombre: "Platea", cupo: 60, precio: 23000 },
          { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 },
        ],
      }),
    );
    assert.deepEqual(
      evento.tiposDeEntrada.map((t) => [t.id, t.precio, t.vendidas]),
      [
        ["tip-7", 23000, 30],
        ["tip-6", 15000, 80],
      ],
    );
  });

  it("un tipo nuevo recibe tip-N y vendidas 0", () => {
    const evento = eventosService.editar(
      "org-1",
      "evt-3",
      bodas({ tiposDeEntrada: [...bodas().tiposDeEntrada, { nombre: "VIP", cupo: 20, precio: 30000 }] }),
    );
    assert.deepEqual({ ...evento.tiposDeEntrada[2] }, { id: "tip-15", nombre: "VIP", cupo: 20, precio: 30000, vendidas: 0 });
  });

  it("un error de ventas y uno de publicación salen juntos en un solo DatosInvalidos", () => {
    const error = errorDe(() =>
      eventosService.editar(
        "org-1",
        "evt-3",
        bodas({ nombre: null, tiposDeEntrada: [{ id: "tip-6", nombre: "General", cupo: 200, precio: 15000 }] }),
      ),
    );
    assert.ok(error instanceof DatosInvalidos);
    assert.deepEqual(error.campos, [
      { campo: "nombre", mensaje: "Poné un nombre al evento" },
      { campo: "tiposDeEntrada", mensaje: "Tiene ventas: no se puede quitar" },
    ]);
  });
});
