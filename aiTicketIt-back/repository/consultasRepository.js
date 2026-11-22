import { Consulta, Mensaje } from "../models/Consulta.js";
import { consultasSeed } from "./seed.js";

// Consultas indexadas por número de compra (specs/007-consultas-chat/data-model.md § Repositorio; research R1).
// La consulta se crea con el primer mensaje. Además, un índice por evento con las compras que tienen mensajes,
// para armar Consultas del evento sin recorrer todas las compras.
const porNumero = new Map(); // compraNumero → Consulta
const numerosPorEvento = new Map(); // eventoId → Set<compraNumero>
let ultimoId = 0;

const CAMPO_VISTOS = { organizador: "vistosPorOrganizador", comprador: "vistosPorComprador" };
const FORMATO_ID = /^msj-(\d+)$/;

function indexar(consulta) {
  porNumero.set(consulta.compraNumero, consulta);
  if (!numerosPorEvento.has(consulta.eventoId)) numerosPorEvento.set(consulta.eventoId, new Set());
  numerosPorEvento.get(consulta.eventoId).add(consulta.compraNumero);
  for (const mensaje of consulta.mensajes) {
    const coincidencia = FORMATO_ID.exec(mensaje.id);
    if (coincidencia) ultimoId = Math.max(ultimoId, Number(coincidencia[1]));
  }
}

export function buscar(compraNumero) {
  return porNumero.get(compraNumero) ?? null;
}

/** Agrega un mensaje (crea la consulta si no existe). Quien escribe deja vista la conversación (research R2). */
export function agregarMensaje({ compraNumero, eventoId, autor, texto, enviadoEn }) {
  let consulta = porNumero.get(compraNumero);
  if (!consulta) {
    consulta = new Consulta({ compraNumero, eventoId });
    indexar(consulta);
  }
  ultimoId += 1;
  const mensaje = new Mensaje({ id: `msj-${ultimoId}`, autor, texto, enviadoEn });
  consulta.mensajes.push(mensaje);
  consulta[CAMPO_VISTOS[autor]] = consulta.mensajes.length;
  return { consulta, mensaje };
}

/** `parte` abrió la conversación. Sin consulta no hace nada (no la crea). */
export function marcarVista(compraNumero, parte) {
  const consulta = porNumero.get(compraNumero);
  if (consulta) consulta[CAMPO_VISTOS[parte]] = consulta.mensajes.length;
}

/**
 * Mensajes posteriores al de id `mensajeId` (todos si es null). `undefined` si ese id no es de esta
 * consulta: el servicio lo informa como dato inválido.
 */
export function mensajesDespuesDe(compraNumero, mensajeId) {
  const mensajes = porNumero.get(compraNumero)?.mensajes ?? [];
  if (!mensajeId) return [...mensajes];
  const posicion = mensajes.findIndex((m) => m.id === mensajeId);
  return posicion === -1 ? undefined : mensajes.slice(posicion + 1);
}

/** Consultas con al menos un mensaje del evento. */
export function delEvento(eventoId) {
  return [...(numerosPorEvento.get(eventoId) ?? [])].map((numero) => porNumero.get(numero));
}

export function reiniciar() {
  porNumero.clear();
  numerosPorEvento.clear();
  ultimoId = 0;
  // structuredClone: los tests pueden agregar mensajes sin tocar el seed.
  consultasSeed.forEach((datos) => indexar(new Consulta(structuredClone(datos))));
}

reiniciar();
