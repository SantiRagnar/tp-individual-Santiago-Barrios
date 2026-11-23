import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { noLeidaPara, ultimoMensaje } from "../../services/reglasConsulta.js";

// specs/007-consultas-chat/data-model.md § Consulta (reglas derivadas); research R2. FR-015 y FR-022.

const mensaje = (id, autor) => ({ id, autor, texto: "hola", enviadoEn: "2026-11-08T10:00:00-03:00" });
const consulta = (mensajes, { vistosPorOrganizador = 0, vistosPorComprador = 0 } = {}) => ({
  compraNumero: "A-1042",
  eventoId: "evt-1",
  mensajes,
  vistosPorOrganizador,
  vistosPorComprador,
});

describe("ultimoMensaje", () => {
  it("es null sin consulta o sin mensajes", () => {
    assert.equal(ultimoMensaje(null), null);
    assert.equal(ultimoMensaje(consulta([])), null);
  });

  it("es el último del array", () => {
    assert.equal(ultimoMensaje(consulta([mensaje("msj-1", "comprador"), mensaje("msj-2", "organizador")])).id, "msj-2");
  });
});

describe("noLeidaPara", () => {
  it("sin consulta o sin mensajes nunca está no leída", () => {
    for (const parte of ["organizador", "comprador"]) {
      assert.equal(noLeidaPara(null, parte), false);
      assert.equal(noLeidaPara(consulta([]), parte), false);
    }
  });

  it("organizador: último del comprador y vistos < mensajes.length → no leída", () => {
    const c = consulta([mensaje("msj-1", "organizador"), mensaje("msj-2", "comprador")], { vistosPorOrganizador: 1 });
    assert.equal(noLeidaPara(c, "organizador"), true);
  });

  it("organizador: si ya vio todos los mensajes → leída", () => {
    const c = consulta([mensaje("msj-1", "comprador")], { vistosPorOrganizador: 1 });
    assert.equal(noLeidaPara(c, "organizador"), false);
  });

  it("organizador: si el último es suyo nunca está no leída", () => {
    const c = consulta([mensaje("msj-1", "comprador"), mensaje("msj-2", "organizador")], { vistosPorOrganizador: 0 });
    assert.equal(noLeidaPara(c, "organizador"), false);
  });

  it("comprador: regla simétrica", () => {
    const sinLeer = consulta([mensaje("msj-1", "comprador"), mensaje("msj-2", "organizador")], { vistosPorComprador: 1 });
    assert.equal(noLeidaPara(sinLeer, "comprador"), true);
    assert.equal(noLeidaPara({ ...sinLeer, vistosPorComprador: 2 }, "comprador"), false);
    const ultimoPropio = consulta([mensaje("msj-1", "comprador")], { vistosPorComprador: 0 });
    assert.equal(noLeidaPara(ultimoPropio, "comprador"), false);
  });
});
