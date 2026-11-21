import { readFileSync } from "node:fs";
import { Imagen } from "../models/Imagen.js";
import { imagenesSeed } from "./seed.js";

// Indexado por data-model.md Imagen.id. Los bytes del seed se leen una sola vez.
const porId = new Map();
const carpetaSeed = new URL("./imagenes-seed/", import.meta.url);
const bytesDelSeed = new Map(imagenesSeed.map(({ id, archivo }) => [id, readFileSync(new URL(archivo, carpetaSeed))]));

export function guardar(datos) {
  const imagen = new Imagen(datos);
  porId.set(imagen.id, imagen);
  return imagen;
}

export function buscarPorId(id) {
  return porId.get(id) ?? null;
}

export function reiniciar() {
  porId.clear();
  for (const { id, tipoMime } of imagenesSeed) {
    guardar({ id, organizadorId: null, tipoMime, datos: bytesDelSeed.get(id) });
  }
}

reiniciar();
