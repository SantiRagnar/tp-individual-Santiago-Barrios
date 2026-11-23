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

// Debe coincidir con specs/003-explorar-detalle-evento/contracts/compradores.openapi.yaml (Principio IV).
const ESPERADO_COMPRADORES = {
  "/compradores/eventos": { get: ["200", "400", "401"] },
  "/compradores/eventos/{id}": { get: ["200", "401", "404"] },
  "/compradores/organizadores/{id}/resenas": { get: ["200", "400", "401", "404"] },
  "/compradores/favoritos": { get: ["200", "401"] },
  "/compradores/favoritos/{eventoId}": { put: ["204", "401", "404"], delete: ["204", "401"] },
};

describe("/docs.json — explorar, detalle y favoritos (feature 003)", () => {
  it("documenta los endpoints con sus métodos y respuestas", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const [ruta, metodos] of Object.entries(ESPERADO_COMPRADORES)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
      }
    }
  });

  it("define los schemas del contrato y la respuesta EventoNoEncontrado que reutiliza", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const schema of [
      "OrganizadorResumen",
      "EventoCompradorResumen",
      "EventoCompradorDetalle",
      "TipoDeEntradaComprador",
      "Resena",
      "PaginaDeEventos",
      "PaginaDeResenas",
    ]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
    assert.ok(body.components.responses.EventoNoEncontrado);
  });
});

// Debe coincidir con specs/005-panel-evento/contracts/ventas.openapi.yaml (Principio IV).
const ESPERADO_VENTAS = {
  "/organizadores/eventos/{id}/ventas": { get: ["200", "400", "401", "404"] },
  "/organizadores/eventos/{id}/ventas/{numero}/utilizacion": { post: ["200", "401", "404", "409"] },
};

describe("/docs.json — ventas del evento (feature 005)", () => {
  it("documenta los endpoints con sus métodos, respuestas y el tag Ventas del evento", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const [ruta, metodos] of Object.entries(ESPERADO_VENTAS)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
        assert.deepEqual(documentada[metodo].tags, ["Ventas del evento"], `${metodo.toUpperCase()} ${ruta}`);
      }
    }
    for (const schema of ["EstadoCompra", "MedioDePago", "Venta", "ResumenDeVentas", "PaginaDeVentas"]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
  });
});

const ESPERADO_COMPRAS = {
  "/compradores/compras": { post: ["201", "400", "401", "404", "409"], get: ["200", "401"] },
  "/compradores/compras/{numero}": { get: ["200", "401", "404"] },
  "/compradores/compras/{numero}/pago": { post: ["200", "401", "404", "409"] },
  "/compradores/compras/{numero}/cancelacion": { post: ["200", "401", "404", "409"] },
};

describe("/docs.json — compra, pago simulado y Mis compras (feature 004)", () => {
  it("documenta los endpoints con sus métodos y respuestas", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const [ruta, metodos] of Object.entries(ESPERADO_COMPRAS)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
      }
    }
  });

  it("define los schemas del contrato y la respuesta CompraNoEncontrada", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const schema of ["Compra", "NuevaCompra", "MedioDePago", "EstadoCompra"]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
    assert.ok(body.components.responses.CompraNoEncontrada);
  });
});

// Debe coincidir con specs/006-calificaciones-opiniones/contracts/calificaciones.openapi.yaml (Principio IV).
const ESPERADO_CALIFICACIONES = {
  "/compradores/compras/{numero}/calificacion": { post: ["201", "400", "401", "404", "409"] },
  "/compradores/calificaciones/pendiente": { get: ["200", "401"] },
};

describe("/docs.json — calificaciones (feature 006)", () => {
  it("documenta los endpoints con sus métodos, respuestas y el tag Calificaciones", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const [ruta, metodos] of Object.entries(ESPERADO_CALIFICACIONES)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
        assert.deepEqual(documentada[metodo].tags, ["Calificaciones"], `${metodo.toUpperCase()} ${ruta}`);
      }
    }
  });

  it("define NuevaCalificacion y los campos nuevos de Compra", async () => {
    const { body } = await request(app).get("/docs.json");
    assert.ok(body.components.schemas.NuevaCalificacion);
    const compra = body.components.schemas.Compra;
    assert.ok(compra.properties.motivoNoCalificable);
    assert.ok(compra.properties.acciones.properties.calificar);
    assert.ok(compra.required.includes("motivoNoCalificable"));
  });
});

// Debe coincidir con specs/007-consultas-chat/contracts/consultas.openapi.yaml (Principio IV).
const ESPERADO_CONSULTAS = {
  "/compradores/compras/{numero}/mensajes": { get: ["200", "400", "401", "404"], post: ["201", "400", "401", "404"] },
  "/compradores/compras/{numero}/mensajes/lectura": { put: ["204", "401", "404"] },
  "/compradores/consultas/no-leidas": { get: ["200", "401"] },
  "/organizadores/eventos/{id}/consultas": { get: ["200", "401", "404"] },
  "/organizadores/eventos/{id}/consultas/{numero}": { get: ["200", "400", "401", "404"] },
  "/organizadores/eventos/{id}/consultas/{numero}/mensajes": { post: ["201", "400", "401", "404"] },
  "/organizadores/eventos/{id}/consultas/{numero}/lectura": { put: ["204", "401", "404"] },
};

describe("/docs.json — consultas (feature 007)", () => {
  it("documenta los 8 endpoints con sus métodos, respuestas y tags", async () => {
    const { body } = await request(app).get("/docs.json");
    let operaciones = 0;
    for (const [ruta, metodos] of Object.entries(ESPERADO_CONSULTAS)) {
      const documentada = body.paths[ruta];
      assert.ok(documentada, `falta ${ruta}`);
      const metodosDocumentados = Object.keys(documentada).filter((k) => k !== "parameters");
      assert.deepEqual(metodosDocumentados.sort(), Object.keys(metodos).sort(), ruta);
      for (const [metodo, codigos] of Object.entries(metodos)) {
        operaciones += 1;
        assert.deepEqual(Object.keys(documentada[metodo].responses).sort(), codigos, `${metodo.toUpperCase()} ${ruta}`);
        const tag = ruta.startsWith("/compradores") ? "Consultas (comprador)" : "Consultas (organizador)";
        assert.deepEqual(documentada[metodo].tags, [tag], `${metodo.toUpperCase()} ${ruta}`);
      }
    }
    assert.equal(operaciones, 8);
  });

  it("define los schemas nuevos y el campo consultaNoLeida en Compra", async () => {
    const { body } = await request(app).get("/docs.json");
    for (const schema of ["Mensaje", "NuevoMensaje", "ConsultaResumen", "ConsultaNoLeida"]) {
      assert.ok(body.components.schemas[schema], `falta el schema ${schema}`);
    }
    assert.ok(body.components.schemas.Compra.properties.consultaNoLeida);
    assert.ok(body.components.schemas.Compra.required.includes("consultaNoLeida"));
  });
});
