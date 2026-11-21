import { Evento } from "../models/Evento.js";
import { eventosSeed } from "./seed.js";

// Indexado por data-model.md Evento.id. Los contadores siguen después de los ids del seed (research R17).
const porId = new Map();
let ultimoEvento = 0;
let ultimoTipo = 0;

const numeroDe = (id) => Number(id.split("-")[1]);

export function listarPorOrganizador(organizadorId) {
  return [...porId.values()].filter((e) => e.organizadorId === organizadorId);
}

export function buscarPorId(id) {
  return porId.get(id) ?? null;
}

export function guardar(evento) {
  const guardado = evento instanceof Evento ? evento : new Evento(evento);
  porId.set(guardado.id, guardado);
  return guardado;
}

export function siguienteIdEvento() {
  ultimoEvento += 1;
  return `evt-${ultimoEvento}`;
}

export function siguienteIdTipo() {
  ultimoTipo += 1;
  return `tip-${ultimoTipo}`;
}

export function reiniciar() {
  porId.clear();
  // structuredClone: los tests pueden modificar eventos sin tocar el seed.
  eventosSeed.forEach((datos) => guardar(structuredClone(datos)));
  ultimoEvento = Math.max(0, ...eventosSeed.map((e) => numeroDe(e.id)));
  ultimoTipo = Math.max(0, ...eventosSeed.flatMap((e) => e.tiposDeEntrada.map((t) => numeroDe(t.id))));
}

reiniciar();
