import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";

const CONTRASENA = "Entradas2026";
const MENSAJE_CREDENCIALES = "El email o la contraseña no son correctos.";

beforeEach(() => reiniciarEstado());

describe("POST /compradores/sesiones", () => {
  it("201 con token y comprador según el contrato, sin contrasenaHash", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: CONTRASENA });

    assert.equal(res.status, 201);
    assert.equal(typeof res.body.token, "string");
    assert.deepEqual(res.body.comprador, {
      id: "cmp-1",
      nombre: "Sofía",
      apellido: "Gómez",
      email: "sofia.gomez@correo.com",
    });
    assert.ok(!JSON.stringify(res.body).includes("contrasena"));
    assert.ok(!JSON.stringify(res.body).includes("scrypt"));
  });

  it("acepta el email con mayúsculas y espacios alrededor", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: " Sofia.Gomez@correo.com ", contrasena: CONTRASENA });
    assert.equal(res.status, 201);
  });

  it("no recorta la contraseña: con espacios extra se rechaza", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: ` ${CONTRASENA} ` });
    assert.equal(res.status, 401);
  });

  it("401 CREDENCIALES_INVALIDAS con contraseña incorrecta", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: "otra" });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, {
      error: { codigo: "CREDENCIALES_INVALIDAS", mensaje: MENSAJE_CREDENCIALES },
    });
  });

  it("401 con el mismo mensaje para un email inexistente", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "nadie@correo.com", contrasena: CONTRASENA });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, {
      error: { codigo: "CREDENCIALES_INVALIDAS", mensaje: MENSAJE_CREDENCIALES },
    });
  });

  it("400 DATOS_INVALIDOS con campos para email inválido", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia@", contrasena: CONTRASENA });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
    assert.deepEqual(res.body.error.campos, [
      { campo: "email", mensaje: "Ingresá un email válido" },
    ]);
  });

  it("400 DATOS_INVALIDOS con un mensaje por campo vacío", async () => {
    const res = await request(app).post("/compradores/sesiones").send({ email: "", contrasena: "" });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body.error.campos, [
      { campo: "email", mensaje: "Ingresá tu email" },
      { campo: "contrasena", mensaje: "Ingresá tu contraseña" },
    ]);
  });

  it("400 con JSON mal formado", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .set("Content-Type", "application/json")
      .send("{no es json");
    assert.equal(res.status, 400);
    assert.equal(res.body.error.codigo, "DATOS_INVALIDOS");
  });

  it("el ingreso correcto responde en menos de 500 ms (SC-001)", async () => {
    const inicio = performance.now();
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: CONTRASENA });
    const duracion = performance.now() - inicio;
    assert.equal(res.status, 201);
    assert.ok(duracion < 500, `tardó ${Math.round(duracion)} ms`);
  });
});
