import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as consultasRepository from "../../repository/consultasRepository.js";
import * as comprasRepository from "../../repository/comprasRepository.js";
import * as consultasService from "../../services/consultasService.js";
import { fijarAhora } from "../../services/reloj.js";
import { enviarMensaje } from "../helpers/consultas.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY } from "../helpers/sesion.js";

// specs/007-consultas-chat: data-model.md § Consulta (transiciones), research R1–R8.

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const SOFIA = "cmp-1";
const MARTIN = "cmp-2";
const nombreDelError = (fn) => {
  try {
    fn();
  } catch (error) {
    return error.name;
  }
  return null;
};

describe("consultasService · comprador (US1)", () => {
  it("mensajesDeComprador devuelve los mensajes de su compra en orden", () => {
    const mensajes = consultasService.mensajesDeComprador(SOFIA, "A-1042", {});
    assert.deepEqual(mensajes.map((m) => m.id), ["msj-1", "msj-2", "msj-3"]);
  });

  it("una compra sin mensajes devuelve []", () => {
    assert.deepEqual(consultasService.mensajesDeComprador(SOFIA, "A-0790", {}), []);
  });

  it("con despuesDe devuelve solo los posteriores; un id desconocido → DatosInvalidos", () => {
    assert.deepEqual(consultasService.mensajesDeComprador(SOFIA, "A-1042", { despuesDe: "msj-2" }).map((m) => m.id), ["msj-3"]);
    assert.equal(nombreDelError(() => consultasService.mensajesDeComprador(SOFIA, "A-1042", { despuesDe: "msj-5" })), "DatosInvalidos");
  });

  it("una compra ajena o inexistente → CompraNoEncontrada", () => {
    assert.equal(nombreDelError(() => consultasService.mensajesDeComprador(MARTIN, "A-1042", {})), "CompraNoEncontrada");
    assert.equal(nombreDelError(() => consultasService.mensajesDeComprador(SOFIA, "A-9999", {})), "CompraNoEncontrada");
    assert.equal(nombreDelError(() => consultasService.enviarComoComprador(MARTIN, "A-1042", "hola")), "CompraNoEncontrada");
    assert.equal(consultasRepository.buscar("A-1042").mensajes.length, 3);
  });

  it("enviarComoComprador guarda autor comprador y enviadoEn = ahora()", () => {
    const mensaje = consultasService.enviarComoComprador(SOFIA, "A-0790", "¿Me reintegran el total?");
    assert.equal(mensaje.autor, "comprador");
    assert.equal(mensaje.texto, "¿Me reintegran el total?");
    assert.equal(mensaje.enviadoEn, HOY.toISOString());
    assert.equal(consultasRepository.buscar("A-0790").eventoId, "evt-4");
  });

  it("se puede escribir con la compra en cualquier estado (FR-004)", () => {
    // Sofía tiene Confirmada (A-1042), Pendiente (A-1037), Utilizada (A-0871) y Reembolsada (A-0790).
    for (const numero of ["A-1042", "A-1037", "A-0871", "A-0790"]) {
      assert.ok(consultasService.enviarComoComprador(SOFIA, numero, "hola"), numero);
    }
    const cancelada = comprasRepository.buscarPorNumero("A-1042");
    cancelada.estado = "Cancelada";
    assert.ok(consultasService.enviarComoComprador(SOFIA, "A-1042", "sigo pudiendo escribir"));
  });

  it("marcarLeidaComprador deja vistosPorComprador = mensajes.length", () => {
    consultasService.marcarLeidaComprador(SOFIA, "A-1037");
    const consulta = consultasRepository.buscar("A-1037");
    assert.equal(consulta.vistosPorComprador, consulta.mensajes.length);
    assert.equal(nombreDelError(() => consultasService.marcarLeidaComprador(MARTIN, "A-1037")), "CompraNoEncontrada");
  });
});

const LA_TRAMA = "org-1";
const CLUB_DEL_CHISTE = "org-2";

