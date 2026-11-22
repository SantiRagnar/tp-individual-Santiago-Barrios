import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Evento } from "../../models/Evento.js";
import { esVisibleParaCompradores } from "../../services/visibilidadEvento.js";
import { HOY } from "../helpers/sesion.js";

// research R2 / FR-001: solo Publicados cuya fecha y hora todavía no pasaron.
const evento = (estado, fechaHora) => new Evento({ id: "evt-x", organizadorId: "org-1", estado, fechaHora });

describe("esVisibleParaCompradores", () => {
  it("Publicado con fecha futura → visible", () => {
    assert.equal(esVisibleParaCompradores(evento("Publicado", "2026-11-21T21:00:00-03:00"), HOY), true);
  });

  it("Borrador → no visible, con fecha futura o pasada", () => {
    assert.equal(esVisibleParaCompradores(evento("Borrador", "2027-03-06T20:30:00-03:00"), HOY), false);
    assert.equal(esVisibleParaCompradores(evento("Borrador", "2026-01-01T20:30:00-03:00"), HOY), false);
    assert.equal(esVisibleParaCompradores(evento("Borrador", null), HOY), false);
  });

  it("Publicado con fecha pasada (Finalizado) → no visible", () => {
    assert.equal(esVisibleParaCompradores(evento("Publicado", "2026-09-12T21:00:00-03:00"), HOY), false);
  });

  it("Publicado justo en este momento → no visible (ya empezó)", () => {
    assert.equal(esVisibleParaCompradores(evento("Publicado", HOY.toISOString()), HOY), false);
  });
});
