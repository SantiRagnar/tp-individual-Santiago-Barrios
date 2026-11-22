import { Calificacion, Compra } from "../models/Compra.js";
import { comprasSeed, eventosSeed } from "./seed.js";

// Indexado por data-model.md Compra.numero. Además:
// - un índice por organizador con sus compras calificadas (la más reciente primero) y el acumulado de
//   puntajes, para que el puntaje y las reseñas no recorran todas las compras (research R8 de la 003);
// - un índice por comprador para Mis compras, y el contador de números A-NNNN (research R8 de la 004);
// - un índice por evento para el panel de ventas del organizador (research R3 de la 005).
const porNumero = new Map();
const calificacionesPorOrganizador = new Map(); // organizadorId → { calificadas: Compra[], suma, cantidad }
// Compras de cada evento ordenadas por [creadaEn desc, numero desc].
const comprasPorEvento = new Map(); // eventoId → Compra[]
const numerosPorComprador = new Map(); // compradorId → Set<numero>
let ultimoNumero = 0;

const FORMATO_NUMERO = /^A-(\d+)$/;

/** Orden de las reseñas: [calificadaEn desc, numero desc]. Negativo si `a` va antes que `b`. */
function compararClaves([fechaA, numeroA], [fechaB, numeroB]) {
  const diferencia = new Date(fechaB).getTime() - new Date(fechaA).getTime();
  if (diferencia !== 0) return diferencia;
  return numeroA < numeroB ? 1 : numeroA > numeroB ? -1 : 0;
}

const claveDe = (compra) => [compra.calificacion.calificadaEn, compra.numero];
const claveDeVenta = (compra) => [compra.creadaEn, compra.numero];

/** Inserta `compra` en `lista` respetando el orden de `compararClaves` sobre `clave`. */
function insertarOrdenada(lista, compra, clave) {
  const propia = clave(compra);
  const posicion = lista.findIndex((otra) => compararClaves(propia, clave(otra)) < 0);
  lista.splice(posicion === -1 ? lista.length : posicion, 0, compra);
}

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
  const anterior = porNumero.get(compra.numero);
  porNumero.set(compra.numero, compra);

  // Índice por evento: si la compra ya estaba (se vuelve a guardar), se reemplaza.
  let delEvento = comprasPorEvento.get(compra.eventoId);
  if (!delEvento) {
    delEvento = [];
    comprasPorEvento.set(compra.eventoId, delEvento);
  }
  if (anterior) {
    const lista = comprasPorEvento.get(anterior.eventoId);
    const posicion = lista?.indexOf(anterior) ?? -1;
    if (posicion !== -1) lista.splice(posicion, 1);
  }
  insertarOrdenada(delEvento, compra, claveDeVenta);

  if (!numerosPorComprador.has(compra.compradorId)) numerosPorComprador.set(compra.compradorId, new Set());
  numerosPorComprador.get(compra.compradorId).add(compra.numero);
  const coincidencia = FORMATO_NUMERO.exec(compra.numero);
  if (coincidencia) ultimoNumero = Math.max(ultimoNumero, Number(coincidencia[1]));

  if (compra.calificacion) {
    const indice = indiceDe(organizadorId);
    // Inserción ordenada: las compras del seed y de tests llegan en cualquier orden.
    insertarOrdenada(indice.calificadas, compra, claveDe);
    indice.suma += compra.calificacion.puntaje;
    indice.cantidad += 1;
  }
  return compra;
}

/**
 * Califica una compra ya guardada (specs/006-calificaciones-opiniones/research.md R2): asigna la calificación
 * y la suma al índice del organizador (orden [calificadaEn desc, numero desc], suma y cantidad). No vuelve a
 * indexar por evento ni por comprador. Las reglas (Utilizada, una sola vez, propia) las verifica el servicio;
 * acá solo se protege la integridad del índice.
 */
export function calificar(numero, datos, { organizadorId }) {
  const compra = porNumero.get(numero);
  if (!compra) throw new Error(`No existe la compra ${numero}`);
  if (compra.calificacion) throw new Error(`La compra ${numero} ya está calificada`);

  compra.calificacion = new Calificacion(datos);
  const indice = indiceDe(organizadorId);
  insertarOrdenada(indice.calificadas, compra, claveDe);
  indice.suma += compra.calificacion.puntaje;
  indice.cantidad += 1;
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

/**
 * Hasta `limite` compras del evento, de la más reciente a la más antigua ([creadaEn desc, numero desc]),
 * solo del `estado` si se indica, empezando después de la clave `despuesDe` ([creadaEn, numero]).
 */
export function listarPorEvento(eventoId, { estado = null, despuesDe = null, limite }) {
  const delEvento = comprasPorEvento.get(eventoId) ?? [];
  const resultado = [];
  for (const compra of delEvento) {
    if (despuesDe && compararClaves(claveDeVenta(compra), despuesDe) <= 0) continue;
    if (estado && compra.estado !== estado) continue;
    resultado.push(compra);
    if (resultado.length === limite) break;
  }
  return resultado;
}

/** Todas las compras del evento (para el resumen de ventas). */
export function todasDelEvento(eventoId) {
  return [...(comprasPorEvento.get(eventoId) ?? [])];
}

/** Número para una compra nueva: sigue después del mayor existente, con al menos 4 dígitos (A-1043, A-10000). */
export function siguienteNumero() {
  ultimoNumero += 1;
  return `A-${String(ultimoNumero).padStart(4, "0")}`;
}

/** Orden de Mis compras: [creadaEn desc, numero desc]. */
function compararPorCreacion(a, b) {
  const diferencia = new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime();
  if (diferencia !== 0) return diferencia;
  return a.numero < b.numero ? 1 : a.numero > b.numero ? -1 : 0;
}

/** Compras del comprador, la más nueva primero (FR-013). Usa el índice por comprador. */
export function listarPorComprador(compradorId) {
  const numeros = numerosPorComprador.get(compradorId);
  if (!numeros) return [];
  return [...numeros].map((numero) => porNumero.get(numero)).sort(compararPorCreacion);
}

export function reiniciar() {
  porNumero.clear();
  calificacionesPorOrganizador.clear();
  comprasPorEvento.clear();
  numerosPorComprador.clear();
  ultimoNumero = 0;
  const eventoDe = new Map(eventosSeed.map((e) => [e.id, e]));
  comprasSeed.forEach((original) => {
    // structuredClone: los tests pueden modificar compras sin tocar el seed.
    const datos = structuredClone(original);
    const evento = eventoDe.get(datos.eventoId);
    // La copia del tipo (research R6 de la 004) se completa desde el evento del seed.
    const tipo = evento.tiposDeEntrada.find((t) => t.id === datos.tipoDeEntradaId);
    datos.tipoDeEntradaNombre ??= tipo?.nombre ?? null;
    datos.precioUnitario ??= datos.monto / datos.cantidad;
    guardar(datos, { organizadorId: evento.organizadorId });
  });
}

reiniciar();
