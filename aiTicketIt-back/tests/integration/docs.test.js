import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../app.js";

// Debe coincidir con specs/001-login-email-password/contracts/sesiones.openapi.yaml (Principio IV).
const ESPERADO = {
  "/compradores/sesiones": { post: ["201", "400", "401"] },
  "/compradores/sesiones/actual": { get: ["200", "401"], delete: ["204", "401"] },
  "/organizadores/sesiones": { post: ["201", "400", "401"] },
  "/organizadores/sesiones/actual": { get: ["200", "401"], delete: ["204", "401"] },
};

describe("/docs.json", () => {
  it("documenta los endpoints de sesiones con sus métodos y respuestas", async () => {
    const res = await request(app).get("/docs.json");
    assert.equal(res.status, 200);

    for (const [ruta, metodos] of Object.entries(ESPERADO)) {
      const documentada = res.body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      assert.deepEqual(Object.keys(documentada).sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(
          Object.keys(documentada[metodo].responses).sort(),
          codigos,
          `${metodo.toUpperCase()} ${ruta}`,
        );
      }
    }
  });

  it("define los schemas y respuestas reutilizables del contrato", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const schema of ["Ingreso", "Token", "Comprador", "Organizador", "Error"]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
    for (const respuesta of ["DatosInvalidos", "CredencialesInvalidas", "SesionInvalida"]) {
      assert.ok(body.components.responses[respuesta], `falta la respuesta ${respuesta}`);
    }
    assert.equal(body.components.securitySchemes.bearer.scheme, "bearer");
  });
});

// Debe coincidir con specs/002-eventos-organizador/contracts/eventos.openapi.yaml (Principio IV).
const ESPERADO_EVENTOS = {
  "/organizadores/eventos": { get: ["200", "401"], post: ["201", "400", "401"] },
  "/organizadores/eventos/{id}": { get: ["200", "401", "404"], put: ["200", "400", "401", "404", "409"] },
  "/organizadores/imagenes": { post: ["201", "401", "413", "415"] },
  "/imagenes/{id}": { get: ["200", "404"] },
};

describe("/docs.json — eventos e imágenes (feature 002)", () => {
  it("documenta los endpoints con sus métodos y respuestas", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const [ruta, metodos] of Object.entries(ESPERADO_EVENTOS)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
      }
    }
  });

  it("define los schemas y respuestas del contrato", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const schema of ["Evento", "EventoResumen", "EventoEntrada", "TipoDeEntrada", "MaterialMultimedia"]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
    for (const respuesta of ["ReglasDeEvento", "EventoNoEncontrado"]) {
      assert.ok(body.components.responses[respuesta], `falta la respuesta ${respuesta}`);
    }
  });
});
