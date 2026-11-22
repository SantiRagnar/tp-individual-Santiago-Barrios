import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codificar, decodificar } from "../../services/cursor.js";

// research R4 y R9: cursor opaco = base64url de la clave del último elemento.
const esClaveDeFecha = (clave) =>
  Array.isArray(clave) && clave.length === 2 && clave.every((parte) => typeof parte === "string");

describe("cursor", () => {
  it("codificar y decodificar devuelve la misma clave", () => {
    const clave = ["2026-11-21T21:00:00-03:00", "evt-1"];
    assert.deepEqual(decodificar(codificar(clave), esClaveDeFecha), clave);
  });

  it("es base64url sin relleno", () => {
    const texto = codificar([12000, "2026-11-21T21:00:00-03:00", "evt-1"]);
    assert.match(texto, /^[A-Za-z0-9_-]+$/);
  });

  it("acepta claves con números y null", () => {
    const clave = [null, "2026-11-21T21:00:00-03:00", "evt-1"];
    assert.deepEqual(decodificar(codificar(clave), (c) => c.length === 3), clave);
  });

  it("un texto que no es base64url → null", () => {
    assert.equal(decodificar("no es un cursor!", esClaveDeFecha), null);
  });

  it("base64url válido pero JSON inválido → null", () => {
    const texto = Buffer.from("{roto", "utf8").toString("base64url");
    assert.equal(decodificar(texto, esClaveDeFecha), null);
  });

  it("una clave con forma distinta a la esperada → null", () => {
    assert.equal(decodificar(codificar([1, 2, 3]), esClaveDeFecha), null);
    assert.equal(decodificar(codificar({ a: 1 }), esClaveDeFecha), null);
  });

  it("vacío → null", () => {
    assert.equal(decodificar("", esClaveDeFecha), null);
  });
});
