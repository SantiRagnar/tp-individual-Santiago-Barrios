import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as favoritosRepository from "../../repository/favoritosRepository.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

// data-model.md § Favorito (research R10).
describe("favoritosRepository", () => {
  it("el seed arranca sin favoritos", () => {
    assert.deepEqual(favoritosRepository.idsDe("cmp-1"), []);
  });

  it("marcar es idempotente y conserva la fecha original", () => {
    favoritosRepository.marcar("cmp-1", "evt-3", "2026-11-09T10:00:00-03:00");
    favoritosRepository.marcar("cmp-1", "evt-3", "2026-11-10T10:00:00-03:00");
    assert.deepEqual(favoritosRepository.idsDe("cmp-1"), ["evt-3"]);
    assert.equal(favoritosRepository.marcadoEn("cmp-1", "evt-3"), "2026-11-09T10:00:00-03:00");
    assert.equal(favoritosRepository.esFavorito("cmp-1", "evt-3"), true);
  });

  it("desmarcar es idempotente", () => {
    favoritosRepository.marcar("cmp-1", "evt-3", "2026-11-09T10:00:00-03:00");
    favoritosRepository.desmarcar("cmp-1", "evt-3");
    favoritosRepository.desmarcar("cmp-1", "evt-3");
    favoritosRepository.desmarcar("cmp-9", "evt-1");
    assert.equal(favoritosRepository.esFavorito("cmp-1", "evt-3"), false);
    assert.deepEqual(favoritosRepository.idsDe("cmp-1"), []);
  });

  it("los favoritos son de cada comprador", () => {
    favoritosRepository.marcar("cmp-1", "evt-3", "2026-11-09T10:00:00-03:00");
    assert.equal(favoritosRepository.esFavorito("cmp-2", "evt-3"), false);
    assert.deepEqual(favoritosRepository.idsDe("cmp-2"), []);
  });

  it("reiniciar deja todo vacío", () => {
    favoritosRepository.marcar("cmp-1", "evt-3", "2026-11-09T10:00:00-03:00");
    favoritosRepository.reiniciar();
    assert.deepEqual(favoritosRepository.idsDe("cmp-1"), []);
  });
});
