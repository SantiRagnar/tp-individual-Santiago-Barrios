import * as comprasRepository from "../../repository/comprasRepository.js";
import * as eventosRepository from "../../repository/eventosRepository.js";

/**
 * Guarda `n` eventos Publicados con fecha futura (respecto de HOY = 2026-11-09), uno por día desde
 * `desde`. Sirven para probar la paginación de Explorar (research R4). Devuelve los eventos creados.
 */
export function crearEventosVisibles(n, { organizadorId = "org-1", desde = "2027-01-01", categoria = "Teatro", precio = 10000 } = {}) {
  const inicio = new Date(`${desde}T21:00:00-03:00`).getTime();
  return Array.from({ length: n }, () => {
    const id = eventosRepository.siguienteIdEvento();
    const fecha = new Date(inicio + eventosRepository.listarPorOrganizador(organizadorId).length * 86_400_000);
    return eventosRepository.guardar({
      id,
      organizadorId,
      nombre: `Evento de prueba ${id}`,
      descripcion: null,
      categoria,
      fechaHora: fecha.toISOString(),
      ubicacion: "Sala de prueba",
      imagenId: null,
      tiposDeEntrada: [{ id: eventosRepository.siguienteIdTipo(), nombre: "General", cupo: 100, precio, vendidas: 0 }],
      estado: "Publicado",
      creadoEn: "2026-11-01T10:00:00-03:00",
    });
  });
}

/**
 * Guarda `n` compras Utilizadas y calificadas del evento, con `calificadaEn` crecientes (una por hora
 * desde `desde`), para probar la paginación de reseñas (research R9). data-model.md § Compra.
 */
let ultimaCompra = 0;

export function crearComprasCalificadas(organizadorId, eventoId, n, { desde = "2026-10-01T10:00:00-03:00", compradorId = "cmp-2", puntaje = 5 } = {}) {
  const inicio = new Date(desde).getTime();
  const tipo = eventosRepository.buscarPorId(eventoId).tiposDeEntrada[0];
  return Array.from({ length: n }, (_, i) =>
    comprasRepository.guardar(
      {
        numero: `B-${String(++ultimaCompra).padStart(4, "0")}`,
        compradorId,
        eventoId,
        tipoDeEntradaId: tipo.id,
        // Copia del tipo (feature 004, data-model.md Compra.tipoDeEntradaNombre, Compra.precioUnitario).
        tipoDeEntradaNombre: tipo.nombre,
        precioUnitario: tipo.precio,
        cantidad: 1,
        monto: tipo.precio,
        medioDePago: "Mercado Pago",
        estado: "Utilizada",
        creadaEn: desde,
        calificacion: { puntaje, comentario: `Reseña ${i + 1}`, calificadaEn: new Date(inicio + i * 3_600_000).toISOString() },
      },
      { organizadorId },
    ),
  );
}
