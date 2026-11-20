import { Organizador } from "../models/Organizador.js";
import { organizadoresSeed } from "./seed.js";

// Indexado por email normalizado: el email es único entre organizadores (data-model.md Organizador.email).
const porEmail = new Map();

export function agregar(datos) {
  const organizador = new Organizador(datos);
  if (porEmail.has(organizador.email)) {
    throw new Error(`Ya existe un organizador con el email ${organizador.email}`);
  }
  porEmail.set(organizador.email, organizador);
  return organizador;
}

export function buscarPorEmail(email) {
  return porEmail.get(email) ?? null;
}

export function buscarPorId(id) {
  for (const organizador of porEmail.values()) {
    if (organizador.id === id) return organizador;
  }
  return null;
}

export function reiniciar() {
  porEmail.clear();
  organizadoresSeed.forEach(agregar);
}

reiniciar();
