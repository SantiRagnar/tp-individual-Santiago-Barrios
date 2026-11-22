import {
  CompraNoConfirmada,
  CompraNoEncontrada,
  DatosInvalidos,
  EventoNoComenzo,
} from "../errors/ErrorDeDominio.js";
import * as comprasRepository from "../repository/comprasRepository.js";
import { ESTADOS_COMPRA } from "../schemas/ventasSchema.js";
import { codificar, decodificar } from "./cursor.js";
import * as eventosService from "./eventosService.js";
import { esActiva, puedeMarcarUtilizada } from "./reglasVenta.js";
import { ahora } from "./reloj.js";

// Ventas del evento para el panel del organizador (specs/005-panel-evento/research.md R1–R6).

export const TAMANO_PAGINA_VENTAS = 20;

const esClaveDeVenta = (clave) =>
  Array.isArray(clave) && clave.length === 2 && clave.every((parte) => typeof parte === "string");

/**
 * Resumen del evento completo (research R2; FR-006, FR-008). Recaudado = Σ vendidas × precio por tipo,
 * como define pantallas.md; un precio null (Borrador incompleto) aporta 0.
 */
export function resumen(evento) {
  const compras = comprasRepository.todasDelEvento(evento.id);
  const porEstado = Object.fromEntries([["Todas", compras.length], ...ESTADOS_COMPRA.map((estado) => [estado, 0])]);
  for (const compra of compras) porEstado[compra.estado] += 1;

  return {
    recaudado: evento.tiposDeEntrada.reduce((total, tipo) => total + tipo.vendidas * (tipo.precio ?? 0), 0),
    entradasVendidas: evento.vendidasTotal,
    comprasActivas: compras.filter(esActiva).length,
    porEstado,
  };
}

/**
 * Resumen + hasta 20 compras del evento propio, de la más reciente a la más antigua, solo del `estado`
 * si se indica y después del `cursor` si viene (research R3). Un evento ajeno o inexistente lanza
 * EventoNoEncontrado antes de leer compras (research R6). Devuelve { evento, resumen, compras, siguiente }.
 */
export function pagina(organizadorId, eventoId, { estado = null, cursor = null } = {}) {
  const evento = eventosService.obtener(organizadorId, eventoId);

  let despuesDe = null;
  if (cursor) {
    despuesDe = decodificar(cursor, esClaveDeVenta);
    if (!despuesDe) throw new DatosInvalidos([{ campo: "cursor", mensaje: "El cursor no es válido" }]);
  }

  // Se pide una de más para saber si hay página siguiente sin contar todo.
  const compras = comprasRepository.listarPorEvento(evento.id, { estado, despuesDe, limite: TAMANO_PAGINA_VENTAS + 1 });
  const estaPagina = compras.slice(0, TAMANO_PAGINA_VENTAS);
  const ultima = estaPagina.at(-1);

  return {
    evento,
    resumen: resumen(evento),
    compras: estaPagina,
    siguiente: compras.length > TAMANO_PAGINA_VENTAS ? codificar([ultima.creadaEn, ultima.numero]) : null,
  };
}

/**
 * Marcar utilizada: Confirmada → Utilizada (data-model.md § Compra · Transición nueva; FR-012 a FR-014).
 * Orden de verificación: evento propio → compra de ese evento → Confirmada → ya es el día del evento.
 * Sincrónica, sin await entre verificar y escribir (research R5). Devuelve { evento, compra, resumen }.
 */
export function marcarUtilizada(organizadorId, eventoId, numero) {
  const evento = eventosService.obtener(organizadorId, eventoId);
  const compra = comprasRepository.buscarPorNumero(numero);
  if (!compra || compra.eventoId !== evento.id) throw new CompraNoEncontrada();
  if (compra.estado !== "Confirmada") throw new CompraNoConfirmada();
  if (!puedeMarcarUtilizada(compra, evento, ahora())) throw new EventoNoComenzo();

  compra.estado = "Utilizada";
  return { evento, compra, resumen: resumen(evento) };
}
