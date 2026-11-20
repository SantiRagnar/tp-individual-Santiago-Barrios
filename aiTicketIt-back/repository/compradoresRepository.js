import { Comprador } from "../models/Comprador.js";
import { compradoresSeed } from "./seed.js";

// Indexado por email normalizado: el email es único entre compradores (data-model.md Comprador.email).
const porEmail = new Map();

export function agregar(datos) {
  const comprador = new Comprador(datos);
  if (porEmail.has(comprador.email)) {
    throw new Error(`Ya existe un comprador con el email ${comprador.email}`);
  }
  porEmail.set(comprador.email, comprador);
  return comprador;
}

export function buscarPorEmail(email) {
  return porEmail.get(email) ?? null;
}

export function buscarPorId(id) {
  for (const comprador of porEmail.values()) {
    if (comprador.id === id) return comprador;
  }
  return null;
}

export function reiniciar() {
  porEmail.clear();
  compradoresSeed.forEach(agregar);
}

reiniciar();
