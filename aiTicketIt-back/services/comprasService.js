import {
  CalificacionNoPermitida,
  CancelacionNoPermitida,
  CompraNoEncontrada,
  CompraYaCalificada,
  EventoNoEncontrado,
  LugaresInsuficientes,
  PagoNoPermitido,
  PrecioCambiado,
} from "../errors/ErrorDeDominio.js";
import { Compra } from "../models/Compra.js";
import * as comprasRepository from "../repository/comprasRepository.js";
import * as eventosRepository from "../repository/eventosRepository.js";
import * as organizadoresRepository from "../repository/organizadoresRepository.js";
import { motivoNoCalificable, puedeCalificar } from "./reglasCalificacion.js";
import { estadoTrasCancelar, motivoNoCancelable, puedeCompletarPago } from "./reglasCompra.js";
import { ahora } from "./reloj.js";
import { esVisibleParaCompradores } from "./visibilidadEvento.js";

// Compras del comprador (specs/004-compra-pago-mis-compras, research R1–R7).
//
// INVARIANTE (research R2): comprar, completarPago, cancelar y calificar (feature 006, research R6) son SINCRÓNICAS. No agregar `await`, callbacks
// ni promesas entre la verificación (visibilidad, precio, lugares, estado) y la escritura (vendidas, compra).
// Node ejecuta JavaScript en un solo hilo y los datos viven en memoria: un bloque sin puntos de suspensión
// no puede intercalarse con otra request, y eso es lo que garantiza que nunca se venda más que el cupo.

/** Compra con su evento y organizador, lista para el DTO. */
function conContexto(compra, momento) {
  const evento = eventosRepository.buscarPorId(compra.eventoId);
  const organizador = organizadoresRepository.buscarPorId(evento.organizadorId);
  return { compra, evento, organizador, ahora: momento };
}

/** Una compra ajena responde igual que una inexistente (FR-021, SC-004). */
function compraDe(compradorId, numero) {
  const compra = comprasRepository.buscarPorNumero(numero);
  if (!compra || compra.compradorId !== compradorId) throw new CompraNoEncontrada();
  return compra;
}

/** Mis compras: todas las del comprador, la más nueva primero, incluidas las de eventos ya pasados (FR-013, FR-017). */
export function listar(compradorId) {
  const momento = ahora();
  return comprasRepository.listarPorComprador(compradorId).map((compra) => conContexto(compra, momento));
}

export function obtener(compradorId, numero) {
  return conContexto(compraDe(compradorId, numero), ahora());
}

/**
 * Pagar (simulado): crea la compra Confirmada y ocupa los lugares (FR-009). SINCRÓNICA (ver invariante arriba).
 * Orden de las verificaciones (research R4): evento visible → tipo con el precio que vio el comprador →
 * lugares. Un tipo eliminado nunca se informa como "sin lugares". Si algo falla, no se escribe nada.
 */
export function comprar(compradorId, { eventoId, tipoDeEntradaId, cantidad, medioDePago, precioUnitario }) {
  const momento = ahora();

  const evento = eventosRepository.buscarPorId(eventoId);
  if (!evento || !esVisibleParaCompradores(evento, momento)) throw new EventoNoEncontrado();

  const tipo = evento.tiposDeEntrada.find((t) => t.id === tipoDeEntradaId);
  if (!tipo || tipo.precio !== precioUnitario) throw new PrecioCambiado();

  if (cantidad > (tipo.cupo ?? 0) - tipo.vendidas) throw new LugaresInsuficientes();

  // --- Desde acá solo escrituras, sin nada que pueda suspender la ejecución (research R2). ---
  tipo.vendidas += cantidad;
  eventosRepository.guardar(evento);
  const compra = new Compra({
    numero: comprasRepository.siguienteNumero(),
    compradorId,
    eventoId,
    tipoDeEntradaId,
    tipoDeEntradaNombre: tipo.nombre,
    precioUnitario: tipo.precio,
    cantidad,
    monto: tipo.precio * cantidad,
    medioDePago,
    estado: "Confirmada",
    creadaEn: momento.toISOString(),
  });
  comprasRepository.guardar(compra, { organizadorId: evento.organizadorId });
  return conContexto(compra, momento);
}

