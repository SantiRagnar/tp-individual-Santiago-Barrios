import { DatosInvalidos, OrganizadorNoEncontrado } from "../errors/ErrorDeDominio.js";
import * as compradoresRepository from "../repository/compradoresRepository.js";
import * as comprasRepository from "../repository/comprasRepository.js";
import * as eventosRepository from "../repository/eventosRepository.js";
import * as organizadoresRepository from "../repository/organizadoresRepository.js";
import { codificar, decodificar } from "./cursor.js";

// Reseñas del organizador = compras calificadas de todos sus eventos (research R7–R9, FR-013, FR-024).

export const TAMANO_PAGINA_RESENAS = 5;

const esClaveDeResena = (clave) =>
  Array.isArray(clave) && clave.length === 2 && clave.every((parte) => typeof parte === "string");

/** { suma, cantidad } de los puntajes del organizador (sin recorrer compras, research R8). */
export function resumen(organizadorId) {
  return comprasRepository.resumenDeCalificaciones(organizadorId);
}

/**
 * Hasta 5 reseñas, de la más reciente a la más antigua, después del cursor (o desde el principio).
 * Cada reseña es { compra, comprador, evento }; el DTO lo arma el controller.
 */
export function pagina(organizadorId, cursor) {
  if (!organizadoresRepository.buscarPorId(organizadorId)) throw new OrganizadorNoEncontrado();

  let despuesDe = null;
  if (cursor) {
    despuesDe = decodificar(cursor, esClaveDeResena);
    if (!despuesDe) throw new DatosInvalidos([{ campo: "cursor", mensaje: "El cursor no es válido" }]);
  }

  // Se pide una de más para saber si hay página siguiente sin contar todo.
  const compras = comprasRepository.listarCalificadas(organizadorId, { despuesDe, limite: TAMANO_PAGINA_RESENAS + 1 });
  const estaPagina = compras.slice(0, TAMANO_PAGINA_RESENAS);
  const ultima = estaPagina.at(-1);

  return {
    resenas: estaPagina.map((compra) => ({
      compra,
      comprador: compradoresRepository.buscarPorId(compra.compradorId),
      evento: eventosRepository.buscarPorId(compra.eventoId),
    })),
    total: resumen(organizadorId).cantidad,
    siguiente: compras.length > TAMANO_PAGINA_RESENAS ? codificar([ultima.calificacion.calificadaEn, ultima.numero]) : null,
  };
}
