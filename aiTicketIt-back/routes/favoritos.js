import { Router } from "express";
import { favoritosController as controller } from "../controllers/favoritosController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";

/** Favoritos del comprador con sesión (feature 003, research R10). Se monta en /compradores/favoritos. */
export function crearRouterFavoritos() {
  const router = Router();
  router.use(requiereSesion("comprador"));

  router.get("/", controller.listar);
  router.put("/:eventoId", controller.marcar);
  router.delete("/:eventoId", controller.desmarcar);

  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Favoritos
 *
 * /compradores/favoritos:
 *   get:
 *     tags: [Favoritos]
 *     summary: Favoritos del comprador con sesión que siguen visibles, por fecha (sin paginar)
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Lista de favoritos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [eventos]
 *               properties:
 *                 eventos:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/EventoCompradorResumen' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *
 * /compradores/favoritos/{eventoId}:
 *   parameters:
 *     - { name: eventoId, in: path, required: true, schema: { type: string }, example: evt-3 }
 *   put:
 *     tags: [Favoritos]
 *     summary: Marcar un evento visible como favorito (idempotente)
 *     description: Si ya era favorito, no cambia nada y responde igual (research R10).
 *     security: [{ bearer: [] }]
 *     responses:
 *       204: { description: El evento es favorito }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       404: { $ref: '#/components/responses/EventoNoEncontrado' }
 *   delete:
 *     tags: [Favoritos]
 *     summary: Quitar un evento de favoritos (idempotente)
 *     description: Responde 204 aunque no fuera favorito o el evento ya no sea visible (research R10).
 *     security: [{ bearer: [] }]
 *     responses:
 *       204: { description: El evento no es favorito }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */
