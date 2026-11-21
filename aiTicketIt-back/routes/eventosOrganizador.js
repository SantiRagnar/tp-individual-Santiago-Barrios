import { Router } from "express";
import { eventosOrganizadorController as controller } from "../controllers/eventosOrganizadorController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { validar } from "../middlewares/validar.js";
import { eventoSchema } from "../schemas/eventoSchema.js";

/** Eventos del organizador con sesión. Se monta en /organizadores/eventos. */
export function crearRouterEventosOrganizador() {
  const router = Router();
  router.use(requiereSesion("organizador"));

  router.get("/", controller.listar);
  router.post("/", validar(eventoSchema), controller.crear);
  router.get("/:id", controller.obtener);
  router.put("/:id", validar(eventoSchema), controller.editar);

  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Eventos del organizador
 *
 * components:
 *   schemas:
 *     Categoria:
 *       type: string
 *       enum: [Teatro, Comedia, Drama, Amor]
 *     EstadoEvento:
 *       type: string
 *       enum: [Publicado, Borrador, Finalizado]
 *       description: Estado visible. Finalizado se deriva de un Publicado cuya fecha ya pasó (research R1).
 *     MaterialMultimedia:
 *       type: object
 *       required: [nombre, tipo]
 *       properties:
 *         nombre: { type: string, maxLength: 200, example: trailer.mp4 }
 *         tipo: { type: string, enum: [foto, video] }
 *     TipoDeEntradaEntrada:
 *       type: object
 *       properties:
 *         id: { type: string, description: "Solo para tipos existentes al editar", example: tip-2 }
 *         nombre: { type: string, nullable: true, maxLength: 60, example: Platea }
 *         cupo: { type: integer, nullable: true, example: 80 }
 *         precio: { type: integer, nullable: true, description: "En pesos; 0 = gratuita", example: 18000 }
 *     TipoDeEntrada:
 *       type: object
 *       required: [id, nombre, cupo, precio, vendidas, disponibles]
 *       properties:
 *         id: { type: string, example: tip-2 }
 *         nombre: { type: string, nullable: true, example: Platea }
 *         cupo: { type: integer, nullable: true, example: 80 }
 *         precio: { type: integer, nullable: true, example: 18000 }
 *         vendidas: { type: integer, example: 68 }
 *         disponibles: { type: integer, nullable: true, example: 12 }
 *     EventoEntrada:
 *       type: object
 *       required: [estado]
 *       description: Solo se valida la forma; las reglas para publicar están en el servicio (research R4).
 *       properties:
 *         nombre: { type: string, nullable: true, maxLength: 120 }
 *         descripcion: { type: string, nullable: true, maxLength: 2000 }
 *         categoria: { allOf: [{ $ref: '#/components/schemas/Categoria' }], nullable: true }
 *         fechaHora: { type: string, format: date-time, nullable: true, example: "2026-11-21T21:00:00-03:00" }
 *         ubicacion: { type: string, nullable: true, maxLength: 200 }
 *         imagenId: { type: string, nullable: true }
 *         materialMultimedia:
 *           type: array
 *           items: { $ref: '#/components/schemas/MaterialMultimedia' }
 *         tiposDeEntrada:
 *           type: array
 *           items: { $ref: '#/components/schemas/TipoDeEntradaEntrada' }
 *         estado: { type: string, enum: [Borrador, Publicado] }
 *     EventoResumen:
 *       type: object
 *       required: [id, nombre, fechaHora, ubicacion, categoria, estado, imagenUrl, vendidas, cupo]
 *       properties:
 *         id: { type: string, example: evt-1 }
 *         nombre: { type: string, nullable: true, example: Hamlet en el Galpón }
 *         fechaHora: { type: string, format: date-time, nullable: true }
 *         ubicacion: { type: string, nullable: true, example: "Galpón de Guevara, Chacarita" }
 *         categoria: { allOf: [{ $ref: '#/components/schemas/Categoria' }], nullable: true }
 *         estado: { $ref: '#/components/schemas/EstadoEvento' }
 *         imagenUrl: { type: string, nullable: true, example: /imagenes/img-seed-hamlet }
 *         vendidas: { type: integer, example: 154 }
 *         cupo: { type: integer, example: 250 }
 *     Evento:
 *       allOf:
 *         - $ref: '#/components/schemas/EventoResumen'
 *         - type: object
 *           required: [descripcion, imagenId, materialMultimedia, tiposDeEntrada]
 *           properties:
 *             descripcion: { type: string, nullable: true }
 *             imagenId: { type: string, nullable: true }
 *             materialMultimedia:
 *               type: array
 *               items: { $ref: '#/components/schemas/MaterialMultimedia' }
 *             tiposDeEntrada:
 *               type: array
 *               items: { $ref: '#/components/schemas/TipoDeEntrada' }
 *   responses:
 *     EventoNoEncontrado:
 *       description: No existe o es de otro organizador (no se distingue, research R16)
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example: { error: { codigo: EVENTO_NO_ENCONTRADO, mensaje: "No encontramos el evento." } }
 *     ReglasDeEvento:
 *       description: >
 *         Forma inválida, o el evento no cumple las reglas para publicar o de ventas. Un error por campo;
 *         los campos de tipos usan la ruta con puntos (research R5).
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example:
 *             error:
 *               codigo: DATOS_INVALIDOS
 *               mensaje: Revisá los datos enviados.
 *               campos:
 *                 - { campo: nombre, mensaje: Poné un nombre al evento }
 *                 - { campo: fechaHora, mensaje: La fecha tiene que ser futura }
 *                 - { campo: tiposDeEntrada.1.nombre, mensaje: Ya hay una entrada con este nombre }
 *                 - { campo: tiposDeEntrada.0.cupo, mensaje: "El cupo no puede ser menor a las vendidas (30)" }
 */

/**
 * @openapi
 * /organizadores/eventos:
 *   get:
 *     tags: [Eventos del organizador]
 *     summary: Mis eventos — todos los eventos del organizador con sesión, en cualquier estado
 *     description: Orden según research R15. Nunca incluye eventos de otro organizador (FR-003, FR-022).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Lista de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [eventos]
 *               properties:
 *                 eventos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventoResumen' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *   post:
 *     tags: [Eventos del organizador]
 *     summary: Crear evento (publicar o guardar borrador)
 *     description: >
 *       Con estado "Borrador" no se exigen reglas de publicación (FR-014). Con estado "Publicado" se aplican
 *       FR-011 y FR-012 y el evento queda con 0 vendidas en cada tipo (FR-016).
 *     security: [{ bearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventoEntrada' }
 *           example:
 *             nombre: Las brujas de Salem
 *             descripcion: Clásico de Arthur Miller en versión de cámara.
 *             categoria: Drama
 *             fechaHora: "2026-12-19T21:00:00-03:00"
 *             ubicacion: Galpón de Guevara, Chacarita
 *             imagenId: 3f1c2a9e-8d4b-4f0e-9a51-2c7d1e6b9f10
 *             materialMultimedia: [{ nombre: trailer.mp4, tipo: video }]
 *             tiposDeEntrada:
 *               - { nombre: General, cupo: 120, precio: 13000 }
 *               - { nombre: Platea, cupo: 60, precio: 19000 }
 *             estado: Publicado
 *     responses:
 *       201:
 *         description: Evento creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [evento]
 *               properties:
 *                 evento: { $ref: '#/components/schemas/Evento' }
 *       400: { $ref: '#/components/responses/ReglasDeEvento' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */

/**
 * @openapi
 * /organizadores/eventos/{id}:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *   get:
 *     tags: [Eventos del organizador]
 *     summary: Un evento propio, completo (para el Detalle mínimo y para Editar evento)
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
 *                 evento: { $ref: '#/components/schemas/Evento' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *   put:
 *     tags: [Eventos del organizador]
 *     summary: Editar evento (reemplazo completo)
 *     description: >
 *       Los tipos existentes viajan con su id; los nuevos sin id. Se conservan las vendidas por id.
 *       Un tipo con ventas no se puede quitar ni quedar con cupo menor a sus vendidas (FR-020).
 *       Un Publicado no puede volver a Borrador. Un Finalizado no se puede editar (FR-019). Research R6.
 *     security: [{ bearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EventoEntrada' }
 *     responses:
 *       200:
 *         description: Evento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [evento]
 *               properties:
 *                 evento: { $ref: '#/components/schemas/Evento' }
 *       400: { $ref: '#/components/responses/ReglasDeEvento' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *       409:
 *         description: El evento está Finalizado, o se intentó volver un Publicado a Borrador
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               finalizado:
 *                 value: { error: { codigo: EVENTO_FINALIZADO, mensaje: "El evento ya se realizó: no se puede editar." } }
 *               despublicar:
 *                 value: { error: { codigo: NO_SE_PUEDE_DESPUBLICAR, mensaje: "Un evento publicado no puede volver a borrador." } }
 */
