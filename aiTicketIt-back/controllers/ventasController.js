import { aVentaDto } from "../dto/ventaDto.js";
import * as compradoresRepository from "../repository/compradoresRepository.js";
import { ahora } from "../services/reloj.js";
import * as ventasService from "../services/ventasService.js";

/** Traduce HTTP ↔ ventasService. Requiere requiereSesion("organizador") antes (req.sesion). */

function aVenta(compra, evento, momento) {
  return aVentaDto(compra, { comprador: compradoresRepository.buscarPorId(compra.compradorId), evento, ahora: momento });
}

export const ventasController = {
  /** Requiere validarQuery(ventasSchema) antes. */
  listar(req, res) {
    const { evento, resumen, compras, siguiente } = ventasService.pagina(req.sesion.usuario.id, req.params.id, req.query);
    const momento = ahora();
    res.json({ resumen, ventas: compras.map((compra) => aVenta(compra, evento, momento)), siguiente });
  },

  marcarUtilizada(req, res) {
    const { evento, compra, resumen } = ventasService.marcarUtilizada(req.sesion.usuario.id, req.params.id, req.params.numero);
    res.json({ venta: aVenta(compra, evento, ahora()), resumen });
  },
};
