import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as eventosRepository from "../../repository/eventosRepository.js";
import * as ventasService from "../../services/ventasService.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY } from "../helpers/sesion.js";

// specs/005-panel-evento/data-model.md § Resumen de ventas del evento (research R2).

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const PORESTADO_HAMLET = {
  Todas: 62,
  "Pendiente de pago": 9,
  Confirmada: 51,
  Utilizada: 0,
  Cancelada: 1,
  Reembolsada: 1,
};

describe("ventasService.resumen (US1)", () => {
  it("Hamlet: recaudado 2.536.000, 154 entradas vendidas, 60 compras activas y conteo por estado", () => {
    const resumen = ventasService.resumen(eventosRepository.buscarPorId("evt-1"));
    assert.deepEqual(resumen, { recaudado: 2536000, entradasVendidas: 154, comprasActivas: 60, porEstado: PORESTADO_HAMLET });
  });

  it("Borrador sin ventas (La gaviota): todo en cero", () => {
    const resumen = ventasService.resumen(eventosRepository.buscarPorId("evt-8"));
    assert.deepEqual(resumen, {
      recaudado: 0,
      entradasVendidas: 0,
      comprasActivas: 0,
      porEstado: { Todas: 0, "Pendiente de pago": 0, Confirmada: 0, Utilizada: 0, Cancelada: 0, Reembolsada: 0 },
    });
  });

  it("un tipo con precio null aporta 0 al recaudado", () => {
    const evento = eventosRepository.guardar({
      id: "evt-500",
      organizadorId: "org-1",
      tiposDeEntrada: [
        { id: "tip-500", nombre: "General", cupo: 10, precio: 1000, vendidas: 3 },
        { id: "tip-501", nombre: null, cupo: 5, precio: null, vendidas: 2 },
      ],
      estado: "Borrador",
      creadoEn: "2026-11-01T10:00:00-03:00",
    });
    const resumen = ventasService.resumen(evento);
    assert.equal(resumen.recaudado, 3000);
    assert.equal(resumen.entradasVendidas, 5);
  });
});

// research R3: paginación por cursor de a 20, filtro por estado (US2).
describe("ventasService.pagina (US2)", () => {
  it("devuelve 20 compras de la más reciente a la más antigua y un cursor siguiente", () => {
    const { compras, siguiente } = ventasService.pagina("org-1", "evt-1", {});
    assert.equal(compras.length, 20);
    assert.ok(siguiente);
    for (let i = 1; i < compras.length; i++) {
      const [a, b] = [compras[i - 1], compras[i]];
      assert.ok(a.creadaEn > b.creadaEn || (a.creadaEn === b.creadaEn && a.numero > b.numero), `${a.numero} antes que ${b.numero}`);
    }
  });

  it("recorrer todas las páginas no repite ni salta compras y la última trae siguiente null", () => {
    const vistos = [];
    let cursor = null;
    let paginas = 0;
    do {
      const { compras, siguiente } = ventasService.pagina("org-1", "evt-1", { cursor });
      vistos.push(...compras.map((c) => c.numero));
      cursor = siguiente;
      paginas += 1;
    } while (cursor);
    assert.equal(paginas, 4);
    assert.equal(vistos.length, 62);
    assert.equal(new Set(vistos).size, 62);
  });

  it("filtra por estado: Hamlet tiene 9 Pendientes de pago en una sola página", () => {
    const { compras, siguiente, resumen } = ventasService.pagina("org-1", "evt-1", { estado: "Pendiente de pago" });
    assert.equal(compras.length, 9);
    assert.ok(compras.every((c) => c.estado === "Pendiente de pago"));
    assert.equal(siguiente, null);
    assert.equal(resumen.porEstado.Todas, 62, "el resumen es del evento completo");
  });

  it("un cursor inválido o con otra forma lanza DatosInvalidos en el campo cursor", () => {
    for (const cursor of ["xyz!", Buffer.from(JSON.stringify({ a: 1 })).toString("base64url")]) {
      assert.throws(
        () => ventasService.pagina("org-1", "evt-1", { cursor }),
        (error) => error.codigo === "DATOS_INVALIDOS" && error.campos[0].campo === "cursor",
      );
    }
  });
});

// data-model.md § Compra · Transición nueva (research R4–R6): Marcar utilizada (US3).
describe("ventasService.marcarUtilizada (US3)", () => {
  const EL_DIA = "2026-11-21T00:00:00-03:00";
  const confirmadaDeHamlet = () =>
    ventasService.pagina("org-1", "evt-1", { estado: "Confirmada" }).compras.find((c) => c.numero !== "A-1042").numero;

  it("pasa una Confirmada a Utilizada, devuelve el resumen actualizado y no es asíncrona", () => {
    fijarAhora(EL_DIA);
    const resultado = ventasService.marcarUtilizada("org-1", "evt-1", "A-1042");
    assert.ok(!(resultado instanceof Promise));
    assert.equal(resultado.compra.estado, "Utilizada");
    assert.equal(resultado.resumen.porEstado.Confirmada, 50);
    assert.equal(resultado.resumen.porEstado.Utilizada, 1);
    assert.equal(resultado.resumen.comprasActivas, 60);
  });

  it("no cambia las vendidas de los tipos de entrada", () => {
    fijarAhora(EL_DIA);
    ventasService.marcarUtilizada("org-1", "evt-1", "A-1042");
    assert.equal(eventosRepository.buscarPorId("evt-1").vendidasTotal, 154);
  });

  it("una ya Utilizada → CompraNoConfirmada", () => {
    fijarAhora(EL_DIA);
    ventasService.marcarUtilizada("org-1", "evt-1", "A-1042");
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-1", "A-1042"), { codigo: "COMPRA_NO_CONFIRMADA" });
  });

  it("una Pendiente de pago → CompraNoConfirmada", () => {
    fijarAhora(EL_DIA);
    const pendiente = ventasService.pagina("org-1", "evt-1", { estado: "Pendiente de pago" }).compras[0].numero;
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-1", pendiente), { codigo: "COMPRA_NO_CONFIRMADA" });
  });

  it("el día anterior → EventoNoComenzo y la compra sigue Confirmada", () => {
    fijarAhora("2026-11-20T23:59:00-03:00");
    const numero = confirmadaDeHamlet();
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-1", numero), { codigo: "EVENTO_NO_COMENZO" });
    assert.equal(ventasService.pagina("org-1", "evt-1", { estado: "Confirmada" }).compras.some((c) => c.numero === numero), true);
  });

  it("número inexistente → CompraNoEncontrada", () => {
    fijarAhora(EL_DIA);
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-1", "A-9999"), { codigo: "COMPRA_NO_ENCONTRADA" });
  });

  it("compra de otro evento del mismo organizador (A-0655 de evt-7 pedida en evt-1) → CompraNoEncontrada", () => {
    fijarAhora(EL_DIA);
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-1", "A-0655"), { codigo: "COMPRA_NO_ENCONTRADA" });
  });

  it("evento ajeno → EventoNoEncontrado", () => {
    fijarAhora("2026-11-14T12:00:00-03:00");
    const deRisas = ventasService.pagina("org-2", "evt-2", { estado: "Confirmada" }).compras[0].numero;
    assert.throws(() => ventasService.marcarUtilizada("org-1", "evt-2", deRisas), { codigo: "EVENTO_NO_ENCONTRADO" });
  });
});
