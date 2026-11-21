import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";
import { reiniciarEstado } from "../helpers/estado.js";
import { LA_TRAMA, tokenDeOrganizador } from "../helpers/sesion.js";

beforeEach(() => reiniciarEstado());

describe("GET /imagenes/:id — servir (contracts/eventos.openapi.yaml)", () => {
  it("devuelve una imagen del seed sin sesión, con su tipo y cache inmutable", async () => {
    const res = await request(app).get("/imagenes/img-seed-hamlet");
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-type"], "image/png");
    assert.match(res.headers["cache-control"], /immutable/);
    assert.deepEqual([...res.body.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  });

  it("404 IMAGEN_NO_ENCONTRADA si no existe", async () => {
    const res = await request(app).get("/imagenes/no-existe");
    assert.equal(res.status, 404);
    assert.equal(res.body.error.codigo, "IMAGEN_NO_ENCONTRADA");
    assert.equal(res.body.error.mensaje, "No encontramos la imagen.");
  });
});

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 7)]);

const subir = (token, tipo, datos) => {
  const req = request(app).post("/organizadores/imagenes").set("Content-Type", tipo).send(datos);
  return token ? req.set("Authorization", `Bearer ${token}`) : req;
};

describe("POST /organizadores/imagenes — subir (US2, research R7)", () => {
  it("401 sin token", async () => {
    const res = await subir(null, "image/png", PNG);
    assert.equal(res.status, 401);
  });

  it("201 { id, url } y GET url devuelve los mismos bytes", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const res = await subir(token, "image/png", PNG);
    assert.equal(res.status, 201);
    assert.match(res.body.id, /^[0-9a-f-]{36}$/);
    assert.equal(res.body.url, `/imagenes/${res.body.id}`);

    const servida = await request(app).get(res.body.url);
    assert.equal(servida.status, 200);
    assert.equal(servida.headers["content-type"], "image/png");
    assert.deepEqual(Buffer.from(servida.body), PNG);
  });

  it("415 IMAGEN_INVALIDA para text/plain o bytes que no son imagen", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    for (const [tipo, datos] of [
      ["text/plain", "hola"],
      ["image/jpeg", Buffer.from("no soy un jpg")],
      ["application/pdf", Buffer.from("%PDF-1.7")],
    ]) {
      const res = await subir(token, tipo, datos);
      assert.equal(res.status, 415, tipo);
      assert.deepEqual(res.body.error, { codigo: "IMAGEN_INVALIDA", mensaje: "La imagen tiene que ser JPG o PNG" });
    }
  });

  it("413 IMAGEN_MUY_GRANDE con más de 5 MB", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    const res = await subir(token, "image/png", grande);
    assert.equal(res.status, 413);
    assert.deepEqual(res.body.error, { codigo: "IMAGEN_MUY_GRANDE", mensaje: "La imagen no puede pesar más de 5 MB" });
  });

  it("un JSON grande en otra ruta no responde con el mensaje de la imagen", async () => {
    const res = await request(app)
      .post("/organizadores/sesiones")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a".repeat(200 * 1024), contrasena: "x" }));
    assert.notEqual(res.body.error?.codigo, "IMAGEN_MUY_GRANDE");
  });

  it("un evento creado con esa imagen devuelve imagenUrl", async () => {
    const token = await tokenDeOrganizador(LA_TRAMA);
    const { body } = await subir(token, "image/png", PNG);
    const res = await request(app)
      .post("/organizadores/eventos")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "Borrador", nombre: "Con imagen", imagenId: body.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.evento.imagenUrl, body.url);
  });
});
