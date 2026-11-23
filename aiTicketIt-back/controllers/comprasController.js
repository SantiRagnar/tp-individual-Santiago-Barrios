import { aCompraDto } from "../dto/compraDto.js";
import * as comprasService from "../services/comprasService.js";

/** Traduce HTTP ↔ comprasService. Requiere requiereSesion("comprador") antes (req.sesion). Sin async (research R2). */
const dto = ({ compra, evento, organizador, ahora, consultaNoLeida }) => aCompraDto(compra, evento, organizador, ahora, { consultaNoLeida });

export const comprasController = {
  crear(req, res) {
    res.status(201).json({ compra: dto(comprasService.comprar(req.sesion.usuario.id, req.body)) });
  },

  listar(req, res) {
    res.json({ compras: comprasService.listar(req.sesion.usuario.id).map(dto) });
  },

  obtener(req, res) {
    res.json({ compra: dto(comprasService.obtener(req.sesion.usuario.id, req.params.numero)) });
  },

  completarPago(req, res) {
    res.json({ compra: dto(comprasService.completarPago(req.sesion.usuario.id, req.params.numero)) });
  },

  cancelar(req, res) {
    res.json({ compra: dto(comprasService.cancelar(req.sesion.usuario.id, req.params.numero)) });
  },

  // Feature 006 (specs/006-calificaciones-opiniones/contracts/calificaciones.openapi.yaml).
  calificar(req, res) {
    res.status(201).json({ compra: dto(comprasService.calificar(req.sesion.usuario.id, req.params.numero, req.body)) });
  },

  pendienteDeCalificar(req, res) {
    const pendiente = comprasService.pendienteDeCalificar(req.sesion.usuario.id);
    res.json({ compra: pendiente ? dto(pendiente) : null });
  },
};
