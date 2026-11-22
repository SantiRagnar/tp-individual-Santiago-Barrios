import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as comprasRepository from "../../repository/comprasRepository.js";
import { Compra } from "../../models/Compra.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

// data-model.md § Compra, § Calificacion e "Índice de calificaciones por organizador" (research R8).
const calificada = (numero, calificadaEn, puntaje = 5) => ({
  numero,
  compradorId: "cmp-1",
  eventoId: "evt-7",
  tipoDeEntradaId: "tip-12",
  cantidad: 1,
  monto: 10000,
  medioDePago: "Tarjeta de débito",
  estado: "Utilizada",
  creadaEn: "2026-09-01T10:00:00-03:00",
  calificacion: { puntaje, comentario: null, calificadaEn },
});

describe("Compra (modelo)", () => {
  it("guarda la calificación adentro de la compra", () => {
    const compra = new Compra(calificada("A-9000", "2026-09-30T10:00:00-03:00", 3));
    assert.equal(compra.numero, "A-9000");
    assert.equal(compra.estado, "Utilizada");
    assert.deepEqual({ ...compra.calificacion }, { puntaje: 3, comentario: null, calificadaEn: "2026-09-30T10:00:00-03:00" });
  });

  it("una compra sin calificar tiene calificacion null", () => {
    const compra = new Compra({ ...calificada("A-9001", "x"), estado: "Confirmada", calificacion: null });
    assert.equal(compra.calificacion, null);
  });
});

describe("comprasRepository (seed)", () => {
  it("resúmenes del seed: La Trama 18/4, Lumbre 8/2, Club del Chiste 11/3", () => {
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-1"), { suma: 18, cantidad: 4 });
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-3"), { suma: 8, cantidad: 2 });
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-2"), { suma: 11, cantidad: 3 });
  });

  it("un organizador sin reseñas tiene { 0, 0 }", () => {
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-999"), { suma: 0, cantidad: 0 });
  });

  it("busca por número", () => {
    const compra = comprasRepository.buscarPorNumero("A-0655");
    assert.equal(compra.compradorId, "cmp-1");
    assert.equal(compra.eventoId, "evt-7");
    assert.equal(compra.calificacion.puntaje, 4);
    assert.equal(comprasRepository.buscarPorNumero("A-0000"), null);
  });
});

describe("comprasRepository.listarCalificadas", () => {
  it("devuelve la más reciente primero", () => {
    const numeros = comprasRepository.listarCalificadas("org-1", { limite: 10 }).map((c) => c.numero);
    assert.deepEqual(numeros, ["A-0631", "A-0618", "A-0612", "A-0655"]);
  });

  it("respeta el límite y arranca después de la clave despuesDe", () => {
    const primera = comprasRepository.listarCalificadas("org-1", { limite: 2 });
    assert.deepEqual(primera.map((c) => c.numero), ["A-0631", "A-0618"]);
    const ultima = primera.at(-1);
    const segunda = comprasRepository.listarCalificadas("org-1", {
      limite: 2,
      despuesDe: [ultima.calificacion.calificadaEn, ultima.numero],
    });
    assert.deepEqual(segunda.map((c) => c.numero), ["A-0612", "A-0655"]);
  });

  it("con la misma fecha desempata por número descendente", () => {
    const fecha = "2026-10-01T10:00:00-03:00";
    comprasRepository.guardar(calificada("A-9001", fecha), { organizadorId: "org-9" });
    comprasRepository.guardar(calificada("A-9002", fecha), { organizadorId: "org-9" });
    const numeros = comprasRepository.listarCalificadas("org-9", { limite: 5 }).map((c) => c.numero);
    assert.deepEqual(numeros, ["A-9002", "A-9001"]);
    const despues = comprasRepository.listarCalificadas("org-9", { limite: 5, despuesDe: [fecha, "A-9002"] });
    assert.deepEqual(despues.map((c) => c.numero), ["A-9001"]);
  });

  it("un organizador sin reseñas devuelve una lista vacía", () => {
    assert.deepEqual(comprasRepository.listarCalificadas("org-999", { limite: 5 }), []);
  });
});

