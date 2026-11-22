import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as comprasService from "../../services/comprasService.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import * as eventosRepository from "../../repository/eventosRepository.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { crearEventoConCupo, cuerpoDeCompra } from "../helpers/compras.js";
import { HOY } from "../helpers/sesion.js";

// specs/004-compra-pago-mis-compras: research R2–R7, data-model.md § Transiciones.
beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const SOFIA = "cmp-1";
const MARTIN = "cmp-2";
const tipo = (eventoId, tipoId) => eventosRepository.buscarPorId(eventoId).tiposDeEntrada.find((t) => t.id === tipoId);
const nombreDelError = (fn) => {
  try {
    fn();
  } catch (error) {
    return error.name;
  }
  return null;
};

describe("comprasService.comprar (US1)", () => {
  it("crea una compra Confirmada con número nuevo, monto, fecha y copia del tipo", () => {
    const { compra } = comprasService.comprar(SOFIA, cuerpoDeCompra());
    assert.equal(compra.numero, "A-1043");
    assert.equal(compra.estado, "Confirmada");
    assert.equal(compra.compradorId, SOFIA);
    assert.equal(compra.monto, 36000);
    assert.equal(compra.cantidad, 2);
    assert.equal(compra.medioDePago, "Tarjeta de crédito");
    assert.equal(compra.creadaEn, HOY.toISOString());
    assert.equal(compra.tipoDeEntradaNombre, "Platea");
    assert.equal(compra.precioUnitario, 18000);
    assert.equal(comprasRepository.buscarPorNumero("A-1043"), compra);
  });

  it("suma la cantidad a las vendidas del tipo", () => {
    comprasService.comprar(SOFIA, cuerpoDeCompra());
    assert.equal(tipo("evt-1", "tip-2").vendidas, 70);
  });

  it("no devuelve una Promise: la verificación y el descuento son sincrónicos (research R2)", () => {
    const resultado = comprasService.comprar(SOFIA, cuerpoDeCompra());
    assert.equal(resultado instanceof Promise, false);
    assert.equal(typeof resultado?.then, "undefined");
  });

  it("evento inexistente, Borrador o Finalizado → EventoNoEncontrado", () => {
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ eventoId: "evt-99" }))), "EventoNoEncontrado");
    assert.equal(
      nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ eventoId: "evt-8", tipoDeEntradaId: "tip-13", precioUnitario: 14000 }))),
      "EventoNoEncontrado",
    );
    assert.equal(
      nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ eventoId: "evt-7", tipoDeEntradaId: "tip-12", precioUnitario: 10000 }))),
      "EventoNoEncontrado",
    );
  });

  it("tipo inexistente o precio distinto → PrecioCambiado, sin tocar vendidas", () => {
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ tipoDeEntradaId: "tip-99" }))), "PrecioCambiado");
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ precioUnitario: 15000 }))), "PrecioCambiado");
    assert.equal(tipo("evt-1", "tip-2").vendidas, 68);
    assert.equal(comprasRepository.buscarPorNumero("A-1043"), null);
  });

  it("más lugares que los disponibles → LugaresInsuficientes, sin tocar vendidas", () => {
    const vip = cuerpoDeCompra({ tipoDeEntradaId: "tip-3", precioUnitario: 26000, cantidad: 1 });
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, vip)), "LugaresInsuficientes");
    // La Platea tiene 12: 10 entran, 13 no (aunque 13 > 10 ya lo rechaza el schema, el servicio no confía).
    const { eventoId, tipoId } = crearEventoConCupo({ cupo: 3 });
    assert.equal(
      nombreDelError(() => comprasService.comprar(SOFIA, cuerpoDeCompra({ eventoId, tipoDeEntradaId: tipoId, precioUnitario: 10000, cantidad: 4 }))),
      "LugaresInsuficientes",
    );
    assert.equal(tipo(eventoId, tipoId).vendidas, 0);
    assert.equal(tipo("evt-1", "tip-3").vendidas, 20);
  });

  it("verifica en orden visibilidad → precio → lugares", () => {
    // Borrador con precio mal y sin lugares: gana la visibilidad.
    const borrador = cuerpoDeCompra({ eventoId: "evt-8", tipoDeEntradaId: "tip-13", precioUnitario: 1, cantidad: 10 });
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, borrador)), "EventoNoEncontrado");
    // VIP agotado con precio mal: gana el precio.
    const vip = cuerpoDeCompra({ tipoDeEntradaId: "tip-3", precioUnitario: 1, cantidad: 1 });
    assert.equal(nombreDelError(() => comprasService.comprar(SOFIA, vip)), "PrecioCambiado");
  });

  it("un mismo comprador puede comprar varias veces el mismo tipo (FR-005)", () => {
    const primera = comprasService.comprar(SOFIA, cuerpoDeCompra()).compra;
    const segunda = comprasService.comprar(SOFIA, cuerpoDeCompra()).compra;
    assert.notEqual(primera.numero, segunda.numero);
    assert.equal(tipo("evt-1", "tip-2").vendidas, 72);
  });

  it("devuelve la compra con su evento y organizador para el DTO", () => {
    const { evento, organizador, ahora } = comprasService.comprar(MARTIN, cuerpoDeCompra());
    assert.equal(evento.id, "evt-1");
    assert.equal(organizador.nombre, "Compañía La Trama");
    assert.equal(ahora.toISOString(), HOY.toISOString());
  });
});

