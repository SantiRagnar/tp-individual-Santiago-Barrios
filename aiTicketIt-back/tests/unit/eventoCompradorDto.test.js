import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aEventoCompradorDetalleDto,
  aEventoCompradorResumenDto,
  aResenaDto,
} from "../../dto/eventoCompradorDto.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import * as compradoresRepository from "../../repository/compradoresRepository.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

// research R18 y data-model.md § Valores derivados.
const LA_TRAMA = { id: "org-1", nombre: "Compañía La Trama" };
const contexto = (resumen = { suma: 18, cantidad: 4 }, esFavorito = false) => ({
  organizador: LA_TRAMA,
  resumen,
  esFavorito,
});

describe("aEventoCompradorResumenDto", () => {
  it("Hamlet: campos de la tarjeta, precioDesde con agotados incluidos y agotado false", () => {
    const dto = aEventoCompradorResumenDto(eventosRepository.buscarPorId("evt-1"), contexto());
    assert.deepEqual(dto, {
      id: "evt-1",
      nombre: "Hamlet en el Galpón",
      categoria: "Teatro",
      fechaHora: "2026-11-21T21:00:00-03:00",
      ubicacion: "Galpón de Guevara, Chacarita",
      imagenUrl: "/imagenes/img-seed-hamlet",
      precioDesde: 12000,
      agotado: false,
      organizador: { id: "org-1", nombre: "Compañía La Trama", puntaje: 4.5, cantidadResenas: 4 },
      esFavorito: false,
    });
  });

  it("agotado es true si ningún tipo tiene lugares, y precioDesde no cambia", () => {
    const evento = eventosRepository.buscarPorId("evt-3");
    evento.tiposDeEntrada.forEach((t) => (t.vendidas = t.cupo));
    const dto = aEventoCompradorResumenDto(evento, contexto());
    assert.equal(dto.agotado, true);
    assert.equal(dto.precioDesde, 15000);
  });

  it("el puntaje se redondea a un decimal (11/3 → 3.7)", () => {
    const dto = aEventoCompradorResumenDto(eventosRepository.buscarPorId("evt-2"), contexto({ suma: 11, cantidad: 3 }));
    assert.equal(dto.organizador.puntaje, 3.7);
    assert.equal(dto.organizador.cantidadResenas, 3);
  });

  it("sin reseñas el puntaje es null", () => {
    const dto = aEventoCompradorResumenDto(eventosRepository.buscarPorId("evt-1"), contexto({ suma: 0, cantidad: 0 }));
    assert.equal(dto.organizador.puntaje, null);
    assert.equal(dto.organizador.cantidadResenas, 0);
  });

  it("refleja esFavorito", () => {
    const dto = aEventoCompradorResumenDto(eventosRepository.buscarPorId("evt-1"), contexto(undefined, true));
    assert.equal(dto.esFavorito, true);
  });

  it("sin imagen, imagenUrl es null", () => {
    const evento = eventosRepository.buscarPorId("evt-1");
    evento.imagenId = null;
    assert.equal(aEventoCompradorResumenDto(evento, contexto()).imagenUrl, null);
  });

  it("no expone datos del organizador que el comprador no necesita", () => {
    const dto = aEventoCompradorResumenDto(eventosRepository.buscarPorId("evt-1"), contexto());
    for (const campo of ["vendidas", "cupo", "estado", "materialMultimedia", "organizadorId", "imagenId"]) {
      assert.equal(campo in dto, false, campo);
    }
  });
});

describe("aEventoCompradorDetalleDto", () => {
  it("suma descripción, precioHasta, tipos con disponibles y la página de reseñas", () => {
    const pagina = { resenas: [], siguiente: null };
    const dto = aEventoCompradorDetalleDto(eventosRepository.buscarPorId("evt-1"), contexto(), pagina);
    assert.equal(dto.descripcion, "La tragedia de Shakespeare en una puesta íntima, con el público alrededor de la escena.");
    assert.equal(dto.precioDesde, 12000);
    assert.equal(dto.precioHasta, 26000);
    assert.deepEqual(dto.tiposDeEntrada, [
      { id: "tip-1", nombre: "General", precio: 12000, disponibles: 84 },
      { id: "tip-2", nombre: "Platea", precio: 18000, disponibles: 12 },
      { id: "tip-3", nombre: "VIP", precio: 26000, disponibles: 0 },
    ]);
    assert.deepEqual(dto.resenas, pagina);
    assert.equal("vendidas" in dto, false);
    assert.equal("materialMultimedia" in dto, false);
  });

  it("con un solo tipo, precioDesde = precioHasta", () => {
    const dto = aEventoCompradorDetalleDto(eventosRepository.buscarPorId("evt-5"), contexto(), { resenas: [], siguiente: null });
    assert.equal(dto.precioDesde, 8000);
    assert.equal(dto.precioHasta, 8000);
  });
});

describe("aResenaDto", () => {
  it("autor con nombre e inicial del apellido, evento y comentario", () => {
    const compra = comprasRepository.buscarPorNumero("A-0655");
    const dto = aResenaDto(compra, compradoresRepository.buscarPorId("cmp-1"), eventosRepository.buscarPorId("evt-7"));
    assert.deepEqual(dto, {
      numeroCompra: "A-0655",
      autor: "Sofía G.",
      puntaje: 4,
      comentario: "Muy buena puesta, el final te deja pensando.",
      evento: { id: "evt-7", nombre: "Edipo Rey" },
      calificadaEn: compra.calificacion.calificadaEn,
    });
  });

  it("sin comentario manda null y nunca el email", () => {
    const compra = comprasRepository.buscarPorNumero("A-0618");
    const dto = aResenaDto(compra, compradoresRepository.buscarPorId("cmp-3"), eventosRepository.buscarPorId("evt-7"));
    assert.equal(dto.comentario, null);
    assert.equal(dto.autor, "Lucía F.");
    assert.equal(JSON.stringify(dto).includes("@"), false);
  });
});
