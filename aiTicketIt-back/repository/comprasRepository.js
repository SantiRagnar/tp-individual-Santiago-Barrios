import { Compra } from "../models/Compra.js";
import { comprasSeed, eventosSeed } from "./seed.js";

// Indexado por data-model.md Compra.numero. Además, un índice por organizador con sus compras
// calificadas (la más reciente primero) y el acumulado de puntajes, para que el puntaje y las
// reseñas no recorran todas las compras en cada pedido (research R8).
const porNumero = new Map();
const calificacionesPorOrganizador = new Map(); // organizadorId → { calificadas: Compra[], suma, cantidad }

/** Orden de las reseñas: [calificadaEn desc, numero desc]. Negativo si `a` va antes que `b`. */
function compararClaves([fechaA, numeroA], [fechaB, numeroB]) {
  const diferencia = new Date(fechaB).getTime() - new Date(fechaA).getTime();
  if (diferencia !== 0) return diferencia;
  return numeroA < numeroB ? 1 : numeroA > numeroB ? -1 : 0;
}

const claveDe = (compra) => [compra.calificacion.calificadaEn, compra.numero];

function indiceDe(organizadorId) {
  let indice = calificacionesPorOrganizador.get(organizadorId);
  if (!indice) {
    indice = { calificadas: [], suma: 0, cantidad: 0 };
    calificacionesPorOrganizador.set(organizadorId, indice);
  }
  return indice;
}

/** Guarda una compra. `organizadorId` es el del evento de la compra (lo necesita el índice). */
export function guardar(datos, { organizadorId }) {
  const compra = datos instanceof Compra ? datos : new Compra(datos);
  porNumero.set(compra.numero, compra);

  if (compra.calificacion) {
    const indice = indiceDe(organizadorId);
    const clave = claveDe(compra);
    // Inserción ordenada: las compras del seed y de tests llegan en cualquier orden.
    const posicion = indice.calificadas.findIndex((otra) => compararClaves(clave, claveDe(otra)) < 0);
    indice.calificadas.splice(posicion === -1 ? indice.calificadas.length : posicion, 0, compra);
    indice.suma += compra.calificacion.puntaje;
    indice.cantidad += 1;
  }
  return compra;
}

export function buscarPorNumero(numero) {
  return porNumero.get(numero) ?? null;
}

/** { suma, cantidad } de los puntajes del organizador, sin recorrer compras. */
export function resumenDeCalificaciones(organizadorId) {
  const indice = calificacionesPorOrganizador.get(organizadorId);
  return indice ? { suma: indice.suma, cantidad: indice.cantidad } : { suma: 0, cantidad: 0 };
}

/**
 * Hasta `limite` compras calificadas del organizador, de la más reciente a la más antigua,
 * empezando después de la clave `despuesDe` ([calificadaEn, numero]) si se indica.
 */
export function listarCalificadas(organizadorId, { despuesDe = null, limite }) {
  const indice = calificacionesPorOrganizador.get(organizadorId);
  if (!indice) return [];
  const desde = despuesDe ? indice.calificadas.findIndex((c) => compararClaves(claveDe(c), despuesDe) > 0) : 0;
  if (desde === -1) return [];
  return indice.calificadas.slice(desde, desde + limite);
}

export function reiniciar() {
  porNumero.clear();
  calificacionesPorOrganizador.clear();
  const organizadorDe = new Map(eventosSeed.map((e) => [e.id, e.organizadorId]));
  // structuredClone: los tests pueden modificar compras sin tocar el seed.
  comprasSeed.forEach((datos) => guardar(structuredClone(datos), { organizadorId: organizadorDe.get(datos.eventoId) }));
}

reiniciar();
