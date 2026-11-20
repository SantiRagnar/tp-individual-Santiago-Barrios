import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";

const CONTRASENA = "Entradas2026";

const TIPOS = [
  { tipo: "comprador", base: "/compradores/sesiones", email: "sofia.gomez@correo.com", otraBase: "/organizadores/sesiones" },
  { tipo: "organizador", base: "/organizadores/sesiones", email: "produccion@latrama.com.ar", otraBase: "/compradores/sesiones" },
];

async function ingresar(base, email) {
  const res = await request(app).post(base).send({ email, contrasena: CONTRASENA });
  assert.equal(res.status, 201);
  return res.body.token;
}

const conToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

beforeEach(() => reiniciarEstado());

for (const { tipo, base, email, otraBase } of TIPOS) {
  describe(`DELETE ${base}/actual (${tipo})`, () => {
    it("204 y después GET /actual devuelve 401", async () => {
      const token = await ingresar(base, email);

      const cierre = await conToken(request(app).delete(`${base}/actual`), token);
      assert.equal(cierre.status, 204);
      assert.equal(cierre.text, "");

      const despues = await conToken(request(app).get(`${base}/actual`), token);
      assert.equal(despues.status, 401);
      assert.equal(despues.body.error.codigo, "SESION_INVALIDA");
    });

    it("401 sin token", async () => {
      const res = await request(app).delete(`${base}/actual`);
      assert.equal(res.status, 401);
      assert.equal(res.body.error.codigo, "SESION_INVALIDA");
    });

    it("401 con un token del otro tipo, y esa sesión sigue valiendo", async () => {
      const otroEmail = TIPOS.find((t) => t.base === otraBase).email;
      const tokenOtro = await ingresar(otraBase, otroEmail);

      const res = await conToken(request(app).delete(`${base}/actual`), tokenOtro);
      assert.equal(res.status, 401);

      const sigue = await conToken(request(app).get(`${otraBase}/actual`), tokenOtro);
      assert.equal(sigue.status, 200);
    });

    it("con dos sesiones del mismo usuario, cerrar una no afecta a la otra", async () => {
      const celular = await ingresar(base, email);
      const web = await ingresar(base, email);

      await conToken(request(app).delete(`${base}/actual`), celular);

      assert.equal((await conToken(request(app).get(`${base}/actual`), celular)).status, 401);
      assert.equal((await conToken(request(app).get(`${base}/actual`), web)).status, 200);
    });
  });
}

describe("Reinicio del backend", () => {
  it("invalida todas las sesiones (el estado vuelve al seed)", async () => {
    const tokenComprador = await ingresar("/compradores/sesiones", "sofia.gomez@correo.com");
    const tokenOrganizador = await ingresar("/organizadores/sesiones", "produccion@latrama.com.ar");

    reiniciarEstado();

    assert.equal((await conToken(request(app).get("/compradores/sesiones/actual"), tokenComprador)).status, 401);
    assert.equal((await conToken(request(app).get("/organizadores/sesiones/actual"), tokenOrganizador)).status, 401);
  });
});
