import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validarCambiosConVentas, validarParaPublicar } from "../../services/reglasEvento.js";
import { HOY } from "../helpers/sesion.js";

/** Un evento que cumple todas las reglas; cada test rompe una. */
const completo = (cambios = {}) => ({
  nombre: "Las brujas de Salem",
  descripcion: null,
  categoria: "Drama",
  fechaHora: "2026-12-19T21:00:00-03:00",
  ubicacion: "Galpón de Guevara",
  imagenId: null,
  materialMultimedia: [],
  tiposDeEntrada: [
    { nombre: "General", cupo: 120, precio: 13000 },
    { nombre: "Platea", cupo: 60, precio: 19000 },
  ],
  estado: "Publicado",
  ...cambios,
});

const tipo = (cambios) => ({ nombre: "General", cupo: 10, precio: 100, ...cambios });

describe("reglasEvento.validarParaPublicar (FR-011, FR-012; data-model.md)", () => {
  it("un evento completo no tiene errores", () => {
    assert.deepEqual(validarParaPublicar(completo(), HOY), []);
  });

  it("devuelve todos los errores juntos, uno por campo", () => {
    const errores = validarParaPublicar(
      completo({ nombre: null, fechaHora: null, ubicacion: null, tiposDeEntrada: [] }),
      HOY,
    );
    assert.deepEqual(errores, [
      { campo: "nombre", mensaje: "Poné un nombre al evento" }, // Evento.nombre
      { campo: "fechaHora", mensaje: "Elegí fecha y hora" }, // Evento.fechaHora
      { campo: "ubicacion", mensaje: "Indicá dónde se hace el evento" }, // Evento.ubicacion
      { campo: "tiposDeEntrada", mensaje: "Agregá al menos un tipo de entrada" }, // Evento.tiposDeEntrada
    ]);
  });

  it("la fecha tiene que ser futura, comparando instantes", () => {
    const pasada = validarParaPublicar(completo({ fechaHora: "2026-11-09T11:59:00-03:00" }), HOY);
    assert.deepEqual(pasada, [{ campo: "fechaHora", mensaje: "La fecha tiene que ser futura" }]);
    const ahoraMismo = validarParaPublicar(completo({ fechaHora: "2026-11-09T15:00:00Z" }), HOY); // = 12:00 -03:00
    assert.deepEqual(ahoraMismo, [{ campo: "fechaHora", mensaje: "La fecha tiene que ser futura" }]);
    assert.deepEqual(validarParaPublicar(completo({ fechaHora: "2026-11-09T15:01:00Z" }), HOY), []);
  });

  it("cada tipo necesita nombre, cupo y precio (TipoDeEntrada.nombre, .cupo, .precio)", () => {
    const errores = validarParaPublicar(
      completo({ tiposDeEntrada: [tipo({ nombre: null, cupo: null, precio: null })] }),
      HOY,
    );
    assert.deepEqual(errores, [
      { campo: "tiposDeEntrada.0.nombre", mensaje: "Poné un nombre" },
      { campo: "tiposDeEntrada.0.cupo", mensaje: "Indicá el cupo" },
      { campo: "tiposDeEntrada.0.precio", mensaje: "Indicá el precio" },
    ]);
  });

  it("el nombre de tipo es único sin distinguir mayúsculas ni espacios", () => {
    const errores = validarParaPublicar(
      completo({ tiposDeEntrada: [tipo({ nombre: " VIP " }), tipo({ nombre: "General" }), tipo({ nombre: "vip" })] }),
      HOY,
    );
    assert.deepEqual(errores, [{ campo: "tiposDeEntrada.2.nombre", mensaje: "Ya hay una entrada con este nombre" }]);
  });

  it("el cupo tiene que ser 1 o más", () => {
    const errores = validarParaPublicar(completo({ tiposDeEntrada: [tipo({ cupo: 0 }), tipo({ nombre: "B", cupo: -3 })] }), HOY);
    assert.deepEqual(errores, [
      { campo: "tiposDeEntrada.0.cupo", mensaje: "El cupo tiene que ser 1 o más" },
      { campo: "tiposDeEntrada.1.cupo", mensaje: "El cupo tiene que ser 1 o más" },
    ]);
  });

  it("el precio no puede ser negativo; 0 es válido (entrada gratuita)", () => {
    assert.deepEqual(validarParaPublicar(completo({ tiposDeEntrada: [tipo({ precio: -1 })] }), HOY), [
      { campo: "tiposDeEntrada.0.precio", mensaje: "El precio no puede ser negativo" },
    ]);
    assert.deepEqual(validarParaPublicar(completo({ tiposDeEntrada: [tipo({ precio: 0 })] }), HOY), []);
  });
});

describe("reglasEvento.validarCambiosConVentas (FR-020, research R6)", () => {
  // Bodas de sangre: General 200/80, Platea 60/30 (TipoDeEntrada.cupo / TipoDeEntrada.vendidas)
  const guardado = {
    tiposDeEntrada: [
      { id: "tip-6", nombre: "General", cupo: 200, precio: 15000, vendidas: 80 },
      { id: "tip-7", nombre: "Platea", cupo: 60, precio: 21000, vendidas: 30 },
      { id: "tip-50", nombre: "Pullman", cupo: 10, precio: 5000, vendidas: 0 },
    ],
  };
  const general = { id: "tip-6", nombre: "General", cupo: 200, precio: 15000 };
  const platea = { id: "tip-7", nombre: "Platea", cupo: 60, precio: 21000 };

  it("quitar un tipo con ventas → 'Tiene ventas: no se puede quitar' en tiposDeEntrada", () => {
    assert.deepEqual(validarCambiosConVentas(guardado, { tiposDeEntrada: [general] }), [
      { campo: "tiposDeEntrada", mensaje: "Tiene ventas: no se puede quitar" },
    ]);
  });

  it("un cupo menor a las vendidas → error en el cupo de ese tipo", () => {
    assert.deepEqual(validarCambiosConVentas(guardado, { tiposDeEntrada: [general, { ...platea, cupo: 20 }] }), [
      { campo: "tiposDeEntrada.1.cupo", mensaje: "El cupo no puede ser menor a las vendidas (30)" },
    ]);
  });

  it("un cupo igual a las vendidas es válido", () => {
    assert.deepEqual(validarCambiosConVentas(guardado, { tiposDeEntrada: [general, { ...platea, cupo: 30 }] }), []);
  });

  it("cambiar nombre o precio de un tipo con ventas no es error", () => {
    const cambios = { tiposDeEntrada: [{ ...general, nombre: "Campo" }, { ...platea, precio: 25000 }] };
    assert.deepEqual(validarCambiosConVentas(guardado, cambios), []);
  });

  it("quitar un tipo sin ventas no es error", () => {
    assert.deepEqual(validarCambiosConVentas(guardado, { tiposDeEntrada: [general, platea] }), []);
  });

  it("agregar tipos nuevos (sin id) no es error", () => {
    const nuevo = { nombre: "VIP", cupo: 20, precio: 30000 };
    assert.deepEqual(validarCambiosConVentas(guardado, { tiposDeEntrada: [general, platea, nuevo] }), []);
  });

  it("un id de tipo que no es del evento → error en tiposDeEntrada.N.id", () => {
    assert.deepEqual(
      validarCambiosConVentas(guardado, { tiposDeEntrada: [general, platea, { id: "tip-1", nombre: "X", cupo: 1, precio: 1 }] }),
      [{ campo: "tiposDeEntrada.2.id", mensaje: "Ese tipo de entrada no es de este evento" }],
    );
  });
});
