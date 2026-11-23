import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compradoresSeed, comprasSeed, consultasSeed, eventosSeed } from "../../repository/seed.js";
import { noLeidaPara } from "../../services/reglasConsulta.js";

// Invariantes de specs/005-panel-evento/data-model.md § Seed de compras (research R8, FR-018).

const ACTIVAS = new Set(["Pendiente de pago", "Confirmada", "Utilizada"]);
const REFERENCIA = new Date("2026-11-09T00:00:00-03:00").getTime();
const BASE = new Set(["A-0655", "A-0612", "A-0618", "A-0631", "A-0820", "A-0834", "A-0540", "A-0547", "A-0559", "A-1042", "A-1037", "A-0871", "A-0790"]);
const generadas = comprasSeed.filter((c) => !BASE.has(c.numero));
const numeroDe = (numero) => Number(numero.slice(2));

describe("seed de compras", () => {
  it("1. para cada tipo, Σ cantidad de compras activas = vendidas", () => {
    for (const evento of eventosSeed) {
      for (const tipo of evento.tiposDeEntrada) {
        const suma = comprasSeed
          .filter((c) => c.eventoId === evento.id && c.tipoDeEntradaId === tipo.id && ACTIVAS.has(c.estado))
          .reduce((total, c) => total + c.cantidad, 0);
        assert.equal(suma, tipo.vendidas, `${evento.id} / ${tipo.id}`);
      }
    }
  });

  it("2. en las generadas, monto = precio del tipo × cantidad y cantidad de 1 a 10", () => {
    for (const compra of generadas) {
      const tipo = eventosSeed.find((e) => e.id === compra.eventoId).tiposDeEntrada.find((t) => t.id === compra.tipoDeEntradaId);
      assert.equal(compra.monto, tipo.precio * compra.cantidad, compra.numero);
      assert.ok(compra.cantidad >= 1 && compra.cantidad <= 10, compra.numero);
    }
  });

  it("3. números únicos, las generadas entre A-0100 y A-0539, y el mayor sigue siendo A-1042", () => {
    const numeros = comprasSeed.map((c) => c.numero);
    assert.equal(new Set(numeros).size, numeros.length);
    for (const compra of generadas) {
      assert.match(compra.numero, /^A-\d{4}$/);
      assert.ok(numeroDe(compra.numero) >= 100 && numeroDe(compra.numero) <= 539, compra.numero);
    }
    assert.equal(Math.max(...numeros.map(numeroDe)), 1042);
  });

  it("4. ninguna generada tiene calificación", () => {
    assert.ok(generadas.length > 0);
    assert.ok(generadas.every((c) => !c.calificacion));
  });

  it("5. en las generadas, creadaEn es anterior a la fecha del evento y a 2026-11-09", () => {
    // Las calificadas de la feature 003 usan como creadaEn el día de la calificación; no se tocan.
    for (const compra of generadas) {
      const evento = eventosSeed.find((e) => e.id === compra.eventoId);
      const creada = new Date(compra.creadaEn).getTime();
      assert.ok(creada < new Date(evento.fechaHora).getTime(), compra.numero);
      assert.ok(creada < REFERENCIA, compra.numero);
    }
  });

  it("6. La gaviota (Borrador, 0 vendidas) no tiene compras", () => {
    assert.equal(comprasSeed.filter((c) => c.eventoId === "evt-8").length, 0);
  });

  it("cada evento futuro con ventas tiene al menos una Cancelada o Reembolsada", () => {
    for (const evento of eventosSeed) {
      const futuro = new Date(evento.fechaHora).getTime() > REFERENCIA;
      const vendidas = evento.tiposDeEntrada.reduce((t, x) => t + x.vendidas, 0);
      if (!futuro || vendidas === 0) continue;
      assert.ok(
        comprasSeed.some((c) => c.eventoId === evento.id && (c.estado === "Cancelada" || c.estado === "Reembolsada")),
        evento.id,
      );
    }
  });

  it("las cuatro compras de Sofía de pantallas.md están con sus datos", () => {
    const de = (numero) => {
      const { compradorId, eventoId, tipoDeEntradaId, cantidad, monto, medioDePago, estado, creadaEn } = comprasSeed.find((c) => c.numero === numero);
      return { compradorId, eventoId, tipoDeEntradaId, cantidad, monto, medioDePago, estado, creadaEn };
    };
    assert.deepEqual(de("A-1042"), { compradorId: "cmp-1", eventoId: "evt-1", tipoDeEntradaId: "tip-2", cantidad: 2, monto: 36000, medioDePago: "Tarjeta de crédito", estado: "Confirmada", creadaEn: "2026-11-06T19:20:00-03:00" });
    assert.deepEqual(de("A-1037"), { compradorId: "cmp-1", eventoId: "evt-2", tipoDeEntradaId: "tip-4", cantidad: 1, monto: 9000, medioDePago: "Mercado Pago", estado: "Pendiente de pago", creadaEn: "2026-11-04T11:05:00-03:00" });
    assert.deepEqual(de("A-0871"), { compradorId: "cmp-1", eventoId: "evt-6", tipoDeEntradaId: "tip-11", cantidad: 2, monto: 20000, medioDePago: "Tarjeta de débito", estado: "Utilizada", creadaEn: "2026-10-05T16:40:00-03:00" });
    assert.deepEqual(de("A-0790"), { compradorId: "cmp-1", eventoId: "evt-4", tipoDeEntradaId: "tip-9", cantidad: 1, monto: 19000, medioDePago: "Tarjeta de crédito", estado: "Reembolsada", creadaEn: "2026-09-30T10:15:00-03:00" });
  });

  it("las generadas usan solo los compradores cmp-6 a cmp-15, que existen en el seed", () => {
    const ids = new Set(compradoresSeed.map((c) => c.id));
    for (const compra of generadas) {
      assert.ok(Number(compra.compradorId.split("-")[1]) >= 6, compra.numero);
      assert.ok(ids.has(compra.compradorId), compra.numero);
    }
  });

  it("Hamlet: 62 compras, 51 Confirmadas, 9 Pendientes de pago, 1 Cancelada y 1 Reembolsada", () => {
    const deHamlet = comprasSeed.filter((c) => c.eventoId === "evt-1");
    const contar = (estado) => deHamlet.filter((c) => c.estado === estado).length;
    assert.equal(deHamlet.length, 62);
    assert.equal(contar("Confirmada"), 51);
    assert.equal(contar("Pendiente de pago"), 9);
    assert.equal(contar("Cancelada"), 1);
    assert.equal(contar("Reembolsada"), 1);
    assert.equal(contar("Utilizada"), 0);
  });
});

