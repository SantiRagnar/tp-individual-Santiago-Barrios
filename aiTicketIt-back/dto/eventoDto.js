import { ahora } from "../services/reloj.js";

// Solo los campos del contrato (contracts/eventos.openapi.yaml EventoResumen / Evento).
// Valores derivados según data-model.md § "Valores derivados".

const urlDeImagen = (imagenId) => (imagenId ? `/imagenes/${imagenId}` : null);

export function aEventoResumenDto(evento) {
  return {
    id: evento.id,
    nombre: evento.nombre,
    fechaHora: evento.fechaHora,
    ubicacion: evento.ubicacion,
    categoria: evento.categoria,
    estado: evento.estadoVisible(ahora()),
    imagenUrl: urlDeImagen(evento.imagenId),
    vendidas: evento.vendidasTotal,
    cupo: evento.cupoTotal,
  };
}

export function aEventoDto(evento) {
  return {
    ...aEventoResumenDto(evento),
    descripcion: evento.descripcion,
    imagenId: evento.imagenId,
    materialMultimedia: evento.materialMultimedia.map(({ nombre, tipo }) => ({ nombre, tipo })),
    tiposDeEntrada: evento.tiposDeEntrada.map(({ id, nombre, cupo, precio, vendidas }) => ({
      id,
      nombre,
      cupo,
      precio,
      vendidas,
      disponibles: cupo === null ? null : cupo - vendidas,
    })),
  };
}
