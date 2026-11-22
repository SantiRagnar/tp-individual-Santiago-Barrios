import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventoNoEncontrado } from "../../errors/ErrorDeDominio.js";
import * as favoritosRepository from "../../repository/favoritosRepository.js";
import * as favoritosService from "../../services/favoritosService.js";
import { fijarAhora } from "../../services/reloj.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { HOY } from "../helpers/sesion.js";

beforeEach(() => {
  reiniciarEstado();
  fijarAhora(HOY);
});

const SOFIA = "cmp-1";
const ids = (lista) => lista.map(({ evento }) => evento.id);

// research R10, FR-019 a FR-023.
describe("favoritosService", () => {
  it("marcar un evento visible lo guarda con la fecha de ahora", () => {
    favoritosService.marcar(SOFIA, "evt-3");
    assert.equal(favoritosRepository.esFavorito(SOFIA, "evt-3"), true);
    assert.equal(favoritosRepository.marcadoEn(SOFIA, "evt-3"), HOY.toISOString());
  });

  for (const [caso, id] of [["Borrador", "evt-8"], ["Finalizado", "evt-7"], ["inexistente", "evt-999"]]) {
    it(`marcar un evento ${caso} → EventoNoEncontrado`, () => {
      assert.throws(() => favoritosService.marcar(SOFIA, id), EventoNoEncontrado);
      assert.equal(favoritosRepository.esFavorito(SOFIA, id), false);
    });
  }

  it("desmarcar es idempotente, aunque el evento ya no sea visible", () => {
    favoritosService.marcar(SOFIA, "evt-2");
    fijarAhora("2026-11-20T10:00:00-03:00"); // Risas a Domicilio ya pasó
    favoritosService.desmarcar(SOFIA, "evt-2");
    favoritosService.desmarcar(SOFIA, "evt-2");
    favoritosService.desmarcar(SOFIA, "evt-999");
    assert.equal(favoritosRepository.esFavorito(SOFIA, "evt-2"), false);
  });

  it("listar devuelve solo los visibles, por fecha, con su contexto", () => {
    favoritosService.marcar(SOFIA, "evt-5");
    favoritosService.marcar(SOFIA, "evt-1");
    favoritosService.marcar(SOFIA, "evt-3");
    const lista = favoritosService.listar(SOFIA);
    assert.deepEqual(ids(lista), ["evt-1", "evt-3", "evt-5"]);
    assert.equal(lista[0].contexto.esFavorito, true);
  });

  it("un favorito que pasa a Finalizado deja de listarse, pero sigue guardado", () => {
    favoritosService.marcar(SOFIA, "evt-2");
    favoritosService.marcar(SOFIA, "evt-1");
    fijarAhora("2026-11-15T10:00:00-03:00");
    assert.deepEqual(ids(favoritosService.listar(SOFIA)), ["evt-1"]);
    assert.equal(favoritosRepository.esFavorito(SOFIA, "evt-2"), true);
  });
});
