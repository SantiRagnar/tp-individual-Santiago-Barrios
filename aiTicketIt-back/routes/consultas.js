import { Router } from "express";
import { consultasController } from "../controllers/consultasController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";

/** Consultas del comprador que no son de una compra en particular. Se monta en /compradores/consultas (feature 007). */
export function crearRouterConsultasComprador() {
  const router = Router();
  router.use(requiereSesion("comprador"));
  router.get("/no-leidas", consultasController.noLeidasDeComprador);
  return router;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     ConsultaNoLeida:
 *       type: object
 *       required: [numero, evento, organizador, ultimoMensaje]
 *       properties:
 *         numero: { type: string, example: A-1037 }
 *         evento:
 *           type: object
 *           required: [id, nombre]
 *           properties: { id: { type: string }, nombre: { type: string } }
 *         organizador:
 *           type: object
 *           required: [nombre]
 *           properties: { nombre: { type: string } }
 *         ultimoMensaje: { $ref: '#/components/schemas/Mensaje' }
 *
 * /compradores/consultas/no-leidas:
 *   get:
 *     tags: [Consultas (comprador)]
 *     summary: Chats con respuestas del organizador que el comprador todavía no leyó
 *     description: >
 *       La app lo consulta cada 3 s para el toast (FR-024). Una entrada por compra, la del último mensaje más
 *       reciente primero; [] si no hay ninguna.
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Consultas no leídas por el comprador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [consultas]
 *               properties:
 *                 consultas: { type: array, items: { $ref: '#/components/schemas/ConsultaNoLeida' } }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */
