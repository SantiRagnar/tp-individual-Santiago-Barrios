import * as eventosService from "../services/eventosService.js";
import { aEventoDto, aEventoResumenDto } from "../dto/eventoDto.js";

/** Traduce HTTP ↔ eventosService. Requiere requiereSesion("organizador") antes (req.sesion). */
export const eventosOrganizadorController = {
  listar(req, res) {
    const eventos = eventosService.listar(req.sesion.usuario.id);
    res.json({ eventos: eventos.map(aEventoResumenDto) });
  },

  /** Requiere validar(eventoSchema) antes. */
  crear(req, res) {
    const evento = eventosService.crear(req.sesion.usuario.id, req.body);
    res.status(201).json({ evento: aEventoDto(evento) });
  },

  /** Requiere validar(eventoSchema) antes. */
  editar(req, res) {
    const evento = eventosService.editar(req.sesion.usuario.id, req.params.id, req.body);
    res.json({ evento: aEventoDto(evento) });
  },

  obtener(req, res) {
    const evento = eventosService.obtener(req.sesion.usuario.id, req.params.id);
    res.json({ evento: aEventoDto(evento) });
  },
};
