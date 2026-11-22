import { Router } from "express";
import { eventosCompradorController as controller } from "../controllers/eventosCompradorController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { validarQuery } from "../middlewares/validarQuery.js";
import { explorarSchema, resenasSchema } from "../schemas/explorarSchema.js";

/**
 * Eventos visibles para el comprador con sesión (feature 003). Se monta en /compradores/eventos.
 * Contrato: specs/003-explorar-detalle-evento/contracts/compradores.openapi.yaml.
 */
export function crearRouterEventosComprador() {
  const router = Router();
  router.use(requiereSesion("comprador"));

  router.get("/", validarQuery(explorarSchema), controller.listar);
  router.get("/:id", controller.obtener);

  return router;
}

/** Reseñas de un organizador, para "Ver más" del Detalle (FR-024). Se monta en /compradores/organizadores. */
export function crearRouterOrganizadoresComprador() {
  const router = Router();
  router.use(requiereSesion("comprador"));

  router.get("/:id/resenas", validarQuery(resenasSchema), controller.resenas);

  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Eventos para compradores
 *
 * components:
 *   schemas:
 *     OrganizadorResumen:
 *       type: object
 *       required: [id, nombre, puntaje, cantidadResenas]
 *       properties:
 *         id: { type: string, example: org-1 }
 *         nombre: { type: string, example: Compañía La Trama }
 *         puntaje: { type: number, nullable: true, description: "Promedio con 1 decimal; null sin reseñas", example: 4.5 }
 *         cantidadResenas: { type: integer, example: 4 }
 *     EventoCompradorResumen:
 *       type: object
 *       required: [id, nombre, categoria, fechaHora, ubicacion, imagenUrl, precioDesde, agotado, organizador, esFavorito]
 *       properties:
 *         id: { type: string, example: evt-1 }
 *         nombre: { type: string, example: Hamlet en el Galpón }
 *         categoria: { allOf: [{ $ref: '#/components/schemas/Categoria' }], nullable: true }
 *         fechaHora: { type: string, format: date-time, example: "2026-11-21T21:00:00-03:00" }
 *         ubicacion: { type: string, example: "Galpón de Guevara, Chacarita" }
 *         imagenUrl: { type: string, nullable: true, example: /imagenes/img-seed-hamlet }
 *         precioDesde: { type: integer, description: "Menor precio entre todos los tipos, agotados incluidos", example: 12000 }
 *         agotado: { type: boolean, description: "Ningún tipo con lugares disponibles", example: false }
 *         organizador: { $ref: '#/components/schemas/OrganizadorResumen' }
 *         esFavorito: { type: boolean, example: false }
 *     PaginaDeEventos:
 *       type: object
 *       required: [eventos, total, siguiente]
 *       properties:
 *         eventos:
 *           type: array
 *           maxItems: 10
 *           items: { $ref: '#/components/schemas/EventoCompradorResumen' }
 *         total: { type: integer, description: "Resultados del filtro completo, no solo de esta página", example: 5 }
 *         siguiente: { type: string, nullable: true, description: "Cursor de la página siguiente; null si no hay más" }
 *     TipoDeEntradaComprador:
 *       type: object
 *       required: [id, nombre, precio, disponibles]
 *       properties:
 *         id: { type: string, example: tip-3 }
 *         nombre: { type: string, example: VIP }
 *         precio: { type: integer, example: 26000 }
 *         disponibles: { type: integer, example: 0 }
 *     Resena:
 *       type: object
 *       required: [numeroCompra, autor, puntaje, comentario, evento, calificadaEn]
 *       properties:
 *         numeroCompra: { type: string, example: A-0631 }
 *         autor: { type: string, description: "Nombre + inicial del apellido", example: Diego R. }
 *         puntaje: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *         comentario: { type: string, nullable: true, example: "Buena, aunque la sala hacía mucho frío." }
 *         evento:
 *           type: object
 *           required: [id, nombre]
 *           properties:
 *             id: { type: string, example: evt-7 }
 *             nombre: { type: string, example: Edipo Rey }
 *         calificadaEn: { type: string, format: date-time }
 *     EventoCompradorDetalle:
 *       allOf:
 *         - $ref: '#/components/schemas/EventoCompradorResumen'
 *         - type: object
 *           required: [descripcion, precioHasta, tiposDeEntrada, resenas]
 *           properties:
 *             descripcion: { type: string, nullable: true }
 *             precioHasta: { type: integer, example: 26000 }
 *             tiposDeEntrada:
 *               type: array
 *               items: { $ref: '#/components/schemas/TipoDeEntradaComprador' }
 *             resenas:
 *               type: object
 *               required: [resenas, siguiente]
 *               description: Primera página (hasta 5) de reseñas del organizador
 *               properties:
 *                 resenas:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Resena' }
 *                 siguiente: { type: string, nullable: true }
 *     PaginaDeResenas:
 *       type: object
 *       required: [resenas, total, siguiente]
 *       properties:
 *         resenas:
 *           type: array
 *           maxItems: 5
 *           items: { $ref: '#/components/schemas/Resena' }
 *         total: { type: integer, example: 4 }
 *         siguiente: { type: string, nullable: true }
 */

/**
 * @openapi
 * /compradores/eventos:
 *   get:
 *     tags: [Eventos para compradores]
 *     summary: Explorar — eventos visibles filtrados, ordenados y paginados de a 10
 *     description: >
 *       Nunca incluye Borradores ni Finalizados (FR-001, research R2). Filtra por búsqueda (nombre,
 *       ubicación u organizador, sin mayúsculas ni tildes, R6) y categoría; ordena por fecha, precio o
 *       puntaje con desempate por fecha e id (R5). Paginación por cursor (R4): la primera página sin
 *       cursor y las siguientes con el `siguiente` de la respuesta anterior. `total` cuenta todo el filtro.
 *     security: [{ bearer: [] }]
 *     parameters:
 *       - { name: busqueda, in: query, schema: { type: string, maxLength: 100 }, example: galpon }
 *       - { name: categoria, in: query, schema: { $ref: '#/components/schemas/Categoria' } }
 *       - { name: orden, in: query, schema: { type: string, enum: [fecha, precio, puntaje], default: fecha } }
 *       - { name: cursor, in: query, schema: { type: string }, description: "Valor opaco de `siguiente`" }
 *     responses:
 *       200:
 *         description: Una página de eventos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginaDeEventos' }
 *       400:
 *         description: Parámetro inválido (categoría, orden, búsqueda larga o cursor que no corresponde)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example:
 *               error:
 *                 codigo: DATOS_INVALIDOS
 *                 mensaje: Revisá los datos enviados.
 *                 campos: [{ campo: orden, mensaje: Elegí un orden válido }]
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */

/**
 * @openapi
 * /compradores/eventos/{id}:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *   get:
 *     tags: [Eventos para compradores]
 *     summary: Detalle de un evento visible, con la primera página de reseñas del organizador
 *     description: >
 *       Un evento inexistente, Borrador o Finalizado responde 404 sin distinguir el caso (research R3).
 *       Incluye las 5 reseñas más recientes del organizador; las siguientes se piden a
 *       /compradores/organizadores/{id}/resenas con `resenas.siguiente` (R9).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: El evento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [evento]
 *               properties:
 *                 evento: { $ref: '#/components/schemas/EventoCompradorDetalle' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *
 * /compradores/organizadores/{id}/resenas:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: org-1 }
 *     - { name: cursor, in: query, schema: { type: string }, description: "Valor opaco de `siguiente`" }
 *   get:
 *     tags: [Eventos para compradores]
 *     summary: Reseñas del organizador, de la más reciente a la más antigua, de a 5 (Ver más)
 *     description: >
 *       Las reseñas son compras calificadas de cualquier evento del organizador (research R7, R8).
 *       Un organizador sin reseñas devuelve una lista vacía y total 0.
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Una página de reseñas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginaDeResenas' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404:
 *         description: El organizador no existe
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: ORGANIZADOR_NO_ENCONTRADO, mensaje: "No encontramos el organizador." } }
 */
