import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

export const CONTRASENA_DESARROLLO = "Entradas2026";

/** Ingresa como organizador con la contraseña de desarrollo y devuelve el token. */
export async function tokenDeOrganizador(email) {
  const res = await request(app).post("/organizadores/sesiones").send({ email, contrasena: CONTRASENA_DESARROLLO });
  assert.equal(res.status, 201, `no se pudo ingresar como ${email}`);
  return res.body.token;
}

/** Ingresa como comprador con la contraseña de desarrollo y devuelve el token. */
export async function tokenDeComprador(email = "sofia.gomez@correo.com") {
  const res = await request(app).post("/compradores/sesiones").send({ email, contrasena: CONTRASENA_DESARROLLO });
  assert.equal(res.status, 201, `no se pudo ingresar como ${email}`);
  return res.body.token;
}

export const LA_TRAMA = "produccion@latrama.com.ar";
export const CLUB_DEL_CHISTE = "hola@clubdelchiste.com.ar";
export const LUMBRE = "contacto@lumbre.com.ar";

/** "Hoy" de los tests: la fecha de referencia de pantallas.md (research R2). */
export const HOY = new Date("2026-11-09T12:00:00-03:00");
