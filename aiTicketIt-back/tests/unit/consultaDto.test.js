import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aConsultaNoLeidaDto, aConsultaResumenDto, aMensajeDto } from "../../dto/consultaDto.js";

// specs/007-consultas-chat/data-model.md § Vistas; contracts/consultas.openapi.yaml.

const msj = (id, autor) => ({ id, autor, texto: `texto ${id}`, enviadoEn: "2026-11-08T18:05:00-03:00", extra: "no" });
const compra = {
  numero: "A-1042",
  compradorId: "cmp-1",
  eventoId: "evt-1",
  tipoDeEntradaId: "tip-2",
  tipoDeEntradaNombre: "Platea",
  cantidad: 2,
  monto: 36000,
  estado: "Confirmada",
};
const consulta = { compraNumero: "A-1042", eventoId: "evt-1", mensajes: [msj("msj-1", "organizador"), msj("msj-2", "comprador")], vistosPorOrganizador: 1, vistosPorComprador: 2 };
const SOFIA = { nombre: "Sofía", apellido: "Gómez", email: "sofia.gomez@correo.com" };

describe("aMensajeDto", () => {
  it("expone solo id, autor, texto y enviadoEn", () => {
    assert.deepEqual(aMensajeDto(msj("msj-1", "comprador")), {
      id: "msj-1",
      autor: "comprador",
      texto: "texto msj-1",
      enviadoEn: "2026-11-08T18:05:00-03:00",
    });
  });
});

describe("aConsultaResumenDto", () => {
  it("arma la cabecera con el último mensaje y la no leída del organizador", () => {
    assert.deepEqual(aConsultaResumenDto(compra, { comprador: SOFIA, consulta }), {
      numero: "A-1042",
      comprador: { nombre: "Sofía Gómez" },
      tipoDeEntrada: { nombre: "Platea" },
      cantidad: 2,
      monto: 36000,
      estado: "Confirmada",
      ultimoMensaje: aMensajeDto(consulta.mensajes[1]),
      noLeida: true,
    });
  });

  it("sin nombre usa el email; sin consulta, ultimoMensaje null y noLeida false", () => {
    const dto = aConsultaResumenDto(compra, { comprador: { email: "x@correo.com" }, consulta: null });
    assert.equal(dto.comprador.nombre, "x@correo.com");
    assert.equal(dto.ultimoMensaje, null);
    assert.equal(dto.noLeida, false);
  });
});

describe("aConsultaNoLeidaDto", () => {
  it("arma evento, organizador y último mensaje", () => {
    const evento = { id: "evt-1", nombre: "Hamlet en el Galpón" };
    const dto = aConsultaNoLeidaDto(compra, { evento, organizador: { nombre: "Compañía La Trama" }, consulta });
    assert.deepEqual(dto, {
      numero: "A-1042",
      evento: { id: "evt-1", nombre: "Hamlet en el Galpón" },
      organizador: { nombre: "Compañía La Trama" },
      ultimoMensaje: aMensajeDto(consulta.mensajes[1]),
    });
  });
});