describe("comprasRepository.guardar", () => {
  it("una compra calificada actualiza el índice y el resumen", () => {
    comprasRepository.guardar(calificada("A-9000", "2026-10-30T10:00:00-03:00", 2), { organizadorId: "org-1" });
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-1"), { suma: 20, cantidad: 5 });
    assert.equal(comprasRepository.listarCalificadas("org-1", { limite: 1 })[0].numero, "A-9000");
  });

  it("una compra sin calificar no toca el índice", () => {
    comprasRepository.guardar(
      { ...calificada("A-9000", "x"), estado: "Confirmada", calificacion: null },
      { organizadorId: "org-1" },
    );
    assert.ok(comprasRepository.buscarPorNumero("A-9000"));
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-1"), { suma: 18, cantidad: 4 });
  });

  it("reiniciar vuelve al seed", () => {
    comprasRepository.guardar(calificada("A-9000", "2026-10-30T10:00:00-03:00"), { organizadorId: "org-1" });
    comprasRepository.reiniciar();
    assert.equal(comprasRepository.buscarPorNumero("A-9000"), null);
    assert.deepEqual(comprasRepository.resumenDeCalificaciones("org-1"), { suma: 18, cantidad: 4 });
  });
});

// specs/005-panel-evento/data-model.md § Compra · Operaciones nuevas del repositorio (research R3).
describe("comprasRepository.listarPorEvento y todasDelEvento", () => {
  const compraDe = (numero, creadaEn, estado = "Confirmada", eventoId = "evt-99") => ({
    numero,
    compradorId: "cmp-6",
    eventoId,
    tipoDeEntradaId: "tip-99",
    cantidad: 1,
    monto: 1000,
    medioDePago: "Mercado Pago",
    estado,
    creadaEn,
  });

  const cargar = () => {
    // Se guardan desordenadas: el índice las inserta en orden.
    comprasRepository.guardar(compraDe("A-9002", "2026-10-02T10:00:00-03:00"), { organizadorId: "org-1" });
    comprasRepository.guardar(compraDe("A-9004", "2026-10-04T10:00:00-03:00", "Pendiente de pago"), { organizadorId: "org-1" });
    comprasRepository.guardar(compraDe("A-9001", "2026-10-01T10:00:00-03:00", "Cancelada"), { organizadorId: "org-1" });
    comprasRepository.guardar(compraDe("A-9003", "2026-10-02T10:00:00-03:00"), { organizadorId: "org-1" });
    comprasRepository.guardar(compraDe("A-9005", "2026-10-05T10:00:00-03:00", "Confirmada", "evt-98"), { organizadorId: "org-1" });
  };

  it("ordena por [creadaEn desc, numero desc]", () => {
    cargar();
    const numeros = comprasRepository.listarPorEvento("evt-99", { limite: 10 }).map((c) => c.numero);
    assert.deepEqual(numeros, ["A-9004", "A-9003", "A-9002", "A-9001"]);
  });

  it("filtra por estado", () => {
    cargar();
    const numeros = comprasRepository.listarPorEvento("evt-99", { estado: "Confirmada", limite: 10 }).map((c) => c.numero);
    assert.deepEqual(numeros, ["A-9003", "A-9002"]);
  });

  it("respeta el límite y arranca después de despuesDe", () => {
    cargar();
    const primera = comprasRepository.listarPorEvento("evt-99", { limite: 2 });
    assert.deepEqual(primera.map((c) => c.numero), ["A-9004", "A-9003"]);
    const segunda = comprasRepository.listarPorEvento("evt-99", { limite: 2, despuesDe: ["2026-10-02T10:00:00-03:00", "A-9003"] });
    assert.deepEqual(segunda.map((c) => c.numero), ["A-9002", "A-9001"]);
  });

  it("todasDelEvento devuelve solo las de ese evento; un evento sin compras devuelve []", () => {
    cargar();
    assert.equal(comprasRepository.todasDelEvento("evt-99").length, 4);
    assert.deepEqual(comprasRepository.todasDelEvento("evt-98").map((c) => c.numero), ["A-9005"]);
    assert.deepEqual(comprasRepository.todasDelEvento("evt-404"), []);
    assert.deepEqual(comprasRepository.listarPorEvento("evt-404", { limite: 5 }), []);
  });

  it("reiniciar vacía el índice y lo rearma desde el seed", () => {
    cargar();
    comprasRepository.reiniciar();
    assert.deepEqual(comprasRepository.todasDelEvento("evt-99"), []);
    assert.ok(comprasRepository.todasDelEvento("evt-7").some((c) => c.numero === "A-0655"));
  });
});