/** Completar pago (simulado): Pendiente de pago → Confirmada. No cambia los lugares (FR-022). SINCRÓNICA. */
export function completarPago(compradorId, numero) {
  const momento = ahora();
  const compra = compraDe(compradorId, numero);
  const evento = eventosRepository.buscarPorId(compra.eventoId);
  if (!puedeCompletarPago(compra, evento, momento)) throw new PagoNoPermitido();

  compra.estado = "Confirmada";
  return conContexto(compra, momento);
}

/**
 * Cancelar: Confirmada → Reembolsada, Pendiente de pago → Cancelada, y libera los lugares (FR-024).
 * SINCRÓNICA. El reembolso es simulado: no se mueve plata.
 */
export function cancelar(compradorId, numero) {
  const momento = ahora();
  const compra = compraDe(compradorId, numero);
  const evento = eventosRepository.buscarPorId(compra.eventoId);
  if (motivoNoCancelable(compra, evento, momento) !== null) throw new CancelacionNoPermitida();

  // Un tipo con ventas no se puede quitar (reglasEvento de la 002), así que sigue existiendo.
  const tipo = evento.tiposDeEntrada.find((t) => t.id === compra.tipoDeEntradaId);
  if (tipo) {
    tipo.vendidas = Math.max(0, tipo.vendidas - compra.cantidad);
    eventosRepository.guardar(evento);
  }
  compra.estado = estadoTrasCancelar(compra);
  return conContexto(compra, momento);
}

/**
 * Calificar (specs/006-calificaciones-opiniones, research R2, R6): guarda puntaje y comentario en una compra
 * Utilizada todavía sin calificar y la suma a las reseñas de su organizador (FR-002 a FR-005). Sin condición de
 * fecha ni plazo. SINCRÓNICA (ver invariante arriba): dos pedidos simultáneos no pueden guardar dos calificaciones.
 */
export function calificar(compradorId, numero, { puntaje, comentario }) {
  const momento = ahora();
  const compra = compraDe(compradorId, numero);
  const motivo = motivoNoCalificable(compra);
  if (motivo === "YA_CALIFICADA") throw new CompraYaCalificada();
  if (motivo === "NO_UTILIZADA") throw new CalificacionNoPermitida();

  const evento = eventosRepository.buscarPorId(compra.eventoId);
  comprasRepository.calificar(
    numero,
    { puntaje, comentario: comentario ?? null, calificadaEn: momento.toISOString() },
    { organizadorId: evento.organizadorId },
  );
  return conContexto(compra, momento);
}

/**
 * Compra a recordar en Explorar (specs/006-calificaciones-opiniones/data-model.md § Compra pendiente de calificar,
 * research R7): entre las del comprador que se pueden calificar, la del evento con fecha más reciente; a igual
 * fecha, la de número mayor. null si no hay ninguna (FR-014).
 */
export function pendienteDeCalificar(compradorId) {
  const momento = ahora();
  const candidatas = comprasRepository
    .listarPorComprador(compradorId)
    .filter(puedeCalificar)
    .map((compra) => ({ compra, evento: eventosRepository.buscarPorId(compra.eventoId) }));
  if (candidatas.length === 0) return null;

  candidatas.sort((a, b) => {
    const diferencia = new Date(b.evento.fechaHora).getTime() - new Date(a.evento.fechaHora).getTime();
    if (diferencia !== 0) return diferencia;
    return a.compra.numero < b.compra.numero ? 1 : a.compra.numero > b.compra.numero ? -1 : 0;
  });
  return conContexto(candidatas[0].compra, momento);
}
