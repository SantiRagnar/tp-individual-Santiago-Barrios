import { EventoNoEncontrado } from "../errors/ErrorDeDominio.js";
import * as eventosRepository from "../repository/eventosRepository.js";
import * as favoritosRepository from "../repository/favoritosRepository.js";
import { contextoDe } from "./explorarService.js";
import { ahora } from "./reloj.js";
import { esVisibleParaCompradores } from "./visibilidadEvento.js";

// Favoritos del comprador (research R10, FR-019 a FR-023). Marcar y desmarcar son idempotentes.

/** Solo un evento visible se puede marcar (FR-023). */
export function marcar(compradorId, eventoId) {
  const evento = eventosRepository.buscarPorId(eventoId);
  const momento = ahora();
  if (!evento || !esVisibleParaCompradores(evento, momento)) throw new EventoNoEncontrado();
  favoritosRepository.marcar(compradorId, eventoId, momento.toISOString());
}

/** Quita aunque el evento ya no sea visible o no fuera favorito. */
export function desmarcar(compradorId, eventoId) {
  favoritosRepository.desmarcar(compradorId, eventoId);
}

/**
 * Favoritos que siguen visibles, por fecha (FR-021). Los de eventos que dejaron de ser visibles se
 * conservan pero no se muestran. Sin paginar: son los de un solo comprador (Assumption de escalabilidad).
 */
export function listar(compradorId) {
  const momento = ahora();
  return favoritosRepository
    .idsDe(compradorId)
    .map((id) => eventosRepository.buscarPorId(id))
    .filter((evento) => evento && esVisibleParaCompradores(evento, momento))
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime() || (a.id < b.id ? -1 : 1))
    .map((evento) => ({ evento, contexto: contextoDe(compradorId, evento) }));
}
