import { Router } from "express";
import { comprasController as controller } from "../controllers/comprasController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";

/**
 * Calificaciones del comprador con sesión (feature 006, research R7). Se monta en /compradores/calificaciones.
 * Calificar es un sub-recurso de la compra (POST /compradores/compras/{numero}/calificacion, en routes/compras.js);
 * acá vive la compra a recordar en Explorar, en un path propio para no chocar con /compras/:numero.
 */
export function crearRouterCalificaciones() {
  const router = Router();
  router.use(requiereSesion("comprador"));

  router.get("/pendiente", controller.pendienteDeCalificar);

  return router;
}

/**
 * @openapi
 * /compradores/calificaciones/pendiente:
 *   get:
 *     tags: [Calificaciones]
 *     summary: Compra a recordar en Explorar (Utilizada sin calificar, la del evento más reciente)
 *     description: >
 *       Devuelve la compra del comprador con `acciones.calificar = true` cuyo evento tiene la fecha más reciente;
 *       a igual fecha, la de número mayor (FR-014, research R7). Sin compras pendientes, `compra` es null.
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Compra pendiente de calificar, o null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [compra]
 *               properties:
 *                 compra:
 *                   allOf: [{ $ref: '#/components/schemas/Compra' }]
 *                   nullable: true
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */
