import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hashear,
  verificar,
  verificarContraHashFicticio,
} from "../../services/contrasenas.js";

describe("contrasenas", () => {
  it("hashear produce el formato scrypt$<saltHex>$<hashHex>", async () => {
    const hash = await hashear("Entradas2026");
    assert.match(hash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    assert.ok(!hash.includes("Entradas2026"));
  });

  it("usa un salt distinto en cada llamada", async () => {
    const a = await hashear("Entradas2026");
    const b = await hashear("Entradas2026");
    assert.notEqual(a, b);
  });

  it("verificar devuelve true solo con la contraseña exacta", async () => {
    const hash = await hashear("Entradas2026");
    assert.equal(await verificar("Entradas2026", hash), true);
    assert.equal(await verificar("entradas2026", hash), false);
    assert.equal(await verificar(" Entradas2026", hash), false);
    assert.equal(await verificar("", hash), false);
  });

  it("verificar devuelve false con un hash mal formado", async () => {
    assert.equal(await verificar("x", "no-es-un-hash"), false);
  });

  it("verificarContraHashFicticio siempre devuelve false", async () => {
    assert.equal(await verificarContraHashFicticio("Entradas2026"), false);
    assert.equal(await verificarContraHashFicticio(""), false);
  });
});
