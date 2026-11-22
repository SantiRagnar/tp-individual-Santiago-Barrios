import { Router } from "express";
import { comprasController as controller } from "../controllers/comprasController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { validar } from "../middlewares/validar.js";
import { compraSchema } from "../schemas/compraSchema.js";

/**
 * Compras del comprador con sesión (feature 004, research R1). Se monta en /compradores/compras.
 * El pago es simulado: ningún endpoint pide ni recibe datos de pago (FR-008).
 */
export function crearRouterCompras() {
  const router = Router();
  router.use(requiereSesion("comprador"));

  router.post("/", validar(compraSchema), controller.crear);
  router.get("/", controller.listar);
  router.get("/:numero", controller.obtener);
  router.post("/:numero/pago", controller.completarPago);
  router.post("/:numero/cancelacion", controller.cancelar);

  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Compras
 *
 * components:
 *   schemas:
 *     MedioDePago:
 *       type: string
 *       enum: [Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia]
 *     EstadoCompra:
 *       type: string
 *       enum: [Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada]
 *     Compra:
 *       type: object
 *       required: [numero, estado, cantidad, monto, medioDePago, creadaEn, tipoDeEntrada, evento, diasParaEvento, calificacion, acciones, motivoNoCancelable]
 *       properties:
 *         numero: { type: string, example: A-1042 }
 *         estado: { $ref: '#/components/schemas/EstadoCompra' }
 *         cantidad: { type: integer, minimum: 1, maximum: 10, example: 2 }
 *         monto: { type: integer, description: "precioUnitario × cantidad, en pesos", example: 36000 }
 *         medioDePago: { $ref: '#/components/schemas/MedioDePago' }
 *         creadaEn: { type: string, format: date-time }
 *         tipoDeEntrada:
 *           type: object
 *           description: Copia del tipo al momento de pagar (research R6)
 *           required: [id, nombre, precioUnitario]
 *           properties:
 *             id: { type: string, example: tip-2 }
 *             nombre: { type: string, example: Platea }
 *             precioUnitario: { type: integer, example: 18000 }
 *         evento:
 *           type: object
 *           description: Datos actuales del evento (aunque ya no sea visible en Explorar)
 *           required: [id, nombre, fechaHora, ubicacion, imagenUrl, organizador]
 *           properties:
 *             id: { type: string, example: evt-1 }
 *             nombre: { type: string, example: Hamlet en el Galpón }
 *             fechaHora: { type: string, format: date-time, example: "2026-11-21T21:00:00-03:00" }
 *             ubicacion: { type: string, example: "Galpón de Guevara, Chacarita" }
 *             imagenUrl: { type: string, nullable: true, example: /imagenes/img-seed-hamlet }
 *             organizador:
 *               type: object
 *               required: [id, nombre]
 *               properties:
 *                 id: { type: string, example: org-1 }
 *                 nombre: { type: string, example: Compañía La Trama }
 *         diasParaEvento:
 *           type: integer
 *           nullable: true
 *           description: Días hasta el evento redondeando hacia arriba; solo si está Confirmada y el evento es futuro
 *           example: 13
 *         calificacion:
 *           type: object
 *           nullable: true
 *           required: [puntaje, comentario, calificadaEn]
 *           properties:
 *             puntaje: { type: integer, minimum: 1, maximum: 5 }
 *             comentario: { type: string, nullable: true }
 *             calificadaEn: { type: string, format: date-time }
 *         acciones:
 *           type: object
 *           required: [completarPago, cancelar]
 *           properties:
 *             completarPago: { type: boolean }
 *             cancelar: { type: boolean }
 *         motivoNoCancelable:
 *           type: string
 *           nullable: true
 *           enum: [UTILIZADA, EVENTO_REALIZADO, REEMBOLSADA, CANCELADA, null]
 *     NuevaCompra:
 *       type: object
 *       required: [eventoId, tipoDeEntradaId, cantidad, medioDePago, precioUnitario]
 *       additionalProperties: false
 *       properties:
 *         eventoId: { type: string, example: evt-1 }
 *         tipoDeEntradaId: { type: string, example: tip-2 }
 *         cantidad: { type: integer, minimum: 1, maximum: 10, example: 2 }
 *         medioDePago: { $ref: '#/components/schemas/MedioDePago' }
 *         precioUnitario:
 *           type: integer
 *           minimum: 0
 *           example: 18000
 *           description: Precio del tipo que mostró el Resumen de Pago; si no coincide con el actual → 409 PRECIO_CAMBIADO
 *     RespuestaCompra:
 *       type: object
 *       required: [compra]
 *       properties:
 *         compra: { $ref: '#/components/schemas/Compra' }
 *   responses:
 *     CompraNoEncontrada:
 *       description: La compra no existe o es de otro comprador (no se distingue, SC-004)
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example: { error: { codigo: COMPRA_NO_ENCONTRADA, mensaje: "No encontramos esta compra." } }
 *
 * /compradores/compras:
 *   post:
 *     tags: [Compras]
 *     summary: Pagar (simulado) — crea una compra Confirmada y descuenta los lugares
 *     description: >
 *       Verifica en una sola operación indivisible (research R2): evento visible → tipo existente con el
 *       precio que vio el comprador (`precioUnitario`) → lugares suficientes. Si todo está bien, crea la
 *       compra Confirmada con número nuevo y suma `cantidad` a las vendidas del tipo. El monto lo calcula
 *       el servidor. No hay tope de compras por comprador (FR-005).
 *     security: [{ bearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/NuevaCompra' }
 *     responses:
 *       201:
 *         description: Compra confirmada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaCompra' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *       409:
 *         description: >
 *           PRECIO_CAMBIADO si el tipo ya no existe o su precio no es `precioUnitario` (FR-030);
 *           LUGARES_INSUFICIENTES si `cantidad` supera los lugares disponibles (FR-028). No se crea nada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               precio:
 *                 value: { error: { codigo: PRECIO_CAMBIADO, mensaje: "El precio de la entrada cambió. Revisá tu compra." } }
 *               lugares:
 *                 value: { error: { codigo: LUGARES_INSUFICIENTES, mensaje: "Ya no quedan suficientes entradas." } }
 *   get:
 *     tags: [Compras]
 *     summary: Mis compras — todas las compras del comprador con sesión, la más nueva primero (sin paginar)
 *     description: Orden [creadaEn desc, numero desc]. Incluye compras de eventos Finalizados (FR-017).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Lista de compras (puede estar vacía)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [compras]
 *               properties:
 *                 compras:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Compra' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *
 * /compradores/compras/{numero}:
 *   parameters:
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   get:
 *     tags: [Compras]
 *     summary: Detalle de compra
 *     description: Una compra de otro comprador responde igual que una inexistente (SC-004).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: La compra
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaCompra' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/CompraNoEncontrada' }
  *
 * /compradores/compras/{numero}/pago:
 *   parameters:
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1037 }
 *   post:
 *     tags: [Compras]
 *     summary: Completar pago (simulado) — Pendiente de pago → Confirmada
 *     description: Solo si la compra está Pendiente de pago y el evento todavía no ocurrió. No cambia los lugares (FR-022).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Compra confirmada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaCompra' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/CompraNoEncontrada' }
 *       409:
 *         description: La compra no está Pendiente de pago o el evento ya ocurrió
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: PAGO_NO_PERMITIDO, mensaje: "Esta compra no tiene un pago pendiente." } }
 *
 * /compradores/compras/{numero}/cancelacion:
 *   parameters:
 *     - { name: numero, in: path, required: true, schema: { type: string }, example: A-1042 }
 *   post:
 *     tags: [Compras]
 *     summary: Cancelar compra — Confirmada → Reembolsada, Pendiente de pago → Cancelada
 *     description: >
 *       Solo si la compra está Pendiente de pago o Confirmada y el evento todavía no ocurrió. Resta la cantidad
 *       de las vendidas del tipo (libera los lugares). El reembolso es simulado (FR-024).
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Compra cancelada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RespuestaCompra' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/CompraNoEncontrada' }
 *       409:
 *         description: La compra ya fue utilizada, cancelada o reembolsada, o el evento ya ocurrió
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: CANCELACION_NO_PERMITIDA, mensaje: "Esta compra no se puede cancelar." } }
 */
