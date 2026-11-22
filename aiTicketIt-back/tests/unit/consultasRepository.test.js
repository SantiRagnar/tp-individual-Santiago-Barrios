import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as consultasRepository from "../../repository/consultasRepository.js";
import { consultasSeed } from "../../repository/seed.js";
import { reiniciarEstado } from "../helpers/estado.js";

// specs/007-consultas-chat/data-model.md § Repositorio consultasRepository (Consulta.eventoId, Mensaje.id).

beforeEach(() => reiniciarEstado());

const NUEVA = "A-0790"; // compra de Sofía sin mensajes en el seed
const agregar = (autor, texto = "hola", compraNumero = NUEVA, eventoId = "evt-4") =>
  consultasRepository.agregarMensaje({ compraNumero, eventoId, autor, texto, enviadoEn: "2026-11-09T12:00:00-03:00" });
const numeroDeId = (id) => Number(id.slice(4));

describe("consultasRepository", () => {
  it("no hay consulta hasta el primer mensaje; agregarMensaje la crea", () => {
    assert.equal(consultasRepository.buscar(NUEVA), null);
    const { consulta, mensaje } = agregar("comprador");
    assert.equal(consulta.compraNumero, NUEVA);
    assert.equal(consulta.eventoId, "evt-4");
    assert.equal(consulta.mensajes.length, 1);
    assert.equal(mensaje.autor, "comprador");
    assert.equal(consultasRepository.buscar(NUEVA), consulta);
  });

  it("los ids msj-{n} son crecientes y siguen después de los del seed", () => {
    const maximoSeed = Math.max(...consultasSeed.flatMap((c) => c.mensajes.map((m) => numeroDeId(m.id))));
    const a = agregar("comprador").mensaje;
    const b = agregar("organizador").mensaje;
    assert.match(a.id, /^msj-\d+$/);
    assert.equal(numeroDeId(a.id), maximoSeed + 1);
    assert.equal(numeroDeId(b.id), maximoSeed + 2);
  });

  it("enviar deja vistosPor{autor} = mensajes.length y no toca al otro", () => {
    agregar("comprador");
    const { consulta } = agregar("comprador");
    assert.equal(consulta.vistosPorComprador, 2);
    assert.equal(consulta.vistosPorOrganizador, 0);
    agregar("organizador");
    assert.equal(consulta.vistosPorOrganizador, 3);
  });

  it("marcarVista actualiza solo esa parte; sin consulta no la crea", () => {
    consultasRepository.marcarVista(NUEVA, "organizador");
    assert.equal(consultasRepository.buscar(NUEVA), null);
    agregar("comprador");
    consultasRepository.marcarVista(NUEVA, "organizador");
    assert.equal(consultasRepository.buscar(NUEVA).vistosPorOrganizador, 1);
  });

  it("mensajesDespuesDe: null → todos; id intermedio → los siguientes; último → []; ajeno → undefined", () => {
    const ids = [agregar("comprador").mensaje.id, agregar("organizador").mensaje.id, agregar("comprador").mensaje.id];
    assert.deepEqual(consultasRepository.mensajesDespuesDe(NUEVA, null).map((m) => m.id), ids);
    assert.deepEqual(consultasRepository.mensajesDespuesDe(NUEVA, ids[0]).map((m) => m.id), ids.slice(1));
    assert.deepEqual(consultasRepository.mensajesDespuesDe(NUEVA, ids[2]), []);
    assert.equal(consultasRepository.mensajesDespuesDe(NUEVA, "msj-99999"), undefined);
    // Sin consulta: sin despuesDe es [], con un id es undefined.
    assert.deepEqual(consultasRepository.mensajesDespuesDe("A-0871", null), []);
    assert.equal(consultasRepository.mensajesDespuesDe("A-0871", ids[0]), undefined);
  });

  it("delEvento devuelve solo las consultas con mensajes de ese evento", () => {
    assert.deepEqual(consultasRepository.delEvento("evt-4"), []);
    agregar("comprador");
    assert.deepEqual(consultasRepository.delEvento("evt-4").map((c) => c.compraNumero), [NUEVA]);
    assert.ok(consultasRepository.delEvento("evt-1").every((c) => c.eventoId === "evt-1"));
    assert.ok(consultasRepository.delEvento("evt-1").some((c) => c.compraNumero === "A-1042"));
  });

  it("reiniciar vuelve al seed sin compartir referencias", () => {
    const original = consultasSeed.find((c) => c.compraNumero === "A-1042").mensajes.length;
    agregar("organizador", "respuesta", "A-1042", "evt-1");
    consultasRepository.reiniciar();
    assert.equal(consultasRepository.buscar("A-1042").mensajes.length, original);
    assert.equal(consultasSeed.find((c) => c.compraNumero === "A-1042").mensajes.length, original);
    assert.equal(consultasRepository.buscar(NUEVA), null);
  });
});
