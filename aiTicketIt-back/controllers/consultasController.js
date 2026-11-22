import { aConsultaNoLeidaDto, aConsultaResumenDto, aMensajeDto } from "../dto/consultaDto.js";
import * as compradoresRepository from "../repository/compradoresRepository.js";
import * as consultasService from "../services/consultasService.js";

/**
 * Traduce HTTP ↔ consultasService (specs/007-consultas-chat/contracts/consultas.openapi.yaml).
 * Requiere requiereSesion(...) antes (req.sesion); los body y query llegan validados por mensajeSchema.
 */
const resumen = (compra, consulta) =>
  aConsultaResumenDto(compra, { comprador: compradoresRepository.buscarPorId(compra.compradorId), consulta });

export const consultasController = {
  // ── Comprador (router de /compradores/compras) ──
  mensajesDeComprador(req, res) {
    const mensajes = consultasService.mensajesDeComprador(req.sesion.usuario.id, req.params.numero, req.query);
    res.json({ mensajes: mensajes.map(aMensajeDto) });
  },

  enviarComoComprador(req, res) {
    const mensaje = consultasService.enviarComoComprador(req.sesion.usuario.id, req.params.numero, req.body.texto);
    res.status(201).json({ mensaje: aMensajeDto(mensaje) });
  },

  marcarLeidaComprador(req, res) {
    consultasService.marcarLeidaComprador(req.sesion.usuario.id, req.params.numero);
    res.status(204).end();
  },

  noLeidasDeComprador(req, res) {
    const items = consultasService.noLeidasDeComprador(req.sesion.usuario.id);
    res.json({ consultas: items.map(({ compra, ...contexto }) => aConsultaNoLeidaDto(compra, contexto)) });
  },

  // ── Organizador (router de /organizadores/eventos) ──
  consultasDelEvento(req, res) {
    const { items, noLeidas } = consultasService.consultasDelEvento(req.sesion.usuario.id, req.params.id);
    res.json({ consultas: items.map(({ compra, consulta }) => resumen(compra, consulta)), noLeidas });
  },

  consultaDeCompra(req, res) {
    const { compra, consulta, mensajes } = consultasService.consultaDeCompra(req.sesion.usuario.id, req.params.id, req.params.numero, req.query);
    res.json({ consulta: resumen(compra, consulta), mensajes: mensajes.map(aMensajeDto) });
  },

  enviarComoOrganizador(req, res) {
    const mensaje = consultasService.enviarComoOrganizador(req.sesion.usuario.id, req.params.id, req.params.numero, req.body.texto);
    res.status(201).json({ mensaje: aMensajeDto(mensaje) });
  },

  marcarLeidaOrganizador(req, res) {
    consultasService.marcarLeidaOrganizador(req.sesion.usuario.id, req.params.id, req.params.numero);
    res.status(204).end();
  },
};
