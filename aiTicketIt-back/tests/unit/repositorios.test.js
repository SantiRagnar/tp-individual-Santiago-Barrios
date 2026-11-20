import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as compradoresRepository from "../../repository/compradoresRepository.js";
import * as organizadoresRepository from "../../repository/organizadoresRepository.js";
import * as sesionesRepository from "../../repository/sesionesRepository.js";
import { Sesion } from "../../models/Sesion.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

describe("compradoresRepository", () => {
  it("busca por email normalizado y por id", () => {
    const porEmail = compradoresRepository.buscarPorEmail("sofia.gomez@correo.com");
    assert.equal(porEmail.id, "cmp-1");
    assert.equal(porEmail.nombre, "Sofía");
    assert.equal(porEmail.apellido, "Gómez");
    assert.equal(compradoresRepository.buscarPorId("cmp-1").email, "sofia.gomez@correo.com");
  });

  it("devuelve null si no existe", () => {
    assert.equal(compradoresRepository.buscarPorEmail("nadie@correo.com"), null);
    assert.equal(compradoresRepository.buscarPorId("cmp-999"), null);
  });

  it("no encuentra cuentas de organizador", () => {
    assert.equal(compradoresRepository.buscarPorEmail("produccion@latrama.com.ar"), null);
  });

  it("reiniciar vuelve al seed", () => {
    compradoresRepository.agregar({
      id: "cmp-x",
      nombre: "X",
      apellido: "Y",
      email: "x@y.com",
      contrasenaHash: "scrypt$00$00",
    });
    assert.ok(compradoresRepository.buscarPorEmail("x@y.com"));
    compradoresRepository.reiniciar();
    assert.equal(compradoresRepository.buscarPorEmail("x@y.com"), null);
    assert.ok(compradoresRepository.buscarPorEmail("sofia.gomez@correo.com"));
  });
});

describe("organizadoresRepository", () => {
  it("tiene los tres organizadores del seed", () => {
    assert.equal(organizadoresRepository.buscarPorEmail("produccion@latrama.com.ar").nombre, "Compañía La Trama");
    assert.equal(organizadoresRepository.buscarPorEmail("hola@clubdelchiste.com.ar").nombre, "Club del Chiste");
    assert.equal(organizadoresRepository.buscarPorEmail("contacto@lumbre.com.ar").nombre, "Producciones Lumbre");
    assert.equal(organizadoresRepository.buscarPorId("org-1").email, "produccion@latrama.com.ar");
  });

  it("no encuentra cuentas de comprador", () => {
    assert.equal(organizadoresRepository.buscarPorEmail("sofia.gomez@correo.com"), null);
  });
});

describe("sesionesRepository", () => {
  const sesion = () =>
    new Sesion({ tokenHash: "abc", tipo: "comprador", usuarioId: "cmp-1", creadaEn: new Date() });

  it("guarda, busca por tokenHash y elimina", () => {
    sesionesRepository.guardar(sesion());
    assert.equal(sesionesRepository.buscarPorTokenHash("abc").usuarioId, "cmp-1");
    sesionesRepository.eliminar("abc");
    assert.equal(sesionesRepository.buscarPorTokenHash("abc"), null);
  });

  it("reiniciar borra todas las sesiones", () => {
    sesionesRepository.guardar(sesion());
    sesionesRepository.reiniciar();
    assert.equal(sesionesRepository.buscarPorTokenHash("abc"), null);
  });
});
