import { DatosInvalidos, EventoNoEncontrado } from "../errors/ErrorDeDominio.js";
import * as comprasRepository from "../repository/comprasRepository.js";
import * as eventosRepository from "../repository/eventosRepository.js";
import * as favoritosRepository from "../repository/favoritosRepository.js";
import * as organizadoresRepository from "../repository/organizadoresRepository.js";
import { codificar, decodificar } from "./cursor.js";
import * as resenasService from "./resenasService.js";
import { ahora } from "./reloj.js";
import { esVisibleParaCompradores } from "./visibilidadEvento.js";

// Lado compradores: Explorar y Detalle (specs/003-explorar-detalle-evento, research R2–R6).
// Devuelve eventos con su contexto ({ organizador, resumen, esFavorito }); el DTO lo arma el controller.

export const TAMANO_PAGINA_EVENTOS = 10;

const instante = (iso) => new Date(iso).getTime();

/** Contexto que necesita el DTO de comprador para un evento. */
export function contextoDe(compradorId, evento) {
  return {
    organizador: organizadoresRepository.buscarPorId(evento.organizadorId),
    resumen: comprasRepository.resumenDeCalificaciones(evento.organizadorId),
    esFavorito: favoritosRepository.esFavorito(compradorId, evento.id),
  };
}

/** Eventos visibles para compradores en este momento (FR-001). */
export function visibles(momento = ahora()) {
  return eventosRepository.listarTodos().filter((evento) => esVisibleParaCompradores(evento, momento));
}

/** Minúsculas, sin tildes ni espacios alrededor (research R6). */
export function normalizar(texto) {
  return (texto ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

const precioDesde = (evento) => Math.min(...evento.tiposDeEntrada.map((t) => t.precio ?? 0));

const promedio = (organizadorId) => {
  const { suma, cantidad } = comprasRepository.resumenDeCalificaciones(organizadorId);
  return cantidad === 0 ? null : suma / cantidad;
};

/**
 * Clave completa y estable de cada evento para el orden pedido (research R4, R5):
 * [valor del orden, instante de la fecha, id]. El id hace que dos eventos nunca empaten.
 */
const VALOR_DEL_ORDEN = {
  fecha: () => 0,
  precio: (evento) => precioDesde(evento),
  // Mayor puntaje primero: se ordena por el negativo. Sin reseñas → null, al final.
  puntaje: (evento) => {
    const valor = promedio(evento.organizadorId);
    return valor === null ? null : -valor;
  },
};

const claveDe = (evento, orden) => [VALOR_DEL_ORDEN[orden](evento), instante(evento.fechaHora), evento.id];

function compararClaves([valorA, fechaA, idA], [valorB, fechaB, idB]) {
  if (valorA !== valorB) {
    if (valorA === null) return 1;
    if (valorB === null) return -1;
    return valorA - valorB;
  }
  if (fechaA !== fechaB) return fechaA - fechaB;
  return idA < idB ? -1 : idA > idB ? 1 : 0;
}

/** Un cursor solo sirve para el orden con el que se generó. */
const esClaveDe = (orden) => (cursor) =>
  cursor !== null &&
  typeof cursor === "object" &&
  cursor.o === orden &&
  Array.isArray(cursor.k) &&
  cursor.k.length === 3 &&
  (cursor.k[0] === null || typeof cursor.k[0] === "number") &&
  typeof cursor.k[1] === "number" &&
  typeof cursor.k[2] === "string";

const CURSOR_INVALIDO = new DatosInvalidos([{ campo: "cursor", mensaje: "El cursor no es válido" }]);

/**
 * Explorar (FR-004 a FR-007, FR-025): filtra por búsqueda y categoría, ordena con clave completa y
 * devuelve los 10 que siguen al cursor, con el total del filtro y el cursor de la página siguiente.
 */
export function listar(compradorId, { busqueda = null, categoria = null, orden = "fecha", cursor = null } = {}) {
  let despuesDe = null;
  if (cursor) {
    const decodificado = decodificar(cursor, esClaveDe(orden));
    if (!decodificado) throw CURSOR_INVALIDO;
    despuesDe = decodificado.k;
  }

  const texto = normalizar(busqueda);
  const filtrados = visibles().filter((evento) => {
    if (categoria && evento.categoria !== categoria) return false;
    if (!texto) return true;
    const organizador = organizadoresRepository.buscarPorId(evento.organizadorId);
    return [evento.nombre, evento.ubicacion, organizador?.nombre].some((campo) => normalizar(campo).includes(texto));
  });

  const ordenados = filtrados.map((evento) => ({ evento, clave: claveDe(evento, orden) })).sort((a, b) => compararClaves(a.clave, b.clave));
  const desde = despuesDe ? ordenados.filter(({ clave }) => compararClaves(clave, despuesDe) > 0) : ordenados;
  const pagina = desde.slice(0, TAMANO_PAGINA_EVENTOS);
  const hayMas = desde.length > TAMANO_PAGINA_EVENTOS;

  return {
    eventos: pagina.map(({ evento }) => ({ evento, contexto: contextoDe(compradorId, evento) })),
    total: filtrados.length,
    siguiente: hayMas ? codificar({ o: orden, k: pagina.at(-1).clave }) : null,
  };
}

/**
 * Detalle (FR-012 a FR-016): un evento visible con su contexto y la primera página de reseñas del
 * organizador. Uno inexistente, Borrador o Finalizado responde igual: EventoNoEncontrado (research R3).
 */
export function obtener(compradorId, id) {
  const evento = eventosRepository.buscarPorId(id);
  if (!evento || !esVisibleParaCompradores(evento, ahora())) throw new EventoNoEncontrado();
  return {
    evento,
    contexto: contextoDe(compradorId, evento),
    resenas: resenasService.pagina(evento.organizadorId, null),
  };
}
