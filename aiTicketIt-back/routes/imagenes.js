import express, { Router } from "express";
import { imagenesController } from "../controllers/imagenesController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { ImagenMuyGrande } from "../errors/ErrorDeDominio.js";

const TIPOS_DE_IMAGEN = ["image/jpeg", "image/png"];

/** Imágenes públicas: GET /imagenes/:id (research R7). */
export function crearRouterImagenes() {
  const router = Router();
  router.get("/:id", imagenesController.servir);
  return router;
}

/**
 * Subida de la imagen de un evento: POST /organizadores/imagenes. El body es el archivo crudo.
 * Un Content-Type que no es imagen deja req.body vacío y el servicio responde 415.
 */
export function crearRouterSubidaDeImagenes() {
  const router = Router();
  router.post(
    "/",
    requiereSesion("organizador"),
    express.raw({ type: TIPOS_DE_IMAGEN, limit: "5mb" }),
    imagenesController.subir,
  );
  // Solo en esta ruta: un body de más de 5 MB es una imagen demasiado grande (no un JSON de otra ruta).
  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => next(err?.type === "entity.too.large" ? new ImagenMuyGrande() : err));
  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Imágenes
 *
 * /imagenes/{id}:
 *   get:
 *     tags: [Imágenes]
 *     summary: Bytes de una imagen (público; el id es un UUID no adivinable)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: img-seed-hamlet }
 *     responses:
 *       200:
 *         description: La imagen, con Cache-Control immutable
 *         content:
 *           image/jpeg: { schema: { type: string, format: binary } }
 *           image/png: { schema: { type: string, format: binary } }
 *       404:
 *         description: No existe
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: IMAGEN_NO_ENCONTRADA, mensaje: "No encontramos la imagen." } }
 *
 * /organizadores/imagenes:
 *   post:
 *     tags: [Imágenes]
 *     summary: Subir la imagen de un evento (JPG o PNG, hasta 5 MB)
 *     description: El body es el archivo crudo. Se verifica la firma de los bytes además del Content-Type (research R7).
 *     security: [{ bearer: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         image/jpeg:
 *           schema: { type: string, format: binary }
 *         image/png:
 *           schema: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Imagen guardada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [id, url]
 *               properties:
 *                 id: { type: string, example: 3f1c2a9e-8d4b-4f0e-9a51-2c7d1e6b9f10 }
 *                 url: { type: string, example: /imagenes/3f1c2a9e-8d4b-4f0e-9a51-2c7d1e6b9f10 }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *       413:
 *         description: Más de 5 MB
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: IMAGEN_MUY_GRANDE, mensaje: "La imagen no puede pesar más de 5 MB" } }
 *       415:
 *         description: No es JPG ni PNG
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { error: { codigo: IMAGEN_INVALIDA, mensaje: "La imagen tiene que ser JPG o PNG" } }
 */
