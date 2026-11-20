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
