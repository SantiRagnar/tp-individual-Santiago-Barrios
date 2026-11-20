import { beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  autenticacionService,
  crearAutenticacionService,
} from "../../services/autenticacionService.js";
import * as contrasenas from "../../services/contrasenas.js";
import * as sesionesRepository from "../../repository/sesionesRepository.js";
import { CredencialesInvalidas, SesionInvalida } from "../../errors/ErrorDeDominio.js";
import { reiniciarEstado } from "../helpers/estado.js";

const CONTRASENA = "Entradas2026";
const sha256 = (texto) => createHash("sha256").update(texto).digest("hex");

beforeEach(() => reiniciarEstado());

describe("autenticacionService.ingresar — comprador", () => {
  it("con datos correctos devuelve un token y el comprador", async () => {
    const { token, usuario } = await autenticacionService.ingresar(
      "comprador",
      "sofia.gomez@correo.com",
      CONTRASENA,
    );
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(usuario.id, "cmp-1");
    assert.equal(usuario.nombre, "Sofía");
  });

  it("acepta el email con mayúsculas y espacios", async () => {
    const { usuario } = await autenticacionService.ingresar(
      "comprador",
      "  Sofia.Gomez@Correo.com ",
      CONTRASENA,
    );
    assert.equal(usuario.id, "cmp-1");
  });

  it("con contraseña incorrecta lanza CredencialesInvalidas", async () => {
    await assert.rejects(
      autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", "otra"),
      CredencialesInvalidas,
    );
  });

  it("con email inexistente lanza CredencialesInvalidas y verifica contra el hash ficticio", async () => {
    const espia = mock.fn(contrasenas.verificarContraHashFicticio);
    const servicio = crearAutenticacionService({
      contrasenas: { ...contrasenas, verificarContraHashFicticio: espia },
    });
    await assert.rejects(
      servicio.ingresar("comprador", "nadie@correo.com", CONTRASENA),
      CredencialesInvalidas,
    );
    assert.equal(espia.mock.callCount(), 1);
  });

  it("guarda la sesión con el SHA-256 del token, no el token en claro", async () => {
    const { token } = await autenticacionService.ingresar(
      "comprador",
      "sofia.gomez@correo.com",
      CONTRASENA,
    );
    assert.equal(sesionesRepository.buscarPorTokenHash(token), null);
    const sesion = sesionesRepository.buscarPorTokenHash(sha256(token));
    assert.equal(sesion.tipo, "comprador");
    assert.equal(sesion.usuarioId, "cmp-1");
    assert.ok(sesion.creadaEn instanceof Date);
  });

  it("cada ingreso genera un token distinto", async () => {
    const a = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    const b = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    assert.notEqual(a.token, b.token);
  });
});

describe("autenticacionService.ingresar — organizador", () => {
  for (const [email, id] of [
    ["produccion@latrama.com.ar", "org-1"],
    ["hola@clubdelchiste.com.ar", "org-2"],
    ["contacto@lumbre.com.ar", "org-3"],
  ]) {
    it(`ingresa ${email}`, async () => {
      const { token, usuario } = await autenticacionService.ingresar("organizador", email, CONTRASENA);
      assert.equal(usuario.id, id);
      const sesion = sesionesRepository.buscarPorTokenHash(sha256(token));
      assert.equal(sesion.tipo, "organizador");
      assert.equal(sesion.usuarioId, id);
    });
  }

  it("con contraseña incorrecta lanza CredencialesInvalidas", async () => {
    await assert.rejects(
      autenticacionService.ingresar("organizador", "produccion@latrama.com.ar", "otra"),
      CredencialesInvalidas,
    );
  });
});

describe("autenticacionService.obtenerSesion", () => {
  it("con un token válido devuelve la sesión y el usuario", async () => {
    const { token } = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    const { sesion, usuario } = autenticacionService.obtenerSesion("comprador", token);
    assert.equal(sesion.tipo, "comprador");
    assert.equal(usuario.id, "cmp-1");
  });

  it("con un token inexistente o vacío lanza SesionInvalida", () => {
    assert.throws(() => autenticacionService.obtenerSesion("comprador", "no-existe"), SesionInvalida);
    assert.throws(() => autenticacionService.obtenerSesion("comprador", ""), SesionInvalida);
    assert.throws(() => autenticacionService.obtenerSesion("comprador", undefined), SesionInvalida);
  });

  it("con un token de otro tipo de cuenta lanza SesionInvalida", async () => {
    const { token } = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    assert.throws(() => autenticacionService.obtenerSesion("organizador", token), SesionInvalida);
  });

  it("si el usuario ya no existe lanza SesionInvalida", async () => {
    const { token } = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    const servicio = crearAutenticacionService({
      cuentas: { comprador: { buscarPorId: () => null, buscarPorEmail: () => null } },
    });
    assert.throws(() => servicio.obtenerSesion("comprador", token), SesionInvalida);
  });
});

describe("autenticacionService.cerrarSesion", () => {
  it("después de cerrar, obtenerSesion lanza SesionInvalida", async () => {
    const { token } = await autenticacionService.ingresar("comprador", "sofia.gomez@correo.com", CONTRASENA);
    autenticacionService.cerrarSesion("comprador", token);
    assert.throws(() => autenticacionService.obtenerSesion("comprador", token), SesionInvalida);
    assert.equal(sesionesRepository.buscarPorTokenHash(sha256(token)), null);
  });

  it("con un token de otro tipo lanza SesionInvalida y no borra la sesión", async () => {
    const { token } = await autenticacionService.ingresar("organizador", "produccion@latrama.com.ar", CONTRASENA);
    assert.throws(() => autenticacionService.cerrarSesion("comprador", token), SesionInvalida);
    assert.equal(autenticacionService.obtenerSesion("organizador", token).usuario.id, "org-1");
  });

  it("con un token inexistente lanza SesionInvalida", () => {
    assert.throws(() => autenticacionService.cerrarSesion("comprador", "no-existe"), SesionInvalida);
  });
});
