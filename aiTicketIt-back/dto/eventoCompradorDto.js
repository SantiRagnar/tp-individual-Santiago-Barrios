// Vistas del lado compradores (specs/003-explorar-detalle-evento/contracts/compradores.openapi.yaml,
// research R18). Valores derivados según data-model.md § Valores derivados. A propósito no se exponen
// vendidas, cupos, estado guardado ni material multimedia: son datos del organizador.

const urlDeImagen = (imagenId) => (imagenId ? `/imagenes/${imagenId}` : null);

const precios = (evento) => evento.tiposDeEntrada.map((t) => t.precio ?? 0);
const disponibles = (tipo) => (tipo.cupo ?? 0) - tipo.vendidas;

/** Promedio con un decimal; null sin reseñas. El orden por puntaje usa el valor sin redondear. */
export function puntajeDe({ suma, cantidad }) {
  return cantidad === 0 ? null : Math.round((suma / cantidad) * 10) / 10;
}

/**
 * @param contexto { organizador, resumen: { suma, cantidad }, esFavorito }
 */
export function aEventoCompradorResumenDto(evento, { organizador, resumen, esFavorito }) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    categoria: evento.categoria,
    fechaHora: evento.fechaHora,
    ubicacion: evento.ubicacion,
    imagenUrl: urlDeImagen(evento.imagenId),
    precioDesde: Math.min(...precios(evento)),
    agotado: evento.tiposDeEntrada.every((t) => disponibles(t) <= 0),
    organizador: {
      id: organizador.id,
      nombre: organizador.nombre,
      puntaje: puntajeDe(resumen),
      cantidadResenas: resumen.cantidad,
    },
    esFavorito,
  };
}

/** `paginaDeResenas` = { resenas: Resena[], siguiente } ya armada (primera página, research R9). */
export function aEventoCompradorDetalleDto(evento, contexto, paginaDeResenas) {
  return {
    ...aEventoCompradorResumenDto(evento, contexto),
    descripcion: evento.descripcion,
    precioHasta: Math.max(...precios(evento)),
    tiposDeEntrada: evento.tiposDeEntrada.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      precio: t.precio,
      disponibles: Math.max(0, disponibles(t)),
    })),
    resenas: { resenas: paginaDeResenas.resenas, siguiente: paginaDeResenas.siguiente },
  };
}

/** Autor como "Nombre I." (FR-013): nunca el email ni el apellido completo. */
export function aResenaDto(compra, comprador, evento) {
  const inicial = comprador.apellido ? ` ${comprador.apellido.charAt(0).toUpperCase()}.` : "";
  return {
    numeroCompra: compra.numero,
    autor: `${comprador.nombre}${inicial}`,
    puntaje: compra.calificacion.puntaje,
    comentario: compra.calificacion.comentario,
    evento: { id: evento.id, nombre: evento.nombre },
    calificadaEn: compra.calificacion.calificadaEn,
  };
}