describe("comprasService.listar (US2)", () => {
  it("las compras del comprador con su evento y organizador, de la más nueva a la más antigua", () => {
    const compras = comprasService.listar(SOFIA);
    assert.deepEqual(compras.map((c) => c.compra.numero), ["A-1042", "A-1037", "A-0871", "A-0790", "A-0655"]);
    assert.equal(compras[0].evento.nombre, "Hamlet en el Galpón");
    assert.equal(compras[0].organizador.nombre, "Compañía La Trama");
    assert.equal(compras[0].ahora.toISOString(), HOY.toISOString());
  });

  it("incluye compras de eventos que ya no son visibles (Finalizados, FR-017)", () => {
    const eventos = comprasService.listar(SOFIA).map((c) => c.evento.id);
    assert.ok(eventos.includes("evt-6") && eventos.includes("evt-7"));
  });

  it("una compra recién hecha queda primera", () => {
    comprasService.comprar(SOFIA, cuerpoDeCompra());
    assert.equal(comprasService.listar(SOFIA)[0].compra.numero, "A-1043");
  });

  it("un comprador sin compras recibe una lista vacía", () => {
    assert.deepEqual(comprasService.listar("cmp-99"), []);
  });
});

describe("comprasService.completarPago (US4)", () => {
  it("Pendiente de pago → Confirmada, conservando número, monto, medio y lugares", () => {
    const vendidasAntes = tipo("evt-2", "tip-4").vendidas;
    const { compra } = comprasService.completarPago(SOFIA, "A-1037");
    assert.equal(compra.estado, "Confirmada");
    assert.equal(compra.numero, "A-1037");
    assert.equal(compra.monto, 9000);
    assert.equal(compra.medioDePago, "Mercado Pago");
    assert.equal(tipo("evt-2", "tip-4").vendidas, vendidasAntes);
  });

  it("no devuelve una Promise (research R2)", () => {
    assert.equal(comprasService.completarPago(SOFIA, "A-1037") instanceof Promise, false);
  });

  it("cualquier otro estado o un evento que ya ocurrió → PagoNoPermitido", () => {
    for (const numero of ["A-1042", "A-0871", "A-0790", "A-0655"]) {
      assert.equal(nombreDelError(() => comprasService.completarPago(SOFIA, numero)), "PagoNoPermitido", numero);
    }
    fijarAhora(new Date("2026-11-15T10:00:00-03:00"));
    assert.equal(nombreDelError(() => comprasService.completarPago(SOFIA, "A-1037")), "PagoNoPermitido");
    assert.equal(comprasRepository.buscarPorNumero("A-1037").estado, "Pendiente de pago");
  });

  it("una compra ajena o inexistente → CompraNoEncontrada", () => {
    assert.equal(nombreDelError(() => comprasService.completarPago(MARTIN, "A-1037")), "CompraNoEncontrada");
    assert.equal(nombreDelError(() => comprasService.completarPago(SOFIA, "A-9999")), "CompraNoEncontrada");
  });
});

describe("comprasService.cancelar (US5)", () => {
  it("Confirmada → Reembolsada y libera los lugares", () => {
    const { compra } = comprasService.cancelar(SOFIA, "A-1042");
    assert.equal(compra.estado, "Reembolsada");
    assert.equal(tipo("evt-1", "tip-2").vendidas, 66);
  });

  it("Pendiente de pago → Cancelada y libera los lugares", () => {
    const { compra } = comprasService.cancelar(SOFIA, "A-1037");
    assert.equal(compra.estado, "Cancelada");
    assert.equal(tipo("evt-2", "tip-4").vendidas, 94);
  });

  it("no devuelve una Promise (research R2)", () => {
    assert.equal(comprasService.cancelar(SOFIA, "A-1042") instanceof Promise, false);
  });

  it("Utilizada, Cancelada, Reembolsada o evento pasado → CancelacionNoPermitida, sin tocar vendidas", () => {
    comprasService.cancelar(SOFIA, "A-1037");
    for (const numero of ["A-0871", "A-0655", "A-0790", "A-1037"]) {
      assert.equal(nombreDelError(() => comprasService.cancelar(SOFIA, numero)), "CancelacionNoPermitida", numero);
    }
    assert.equal(tipo("evt-2", "tip-4").vendidas, 94);
    fijarAhora(new Date("2026-11-22T10:00:00-03:00"));
    assert.equal(nombreDelError(() => comprasService.cancelar(SOFIA, "A-1042")), "CancelacionNoPermitida");
    assert.equal(tipo("evt-1", "tip-2").vendidas, 68);
  });

  it("una compra ajena → CompraNoEncontrada", () => {
    assert.equal(nombreDelError(() => comprasService.cancelar(MARTIN, "A-1042")), "CompraNoEncontrada");
  });

  it("comprar y cancelar deja las vendidas como al principio", () => {
    const { compra } = comprasService.comprar(SOFIA, cuerpoDeCompra());
    comprasService.cancelar(SOFIA, compra.numero);
    assert.equal(tipo("evt-1", "tip-2").vendidas, 68);
  });
});
