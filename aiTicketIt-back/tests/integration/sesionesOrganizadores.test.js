import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";

const CONTRASENA = "Entradas2026";
const MENSAJE_CREDENCIALES = "El email o la contraseña no son correctos.";

beforeEach(() => reiniciarEstado());

describe("POST /organizadores/sesiones", () => {
  for (const organizador of [
    { id: "org-1", nombre: "Compañía La Trama", email: "produccion@latrama.com.ar" },
    { id: "org-2", nombre: "Club del Chiste", email: "hola@clubdelchiste.com.ar" },
    { id: "org-3", nombre: "Producciones Lumbre", email: "contacto@lumbre.com.ar" },
  ]) {
    it(`201 para ${organizador.nombre}, sin contrasenaHash`, async () => {
      const res = await request(app)
        .post("/organizadores/sesiones")
        .send({ email: organizador.email, contrasena: CONTRASENA });
      assert.equal(res.status, 201);
      assert.equal(typeof res.body.token, "string");
      assert.deepEqual(res.body.organizador, organizador);
      assert.ok(!JSON.stringify(res.body).includes("scrypt"));
    });
  }

  it("401 CREDENCIALES_INVALIDAS con contraseña incorrecta", async () => {
    const res = await request(app)
      .post("/organizadores/sesiones")
      .send({ email: "produccion@latrama.com.ar", contrasena: "otra" });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, {
      error: { codigo: "CREDENCIALES_INVALIDAS", mensaje: MENSAJE_CREDENCIALES },
    });
  });

  it("401 con el mismo mensaje para un email inexistente", async () => {
    const res = await request(app)
      .post("/organizadores/sesiones")
      .send({ email: "nadie@latrama.com.ar", contrasena: CONTRASENA });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.mensaje, MENSAJE_CREDENCIALES);
  });

  it("400 DATOS_INVALIDOS con campos para email inválido", async () => {
    const res = await request(app)
      .post("/organizadores/sesiones")
      .send({ email: "latrama", contrasena: CONTRASENA });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [
      { campo: "email", mensaje: "Ingresá un email válido" },
    ]);
  });
});
