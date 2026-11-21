import * as eventosRepository from "../repository/eventosRepository.js";
import {
  DatosInvalidos,
  EventoFinalizado,
  EventoNoEncontrado,
  NoSePuedeDespublicar,
} from "../errors/ErrorDeDominio.js";
import * as imagenesService from "./imagenesService.js";
import { validarCambiosConVentas, validarParaPublicar } from "./reglasEvento.js";
import { ahora } from "./reloj.js";

const instante = (iso) => new Date(iso).getTime();

/**
 * Orden de Mis eventos (research R15): primero los no Finalizados con fecha (el más próximo primero),
 * después los no Finalizados sin fecha (por creación) y al final los Finalizados (el más reciente primero).
 */
function compararParaMisEventos(momento) {
  const grupo = (e) => (e.estadoVisible(momento) === "Finalizado" ? 2 : e.fechaHora ? 0 : 1);
  return (a, b) => {
    const diferencia = grupo(a) - grupo(b);
    if (diferencia !== 0) return diferencia;
    switch (grupo(a)) {
      case 0:
        return instante(a.fechaHora) - instante(b.fechaHora);
      case 1:
        return instante(a.creadoEn) - instante(b.creadoEn);
      default:
        return instante(b.fechaHora) - instante(a.fechaHora);
    }
  };
}

/** Todos los eventos del organizador, en cualquier estado (FR-003, FR-006). */
export function listar(organizadorId) {
  return eventosRepository.listarPorOrganizador(organizadorId).sort(compararParaMisEventos(ahora()));
}

/** Un evento propio. Uno ajeno responde igual que uno inexistente (research R16, FR-022). */
export function obtener(organizadorId, id) {
  const evento = eventosRepository.buscarPorId(id);
  if (!evento || evento.organizadorId !== organizadorId) throw new EventoNoEncontrado();
  return evento;
}

/** Datos editables del evento, tal como llegan ya normalizados por eventoSchema. */
function datosEditables(entrada) {
  const { nombre, descripcion, categoria, fechaHora, ubicacion, imagenId, materialMultimedia, estado } = entrada;
  return { nombre, descripcion, categoria, fechaHora, ubicacion, imagenId, materialMultimedia, estado };
}

/**
 * Valida la imagen: tiene que ser una que subió el organizador, o la que el evento ya tenía
 * (así un evento del seed conserva su imagen al editarlo). research R7.
 */
function erroresDeImagen(organizadorId, imagenId, imagenActual = null) {
  if (!imagenId || imagenId === imagenActual || imagenesService.esDelOrganizador(organizadorId, imagenId)) return [];
  return [{ campo: "imagenId", mensaje: "Elegí una imagen que hayas subido" }];
}

/**
 * Crea un evento del organizador (FR-010). Como Publicado aplica las reglas para publicar
 * (FR-011, FR-012); como Borrador no exige nada (FR-014). Los tipos nacen con 0 vendidas (FR-016)
 * y se ignoran los id y vendidas que mande el cliente.
 */
export function crear(organizadorId, entrada) {
  const errores = [
    ...erroresDeImagen(organizadorId, entrada.imagenId),
    ...(entrada.estado === "Publicado" ? validarParaPublicar(entrada, ahora()) : []),
  ];
  if (errores.length > 0) throw new DatosInvalidos(errores);

  return eventosRepository.guardar({
    ...datosEditables(entrada),
    id: eventosRepository.siguienteIdEvento(),
    organizadorId,
    tiposDeEntrada: entrada.tiposDeEntrada.map(({ nombre, cupo, precio }) => ({
      id: eventosRepository.siguienteIdTipo(),
      nombre,
      cupo,
      precio,
      vendidas: 0,
    })),
    creadoEn: ahora().toISOString(),
  });
}

/** Un error por campo: si dos reglas marcan el mismo campo, queda el primero. */
function unoPorCampo(errores) {
  const vistos = new Set();
  return errores.filter(({ campo }) => !vistos.has(campo) && vistos.add(campo));
}

/**
 * Edita un evento propio con un reemplazo completo (research R6; FR-019, FR-020).
 * - Un Finalizado no se edita y un Publicado no vuelve a Borrador (409).
 * - Como Publicado aplica las reglas para publicar, junto con las de ventas, en un solo error.
 * - Conserva id, organizador, creación y las vendidas de cada tipo por su id; los tipos nuevos reciben tip-N.
 */
export function editar(organizadorId, id, entrada) {
  const guardado = obtener(organizadorId, id);
  const momento = ahora();

  if (guardado.estadoVisible(momento) === "Finalizado") throw new EventoFinalizado();
  if (guardado.estado === "Publicado" && entrada.estado === "Borrador") throw new NoSePuedeDespublicar();

  const errores = unoPorCampo([
    ...erroresDeImagen(organizadorId, entrada.imagenId, guardado.imagenId),
    ...(entrada.estado === "Publicado" ? validarParaPublicar(entrada, momento) : []),
    ...validarCambiosConVentas(guardado, entrada),
  ]);
  if (errores.length > 0) throw new DatosInvalidos(errores);

  const vendidasPorId = new Map(guardado.tiposDeEntrada.map((t) => [t.id, t.vendidas]));
  return eventosRepository.guardar({
    ...datosEditables(entrada),
    id: guardado.id,
    organizadorId: guardado.organizadorId,
    creadoEn: guardado.creadoEn,
    tiposDeEntrada: entrada.tiposDeEntrada.map(({ id: idTipo, nombre, cupo, precio }) => {
      const existe = idTipo !== undefined && vendidasPorId.has(idTipo);
      return {
        id: existe ? idTipo : eventosRepository.siguienteIdTipo(),
        nombre,
        cupo,
        precio,
        vendidas: existe ? vendidasPorId.get(idTipo) : 0,
      };
    }),
  });
}
