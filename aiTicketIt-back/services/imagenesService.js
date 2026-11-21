import { randomUUID } from "node:crypto";
import * as imagenesRepository from "../repository/imagenesRepository.js";
import { ImagenInvalida, ImagenNoEncontrada } from "../errors/ErrorDeDominio.js";

/** Firma de los primeros bytes de cada formato aceptado (research R7). */
const FIRMAS = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
};

const tieneFirma = (datos, firma) => datos.length >= firma.length && firma.every((byte, i) => datos[i] === byte);

/** Devuelve la imagen o lanza ImagenNoEncontrada. Público: el id no es adivinable (research R7). */
export function obtener(id) {
  const imagen = imagenesRepository.buscarPorId(id);
  if (!imagen) throw new ImagenNoEncontrada();
  return imagen;
}

/** Guarda una imagen JPG o PNG del organizador. Verifica el tipo declarado y la firma de los bytes. */
export function subir(organizadorId, tipoMime, datos) {
  const firma = FIRMAS[tipoMime];
  if (!firma || !Buffer.isBuffer(datos) || !tieneFirma(datos, firma)) throw new ImagenInvalida();
  return imagenesRepository.guardar({ id: randomUUID(), organizadorId, tipoMime, datos });
}

/** true si la imagen existe y la subió ese organizador (data-model.md Imagen.organizadorId). */
export function esDelOrganizador(organizadorId, imagenId) {
  const imagen = imagenesRepository.buscarPorId(imagenId);
  return Boolean(imagen) && imagen.organizadorId === organizadorId;
}
