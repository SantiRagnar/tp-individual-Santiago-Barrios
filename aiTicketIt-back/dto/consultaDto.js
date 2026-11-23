import { noLeidaPara, ultimoMensaje } from "../services/reglasConsulta.js";
import { nombreDelComprador } from "./ventaDto.js";

// Vistas de consultas (specs/007-consultas-chat/data-model.md § Vistas; contracts/consultas.openapi.yaml).

export function aMensajeDto(mensaje) {
  return { id: mensaje.id, autor: mensaje.autor, texto: mensaje.texto, enviadoEn: mensaje.enviadoEn };
}

const mensajeONull = (mensaje) => (mensaje ? aMensajeDto(mensaje) : null);

/** Fila de Consultas del evento y cabecera del chat del organizador. `noLeida` es la del organizador. */
export function aConsultaResumenDto(compra, { comprador, consulta }) {
  return {
    numero: compra.numero,
    comprador: { nombre: nombreDelComprador(comprador) },
    tipoDeEntrada: { nombre: compra.tipoDeEntradaNombre ?? null },
    cantidad: compra.cantidad,
    monto: compra.monto,
    estado: compra.estado,
    ultimoMensaje: mensajeONull(ultimoMensaje(consulta)),
    noLeida: noLeidaPara(consulta, "organizador"),
  };
}

/** Consulta no leída por el comprador, para el toast. */
export function aConsultaNoLeidaDto(compra, { evento, organizador, consulta }) {
  return {
    numero: compra.numero,
    evento: { id: evento.id, nombre: evento.nombre },
    organizador: { nombre: organizador.nombre },
    ultimoMensaje: mensajeONull(ultimoMensaje(consulta)),
  };
}
