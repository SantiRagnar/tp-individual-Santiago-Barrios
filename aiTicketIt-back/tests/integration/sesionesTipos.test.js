import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import * as compradoresRepository from "../../repository/compradoresRepository.js";
import { compradoresSeed } from "../../repository/seed.js";
import { reiniciarEstado } from "../helpers/estado.js";

const CONTRASENA = "Entradas2026";
const CREDENCIALES_INVALIDAS = {
  error: {
    codigo: "CREDENCIALES_INVALIDAS",
    mensaje: "El email o la contraseña no son correctos.",
  },
};
const SESION_INVALIDA = {
  error: { codigo: "SESION_INVALIDA", mensaje: "Tu sesión no es válida. Ingresá de nuevo." },
};

async function tokenDe(tipo, email) {
  const ruta = tipo === "comprador" ? "/compradores/sesiones" : "/organizadores/sesiones";
  const res = await request(app).post(ruta).send({ email, contrasena: CONTRASENA });
  assert.equal(res.status, 201);
  return res.body.token;
}

beforeEach(() => reiniciarEstado());

describe("Cada app solo acepta su propio tipo de cuenta", () => {
  it("credenciales de comprador en /organizadores/sesiones → 401 con el mensaje genérico", async () => {
    const res = await request(app)
      .post("/organizadores/sesiones")
      .send({ email: "sofia.gomez@correo.com", contrasena: CONTRASENA });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, CREDENCIALES_INVALIDAS);
  });

  it("credenciales de organizador en /compradores/sesiones → 401 con el mensaje genérico", async () => {
    const res = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "produccion@latrama.com.ar", contrasena: CONTRASENA });
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, CREDENCIALES_INVALIDAS);
  });

  it("token de comprador en GET /organizadores/sesiones/actual → 401 SESION_INVALIDA", async () => {
    const token = await tokenDe("comprador", "sofia.gomez@correo.com");
    const res = await request(app)
      .get("/organizadores/sesiones/actual")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, SESION_INVALIDA);
  });

  it("token de organizador en GET /compradores/sesiones/actual → 401 SESION_INVALIDA", async () => {
    const token = await tokenDe("organizador", "produccion@latrama.com.ar");
    const res = await request(app)
      .get("/compradores/sesiones/actual")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, SESION_INVALIDA);
  });

  it("el mismo email puede existir como comprador y como organizador; cada uno ingresa solo en su app", async () => {
    compradoresRepository.agregar({
      id: "cmp-2",
      nombre: "Lucía",
      apellido: "Paz",
      email: "produccion@latrama.com.ar",
      contrasenaHash: compradoresSeed[0].contrasenaHash,
    });

    const comoComprador = await request(app)
      .post("/compradores/sesiones")
      .send({ email: "produccion@latrama.com.ar", contrasena: CONTRASENA });
    assert.equal(comoComprador.status, 201);
    assert.equal(comoComprador.body.comprador.id, "cmp-2");

    const comoOrganizador = await request(app)
      .post("/organizadores/sesiones")
      .send({ email: "produccion@latrama.com.ar", contrasena: CONTRASENA });
    assert.equal(comoOrganizador.status, 201);
    assert.equal(comoOrganizador.body.organizador.id, "org-1");
  });
});

describe("GET /{tipo}/sesiones/actual", () => {
  it("200 { comprador } con un token de comprador, según el contrato", async () => {
    const token = await tokenDe("comprador", "sofia.gomez@correo.com");
    const res = await request(app)
      .get("/compradores/sesiones/actual")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      comprador: { id: "cmp-1", nombre: "Sofía", apellido: "Gómez", email: "sofia.gomez@correo.com" },
    });
  });

  it("200 { organizador } con un token de organizador, según el contrato", async () => {
    const token = await tokenDe("organizador", "produccion@latrama.com.ar");
    const res = await request(app)
      .get("/organizadores/sesiones/actual")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      organizador: { id: "org-1", nombre: "Compañía La Trama", email: "produccion@latrama.com.ar" },
    });
  });

  for (const ruta of ["/compradores/sesiones/actual", "/organizadores/sesiones/actual"]) {
    it(`401 en ${ruta} sin header Authorization`, async () => {
      const res = await request(app).get(ruta);
      assert.equal(res.status, 401);
      assert.deepEqual(res.body, SESION_INVALIDA);
    });

    it(`401 en ${ruta} con un formato que no es Bearer`, async () => {
      const res = await request(app).get(ruta).set("Authorization", "Basic abc");
      assert.equal(res.status, 401);
      assert.deepEqual(res.body, SESION_INVALIDA);
    });

    it(`401 en ${ruta} con un token inexistente`, async () => {
      const res = await request(app).get(ruta).set("Authorization", "Bearer no-existe");
      assert.equal(res.status, 401);
    });
  }
});