describe("consultasService · organizador (US2)", () => {
  it("consultasDelEvento: solo compras con mensajes, la del último mensaje más reciente primero", () => {
    const { items, noLeidas } = consultasService.consultasDelEvento(LA_TRAMA, "evt-1");
    assert.equal(items[0].compra.numero, "A-1042");
    assert.equal(items.length, 2);
    assert.ok(items.every(({ consulta }) => consulta.mensajes.length > 0));
    assert.equal(noLeidas, 1);
  });

  it("a igual hora del último mensaje, desempata por número desc (research R8)", () => {
    const otra = comprasRepository.todasDelEvento("evt-1").find((c) => !consultasRepository.buscar(c.numero));
    const ultimoDe1042 = consultasRepository.buscar("A-1042").mensajes.at(-1).enviadoEn;
    consultasRepository.agregarMensaje({ compraNumero: otra.numero, eventoId: "evt-1", autor: "comprador", texto: "hola", enviadoEn: ultimoDe1042 });
    const numeros = consultasService.consultasDelEvento(LA_TRAMA, "evt-1").items.map(({ compra }) => compra.numero);
    const esperado = ["A-1042", otra.numero].sort().reverse();
    assert.deepEqual(numeros.slice(0, 2), esperado);
  });

  it("un evento ajeno → EventoNoEncontrado", () => {
    assert.equal(nombreDelError(() => consultasService.consultasDelEvento(CLUB_DEL_CHISTE, "evt-1")), "EventoNoEncontrado");
  });

  it("consultaDeCompra devuelve compra, consulta y mensajes; con despuesDe solo los nuevos", () => {
    const { compra, consulta, mensajes } = consultasService.consultaDeCompra(LA_TRAMA, "evt-1", "A-1042", {});
    assert.equal(compra.numero, "A-1042");
    assert.equal(consulta.mensajes.length, 3);
    assert.equal(mensajes.length, 3);
    assert.deepEqual(consultasService.consultaDeCompra(LA_TRAMA, "evt-1", "A-1042", { despuesDe: "msj-1" }).mensajes.map((m) => m.id), ["msj-2", "msj-3"]);
  });

  it("una compra de otro evento → CompraNoEncontrada", () => {
    assert.equal(nombreDelError(() => consultasService.consultaDeCompra(LA_TRAMA, "evt-1", "A-0655", {})), "CompraNoEncontrada");
    assert.equal(nombreDelError(() => consultasService.enviarComoOrganizador(LA_TRAMA, "evt-1", "A-0655", "hola")), "CompraNoEncontrada");
  });

  it("enviarComoOrganizador guarda autor organizador; funciona en un evento Finalizado (Edipo)", () => {
    const mensaje = consultasService.enviarComoOrganizador(LA_TRAMA, "evt-1", "A-1042", "Sí, hay lugar en el hall.");
    assert.equal(mensaje.autor, "organizador");
    assert.ok(consultasService.enviarComoOrganizador(LA_TRAMA, "evt-7", "A-0655", "¡Gracias por venir!"));
  });
});

describe("consultasService · lectura del organizador (US3)", () => {
  it("marcarLeidaOrganizador deja vistosPorOrganizador = mensajes.length", () => {
    consultasService.marcarLeidaOrganizador(LA_TRAMA, "evt-1", "A-1042");
    assert.equal(consultasRepository.buscar("A-1042").vistosPorOrganizador, 3);
    assert.equal(consultasService.consultasDelEvento(LA_TRAMA, "evt-1").noLeidas, 0);
  });

  it("sin consulta no la crea", () => {
    const sinMensajes = comprasRepository.todasDelEvento("evt-1").find((c) => !consultasRepository.buscar(c.numero));
    consultasService.marcarLeidaOrganizador(LA_TRAMA, "evt-1", sinMensajes.numero);
    assert.equal(consultasRepository.buscar(sinMensajes.numero), null);
  });

  it("un mensaje nuevo del comprador la vuelve no leída; uno del organizador no", () => {
    consultasService.marcarLeidaOrganizador(LA_TRAMA, "evt-1", "A-1042");
    enviarMensaje("A-1042", "organizador");
    assert.equal(consultasService.consultasDelEvento(LA_TRAMA, "evt-1").noLeidas, 0);
    enviarMensaje("A-1042", "comprador");
    assert.equal(consultasService.consultasDelEvento(LA_TRAMA, "evt-1").noLeidas, 1);
  });
});

describe("consultasService · no leídas del comprador (US6)", () => {
  it("noLeidasDeComprador devuelve solo A-1037 para Sofía", () => {
    const items = consultasService.noLeidasDeComprador(SOFIA);
    assert.deepEqual(items.map(({ compra }) => compra.numero), ["A-1037"]);
    assert.equal(items[0].evento.nombre, "Risas a Domicilio");
    assert.equal(items[0].organizador.nombre, "Club del Chiste");
  });

  it("ordena por el último mensaje, el más reciente primero; vacío → []", () => {
    enviarMensaje("A-0790", "organizador", "Ya está acreditado.");
    assert.deepEqual(consultasService.noLeidasDeComprador(SOFIA).map(({ compra }) => compra.numero), ["A-0790", "A-1037"]);
    assert.deepEqual(consultasService.noLeidasDeComprador("cmp-3"), []);
  });

  it("al marcarla leída deja de aparecer", () => {
    consultasService.marcarLeidaComprador(SOFIA, "A-1037");
    assert.deepEqual(consultasService.noLeidasDeComprador(SOFIA), []);
  });
});
