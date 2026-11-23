import { CompraNoEncontrada, DatosInvalidos } from "../errors/ErrorDeDominio.js";
import * as comprasRepository from "../repository/comprasRepository.js";
import * as consultasRepository from "../repository/consultasRepository.js";
import * as eventosRepository from "../repository/eventosRepository.js";
import * as organizadoresRepository from "../repository/organizadoresRepository.js";
import { compraDe } from "./comprasService.js";
import * as eventosService from "./eventosService.js";
import { noLeidaPara, ultimoMensaje } from "./reglasConsulta.js";
import { ahora } from "./reloj.js";

// Consultas: el chat de cada compra entre su comprador y el organizador del evento
// (specs/007-consultas-chat, research R1–R9; data-model.md § Consulta).
//
// Todo es SINCRÓNICO, como el resto de los servicios: sin `await` entre verificar (propiedad, cursor)
// y escribir (mensaje, lectura). Primero se verifica la propiedad: un 404 nunca revela si la compra existe.

const CURSOR_INVALIDO = () => new DatosInvalidos([{ campo: "despuesDe", mensaje: "El mensaje indicado no es de esta consulta" }]);

/** Mensajes de la compra después de `despuesDe` (todos si no viene). Un id ajeno → DatosInvalidos. */
function mensajesDe(numero, despuesDe) {
  const mensajes = consultasRepository.mensajesDespuesDe(numero, despuesDe ?? null);
  if (mensajes === undefined) throw CURSOR_INVALIDO();
  return mensajes;
}

function escribir(compra, autor, texto) {
  return consultasRepository.agregarMensaje({
    compraNumero: compra.numero,
    eventoId: compra.eventoId,
    autor,
    texto,
    enviadoEn: ahora().toISOString(),
  }).mensaje;
}

// ── Comprador ──

/** Mensajes del chat de una compra propia (US1). No marca como leída (research R4). */
export function mensajesDeComprador(compradorId, numero, { despuesDe } = {}) {
  const compra = compraDe(compradorId, numero);
  return mensajesDe(compra.numero, despuesDe);
}

/** El comprador escribe en el chat de su compra, en cualquier estado (FR-004). `texto` ya viene validado. */
export function enviarComoComprador(compradorId, numero, texto) {
  return escribir(compraDe(compradorId, numero), "comprador", texto);
}

/** El comprador abrió el chat (FR-022). */
export function marcarLeidaComprador(compradorId, numero) {
  const compra = compraDe(compradorId, numero);
  consultasRepository.marcarVista(compra.numero, "comprador");
}

/**
 * Consultas de las compras del comprador con una respuesta del organizador sin leer (FR-022, FR-024), la del
 * último mensaje más reciente primero. Devuelve [{ compra, evento, organizador, consulta }].
 */
export function noLeidasDeComprador(compradorId) {
  return comprasRepository
    .listarPorComprador(compradorId)
    .map((compra) => ({ compra, consulta: consultasRepository.buscar(compra.numero) }))
    .filter(({ consulta }) => noLeidaPara(consulta, "comprador"))
    .sort((a, b) => new Date(ultimoMensaje(b.consulta).enviadoEn) - new Date(ultimoMensaje(a.consulta).enviadoEn))
    .map(({ compra, consulta }) => {
      const evento = eventosRepository.buscarPorId(compra.eventoId);
      return { compra, consulta, evento, organizador: organizadoresRepository.buscarPorId(evento.organizadorId) };
    });
}

// ── Organizador ──

/** Evento propio y compra de ese evento (FR-014). El orden es evento → compra, como en marcarUtilizada. */
function compraDelEvento(organizadorId, eventoId, numero) {
  const evento = eventosService.obtener(organizadorId, eventoId);
  const compra = comprasRepository.buscarPorNumero(numero);
  if (!compra || compra.eventoId !== evento.id) throw new CompraNoEncontrada();
  return { evento, compra };
}

/** Orden de la lista (research R8): último mensaje más reciente primero; a igual hora, número desc. */
function compararPorUltimoMensaje(a, b) {
  const diferencia = new Date(ultimoMensaje(b.consulta).enviadoEn) - new Date(ultimoMensaje(a.consulta).enviadoEn);
  if (diferencia !== 0) return diferencia;
  return a.compra.numero < b.compra.numero ? 1 : a.compra.numero > b.compra.numero ? -1 : 0;
}

/**
 * Consultas del evento con al menos un mensaje, ordenadas (FR-010), y cuántas están no leídas para el
 * organizador (FR-009, FR-017). No marca nada como leído. Devuelve { evento, items: [{ compra, consulta }], noLeidas }.
 */
export function consultasDelEvento(organizadorId, eventoId) {
  const evento = eventosService.obtener(organizadorId, eventoId);
  const items = consultasRepository
    .delEvento(evento.id)
    .map((consulta) => ({ compra: comprasRepository.buscarPorNumero(consulta.compraNumero), consulta }))
    .sort(compararPorUltimoMensaje);
  return { evento, items, noLeidas: items.filter(({ consulta }) => noLeidaPara(consulta, "organizador")).length };
}

/**
 * Consulta de una compra del evento, aunque no tenga mensajes (se abre desde Ventas, FR-013).
 * Devuelve { compra, consulta (o null), mensajes } con los mensajes después de `despuesDe`.
 */
export function consultaDeCompra(organizadorId, eventoId, numero, { despuesDe } = {}) {
  const { compra } = compraDelEvento(organizadorId, eventoId, numero);
  return { compra, consulta: consultasRepository.buscar(compra.numero), mensajes: mensajesDe(compra.numero, despuesDe) };
}

/** El organizador responde, o escribe primero (FR-013), en cualquier estado (FR-004). */
export function enviarComoOrganizador(organizadorId, eventoId, numero, texto) {
  const { compra } = compraDelEvento(organizadorId, eventoId, numero);
  return escribir(compra, "organizador", texto);
}

/** El organizador abrió la consulta (FR-016). Sin mensajes no hace nada (no la crea). */
export function marcarLeidaOrganizador(organizadorId, eventoId, numero) {
  const { compra } = compraDelEvento(organizadorId, eventoId, numero);
  consultasRepository.marcarVista(compra.numero, "organizador");
}
