import { Router } from "express";
import { eventosOrganizadorController as controller } from "../controllers/eventosOrganizadorController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { validar } from "../middlewares/validar.js";
import { validarQuery } from "../middlewares/validarQuery.js";
import { eventoSchema } from "../schemas/eventoSchema.js";
import { ventasSchema } from "../schemas/ventasSchema.js";
import { ventasController } from "../controllers/ventasController.js";
import { consultasController } from "../controllers/consultasController.js";
import { consultaQuerySchema, mensajeSchema } from "../schemas/mensajeSchema.js";

/** Eventos del organizador con sesión. Se monta en /organizadores/eventos. */
export function crearRouterEventosOrganizador() {
  const router = Router();
  router.use(requiereSesion("organizador"));

  router.get("/", controller.listar);
  router.post("/", validar(eventoSchema), controller.crear);
  router.get("/:id", controller.obtener);
  router.put("/:id", validar(eventoSchema), controller.editar);
  // Panel del evento (feature 005): ventas y marcar utilizada.
  router.get("/:id/ventas", validarQuery(ventasSchema), ventasController.listar);
  router.post("/:id/ventas/:numero/utilizacion", ventasController.marcarUtilizada);
  // Consultas del evento (feature 007).
  router.get("/:id/consultas", consultasController.consultasDelEvento);
  router.get("/:id/consultas/:numero", validarQuery(consultaQuerySchema), consultasController.consultaDeCompra);
  router.post("/:id/consultas/:numero/mensajes", validar(mensajeSchema), consultasController.enviarComoOrganizador);
  router.put("/:id/consultas/:numero/lectura", consultasController.marcarLeidaOrganizador);

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

/**
 * @openapi
 * tags:
 *   - name: Ventas del evento
 *
 * components:
 *   schemas:
 *     EstadoCompra:
 *       type: string
 *       enum: [Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada]
 *     MedioDePago:
 *       type: string
 *       enum: [Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia]
 *     Venta:
 *       type: object
 *       required: [numero, comprador, tipoDeEntrada, cantidad, estado, medioDePago, monto, creadaEn, acciones]
 *       properties:
 *         numero: { type: string, example: A-1042 }
 *         comprador:
 *           type: object
 *           required: [nombre]
 *           properties:
 *             nombre: { type: string, description: "Nombre y apellido, o el email si falta el nombre", example: Sofía Gómez }
 *         tipoDeEntrada:
 *           type: object
 *           required: [id, nombre]
 *           properties:
 *             id: { type: string, example: tip-2 }
 *             nombre: { type: string, nullable: true, example: Platea }
 *         cantidad: { type: integer, minimum: 1, example: 2 }
 *         estado: { $ref: '#/components/schemas/EstadoCompra' }
 *         medioDePago: { $ref: '#/components/schemas/MedioDePago' }
 *         monto: { type: integer, description: En pesos, example: 36000 }
 *         creadaEn: { type: string, format: date-time }
 *         acciones:
 *           type: object
 *           required: [marcarUtilizada]
 *           properties:
 *             marcarUtilizada: { type: boolean, description: "Confirmada y ya es el día del evento (research R4)" }
 *     ResumenDeVentas:
 *       type: object
 *       required: [recaudado, entradasVendidas, comprasActivas, porEstado]
 *       properties:
 *         recaudado: { type: integer, description: "Σ vendidas × precio por tipo de entrada", example: 2536000 }
 *         entradasVendidas: { type: integer, example: 154 }
 *         comprasActivas: { type: integer, description: "Compras que no están Canceladas ni Reembolsadas", example: 60 }
 *         porEstado:
 *           type: object
 *           required: [Todas, Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada]
 *           properties:
 *             Todas: { type: integer, example: 62 }
 *             Pendiente de pago: { type: integer, example: 9 }
 *             Confirmada: { type: integer, example: 51 }
 *             Utilizada: { type: integer, example: 0 }
 *             Cancelada: { type: integer, example: 1 }
 *             Reembolsada: { type: integer, example: 1 }
 *     PaginaDeVentas:
 *       type: object
 *       required: [resumen, ventas, siguiente]
 *       properties:
 *         resumen: { $ref: '#/components/schemas/ResumenDeVentas' }
 *         ventas:
 *           type: array
 *           maxItems: 20
 *           items: { $ref: '#/components/schemas/Venta' }
 *         siguiente: { type: string, nullable: true, description: "Cursor de la página siguiente o null" }
 */

/**
 * @openapi
 * /organizadores/eventos/{id}/ventas:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *   get:
 *     tags: [Ventas del evento]
 *     summary: Resumen de ventas y una página de compras del evento (de a 20, la más reciente primero)
 *     description: >
 *       `resumen` es siempre del evento completo, sin importar el filtro ni la página (FR-006, FR-008).
 *       Paginación por cursor (research R3): la primera página va sin cursor y las siguientes con el
 *       `siguiente` de la respuesta anterior y el mismo `estado`. `siguiente` es null en la última página.
 *       Un evento de otro organizador responde igual que uno inexistente (R6).
 *     security: [{ bearer: [] }]
 *     parameters:
 *       - name: estado
 *         in: query
 *         description: Filtra por estado de compra. Ausente o vacío = Todas.
 *         schema: { $ref: '#/components/schemas/EstadoCompra' }
 *       - { name: cursor, in: query, schema: { type: string }, description: "Valor opaco de `siguiente`" }
 *     responses:
 *       200:
 *         description: Resumen y página de ventas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaginaDeVentas' }
 *       400:
 *         description: Estado inválido o cursor que no es válido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example:
 *               error:
 *                 codigo: DATOS_INVALIDOS
 *                 mensaje: Revisá los datos enviados.
 *                 campos: [{ campo: estado, mensaje: Elegí un estado válido }]
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 */

/**
 * @openapi
 * /organizadores/eventos/{id}/ventas/{numero}/utilizacion:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   post:
 *     tags: [Ventas del evento]
 *     summary: Marcar utilizada — Confirmada → Utilizada
 *     description: >
 *       Solo sobre compras Confirmadas del evento y desde las 00:00 (hora de Argentina, −03:00) del día del
 *       evento, sin límite posterior (FR-012 a FR-014, research R4). Sin cuerpo. Devuelve la fila actualizada y
 *       el resumen del evento para refrescar chips y Recaudado sin recargar la lista (SC-004).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Compra marcada como utilizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [venta, resumen]
 *               properties:
 *                 venta: { $ref: '#/components/schemas/Venta' }
 *                 resumen: { $ref: '#/components/schemas/ResumenDeVentas' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404:
 *         description: El evento no es del organizador o no existe, o la compra no existe o es de otro evento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               evento:
 *                 value: { error: { codigo: EVENTO_NO_ENCONTRADO, mensaje: "No encontramos el evento." } }
 *               compra:
 *                 value: { error: { codigo: COMPRA_NO_ENCONTRADA, mensaje: "No encontramos esta compra." } }
 *       409:
 *         description: La compra no está Confirmada, o todavía no es el día del evento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               noConfirmada:
 *                 value: { error: { codigo: COMPRA_NO_CONFIRMADA, mensaje: "La compra ya no está confirmada." } }
 *               antesDeTiempo:
 *                 value: { error: { codigo: EVENTO_NO_COMENZO, mensaje: "Todavía no es el día del evento." } }
 */

/**
 * @openapi
 * tags:
 *   - name: Consultas (organizador)
 *
 * components:
 *   schemas:
 *     ConsultaResumen:
 *       type: object
 *       required: [numero, comprador, tipoDeEntrada, cantidad, monto, estado, ultimoMensaje, noLeida]
 *       properties:
 *         numero: { type: string, example: A-1042 }
 *         comprador:
 *           type: object
 *           required: [nombre]
 *           properties: { nombre: { type: string, description: "Nombre y apellido, o el email si faltan" } }
 *         tipoDeEntrada:
 *           type: object
 *           required: [nombre]
 *           properties: { nombre: { type: string, nullable: true } }
 *         cantidad: { type: integer, minimum: 1 }
 *         monto: { type: integer, minimum: 0 }
 *         estado: { $ref: '#/components/schemas/EstadoCompra' }
 *         ultimoMensaje:
 *           allOf: [{ $ref: '#/components/schemas/Mensaje' }]
 *           nullable: true
 *         noLeida: { type: boolean, description: "Para el organizador (FR-015)" }
 *
 * /organizadores/eventos/{id}/consultas:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *   get:
 *     tags: [Consultas (organizador)]
 *     summary: Consultas del evento (solo compras con mensajes) y cantidad de no leídas
 *     description: >
 *       Ordenadas por el último mensaje, la más reciente primero (FR-010). `noLeidas` alimenta el contador de
 *       "Consultas del evento" (FR-009). Un evento ajeno responde igual que uno inexistente. No marca nada como leído.
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Consultas del evento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [consultas, noLeidas]
 *               properties:
 *                 consultas: { type: array, items: { $ref: '#/components/schemas/ConsultaResumen' } }
 *                 noLeidas: { type: integer, minimum: 0 }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *
 * /organizadores/eventos/{id}/consultas/{numero}:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   get:
 *     tags: [Consultas (organizador)]
 *     summary: Cabecera y mensajes de la consulta de una compra del evento
 *     description: >
 *       Funciona aunque la compra no tenga mensajes (se abre desde Ventas, FR-013). Con `despuesDe` trae solo los
 *       mensajes nuevos (sondeo); la cabecera viene siempre, así el sondeo también actualiza el estado. No marca como leída.
 *     security: [{ bearer: [] }]
 *     parameters:
 *       - { name: despuesDe, in: query, schema: { type: string }, example: msj-2 }
 *     responses:
 *       200:
 *         description: Consulta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [consulta, mensajes]
 *               properties:
 *                 consulta: { $ref: '#/components/schemas/ConsultaResumen' }
 *                 mensajes: { type: array, items: { $ref: '#/components/schemas/Mensaje' } }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404:
 *         description: Evento ajeno o inexistente (EVENTO_NO_ENCONTRADO), o compra que no es de ese evento (COMPRA_NO_ENCONTRADA)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 * /organizadores/eventos/{id}/consultas/{numero}/mensajes:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   post:
 *     tags: [Consultas (organizador)]
 *     summary: Responder (o escribir primero) en la consulta de una compra del evento
 *     description: El autor es siempre "organizador". Con la compra y el evento en cualquier estado (FR-004).
 *     security: [{ bearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NuevoMensaje' }
 *           example: { texto: "Sí, hay lugar para dejarlo en el hall." }
 *     responses:
 *       201:
 *         description: Mensaje creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaMensaje' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404:
 *         description: Evento ajeno o inexistente, o compra que no es de ese evento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *
 * /organizadores/eventos/{id}/consultas/{numero}/lectura:
 *   parameters:
 *     - { name: id, in: path, required: true, schema: { type: string }, example: evt-1 }
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   put:
 *     tags: [Consultas (organizador)]
 *     summary: Marcar la consulta como leída por el organizador (idempotente)
 *     description: Al abrirla desde la lista o desde Ventas, y cuando el sondeo trae mensajes nuevos con la consulta abierta (FR-016).
 *     security: [{ bearer: [] }]
 *     responses:
 *       204: { description: Marcada como leída }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404:
 *         description: Evento ajeno o inexistente, o compra que no es de ese evento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
