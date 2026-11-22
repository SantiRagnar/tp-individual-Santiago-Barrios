import * as explorarService from "../services/explorarService.js";
import * as resenasService from "../services/resenasService.js";
import { aEventoCompradorDetalleDto, aEventoCompradorResumenDto, aResenaDto } from "../dto/eventoCompradorDto.js";

const aResenasDto = (resenas) => resenas.map(({ compra, comprador, evento }) => aResenaDto(compra, comprador, evento));

/**
 * Traduce HTTP ↔ explorarService y resenasService. Requiere requiereSesion("comprador") antes
 * (req.sesion) y validarQuery con el schema de cada ruta (req.query normalizado).
 */
export const eventosCompradorController = {
  listar(req, res) {
    const { eventos, total, siguiente } = explorarService.listar(req.sesion.usuario.id, req.query);
    res.json({
      eventos: eventos.map(({ evento, contexto }) => aEventoCompradorResumenDto(evento, contexto)),
      total,
      siguiente,
    });
  },

  obtener(req, res) {
    const { evento, contexto, resenas } = explorarService.obtener(req.sesion.usuario.id, req.params.id);
    const primeraPagina = { resenas: aResenasDto(resenas.resenas), siguiente: resenas.siguiente };
    res.json({ evento: aEventoCompradorDetalleDto(evento, contexto, primeraPagina) });
  },

  resenas(req, res) {
    const { resenas, total, siguiente } = resenasService.pagina(req.params.id, req.query.cursor);
    res.json({ resenas: aResenasDto(resenas), total, siguiente });
  },
};