// specs/007-consultas-chat/data-model.md § Seed (FR-018).

describe("seed de consultas (feature 007)", () => {
  const compraDe = (numero) => comprasSeed.find((c) => c.numero === numero);
  const consultaDe = (numero) => consultasSeed.find((c) => c.compraNumero === numero);
  const primeraGenerada = (eventoId, compradorId) =>
    comprasSeed
      .filter((c) => c.eventoId === eventoId && c.compradorId === compradorId)
      .sort((a, b) => (a.numero < b.numero ? -1 : 1))[0];

  it("cada consulta apunta a una compra existente del mismo evento y tiene mensajes", () => {
    for (const consulta of consultasSeed) {
      const compra = compraDe(consulta.compraNumero);
      assert.ok(compra, consulta.compraNumero);
      assert.equal(consulta.eventoId, compra.eventoId, consulta.compraNumero);
      assert.ok(consulta.mensajes.length > 0, consulta.compraNumero);
    }
  });

  it("ningún mensaje es anterior a su compra ni posterior al 2026-11-08", () => {
    for (const consulta of consultasSeed) {
      const creada = new Date(compraDe(consulta.compraNumero).creadaEn).getTime();
      for (const mensaje of consulta.mensajes) {
        const enviado = new Date(mensaje.enviadoEn).getTime();
        assert.ok(enviado >= creada, `${mensaje.id} anterior a ${consulta.compraNumero}`);
        assert.ok(enviado < REFERENCIA, `${mensaje.id} posterior al 2026-11-08`);
      }
    }
  });

  it("A-1042 no leída para el organizador; A-1037 no leída para Sofía", () => {
    assert.equal(noLeidaPara(consultaDe("A-1042"), "organizador"), true);
    assert.equal(noLeidaPara(consultaDe("A-1042"), "comprador"), false);
    assert.equal(noLeidaPara(consultaDe("A-1037"), "comprador"), true);
    assert.equal(noLeidaPara(consultaDe("A-1037"), "organizador"), false);
  });

  it("Hamlet de cmp-6 leída por los dos y Bodas de cmp-7 no leída para el organizador", () => {
    const hamlet = consultaDe(primeraGenerada("evt-1", "cmp-6").numero);
    const bodas = consultaDe(primeraGenerada("evt-3", "cmp-7").numero);
    assert.ok(hamlet && bodas);
    assert.equal(noLeidaPara(hamlet, "organizador"), false);
    assert.equal(noLeidaPara(hamlet, "comprador"), false);
    assert.equal(noLeidaPara(bodas, "organizador"), true);
  });

  it("en evt-1 el último mensaje de A-1042 es más reciente que el de cmp-6", () => {
    const hamlet = consultaDe(primeraGenerada("evt-1", "cmp-6").numero);
    const ultimo = (c) => new Date(c.mensajes.at(-1).enviadoEn).getTime();
    assert.ok(ultimo(consultaDe("A-1042")) > ultimo(hamlet));
  });
});
