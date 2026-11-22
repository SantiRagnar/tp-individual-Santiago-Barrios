import * as favoritosService from "../services/favoritosService.js";
import { aEventoCompradorResumenDto } from "../dto/eventoCompradorDto.js";

/** Traduce HTTP ↔ favoritosService. Requiere requiereSesion("comprador") antes (req.sesion). */
export const favoritosController = {
  listar(req, res) {
    const favoritos = favoritosService.listar(req.sesion.usuario.id);
    res.json({ eventos: favoritos.map(({ evento, contexto }) => aEventoCompradorResumenDto(evento, contexto)) });
  },

  marcar(req, res) {
    favoritosService.marcar(req.sesion.usuario.id, req.params.eventoId);
    res.status(204).end();
  },

  desmarcar(req, res) {
    favoritosService.desmarcar(req.sesion.usuario.id, req.params.eventoId);
    res.status(204).end();
  },
};
