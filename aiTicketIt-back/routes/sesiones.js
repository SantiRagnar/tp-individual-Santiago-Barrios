import { Router } from "express";
import { crearSesionesController } from "../controllers/sesionesController.js";
import { requiereSesion } from "../middlewares/requiereSesion.js";
import { validar } from "../middlewares/validar.js";
import { ingresoSchema } from "../schemas/ingresoSchema.js";

/** Router de sesiones para un tipo de cuenta. Se monta en /compradores/sesiones y /organizadores/sesiones. */
export function crearRouterSesiones(tipo) {
  const router = Router();
  const controller = crearSesionesController(tipo);

  router.post("/", validar(ingresoSchema), controller.ingresar);
  router.get("/actual", requiereSesion(tipo), controller.actual);
  router.delete("/actual", requiereSesion(tipo), controller.cerrar);

  return router;
}

/**
 * @openapi
 * tags:
 *   - name: Sesiones de compradores
 *   - name: Sesiones de organizadores
 *
 * components:
 *   securitySchemes:
 *     bearer:
 *       type: http
 *       scheme: bearer
 *       description: Token opaco devuelto por el ingreso. Un token de otro tipo de cuenta se trata como inválido.
 *   schemas:
 *     Ingreso:
 *       type: object
 *       required: [email, contrasena]
 *       properties:
 *         email:
 *           type: string
 *           description: Se recorta y se compara sin distinguir mayúsculas (FR-010).
 *         contrasena:
 *           type: string
 *           description: Se compara exactamente, sin recortar. Nunca se devuelve ni se registra.
 *     Token:
 *       type: string
 *       description: Token opaco (base64url, 43 caracteres). Se devuelve una sola vez.
 *     Comprador:
 *       type: object
 *       required: [id, nombre, apellido, email]
 *       properties:
 *         id: { type: string, example: cmp-1 }
 *         nombre: { type: string, example: Sofía }
 *         apellido: { type: string, example: Gómez }
 *         email: { type: string, example: sofia.gomez@correo.com }
 *     Organizador:
 *       type: object
 *       required: [id, nombre, email]
 *       properties:
 *         id: { type: string, example: org-1 }
 *         nombre: { type: string, example: Compañía La Trama }
 *         email: { type: string, example: produccion@latrama.com.ar }
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: object
 *           required: [codigo, mensaje]
 *           properties:
 *             codigo: { type: string }
 *             mensaje: { type: string }
 *             campos:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [campo, mensaje]
 *                 properties:
 *                   campo: { type: string }
 *                   mensaje: { type: string }
 *   responses:
 *     DatosInvalidos:
 *       description: El body no cumple el schema
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example:
 *             error:
 *               codigo: DATOS_INVALIDOS
 *               mensaje: Revisá los datos enviados.
 *               campos: [{ campo: email, mensaje: Ingresá un email válido }]
 *     CredencialesInvalidas:
 *       description: Email inexistente, contraseña incorrecta o cuenta del otro tipo (mismo mensaje en todos los casos, FR-011)
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example:
 *             error:
 *               codigo: CREDENCIALES_INVALIDAS
 *               mensaje: El email o la contraseña no son correctos.
 *     SesionInvalida:
 *       description: Falta el token, no existe, se cerró, o es de otro tipo de cuenta
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Error' }
 *           example:
 *             error:
 *               codigo: SESION_INVALIDA
 *               mensaje: Tu sesión no es válida. Ingresá de nuevo.
 */

/**
 * @openapi
 * /compradores/sesiones:
 *   post:
 *     tags: [Sesiones de compradores]
 *     summary: Ingreso de comprador con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Ingreso' }
 *     responses:
 *       201:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [token, comprador]
 *               properties:
 *                 token: { $ref: '#/components/schemas/Token' }
 *                 comprador: { $ref: '#/components/schemas/Comprador' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/CredencialesInvalidas' }
 */

/**
 * @openapi
 * /organizadores/sesiones:
 *   post:
 *     tags: [Sesiones de organizadores]
 *     summary: Ingreso de organizador con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Ingreso' }
 *     responses:
 *       201:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [token, organizador]
 *               properties:
 *                 token: { $ref: '#/components/schemas/Token' }
 *                 organizador: { $ref: '#/components/schemas/Organizador' }
 *       400: { $ref: '#/components/responses/DatosInvalidos' }
 *       401: { $ref: '#/components/responses/CredencialesInvalidas' }
 */

/**
 * @openapi
 * /compradores/sesiones/actual:
 *   get:
 *     tags: [Sesiones de compradores]
 *     summary: Comprador de la sesión actual (verifica que el token siga valiendo)
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Sesión válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [comprador]
 *               properties:
 *                 comprador: { $ref: '#/components/schemas/Comprador' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *   delete:
 *     tags: [Sesiones de compradores]
 *     summary: Cerrar la sesión actual del comprador (FR-018)
 *     security: [{ bearer: [] }]
 *     responses:
 *       204:
 *         description: Sesión cerrada; el token deja de valer
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */

/**
 * @openapi
 * /organizadores/sesiones/actual:
 *   get:
 *     tags: [Sesiones de organizadores]
 *     summary: Organizador de la sesión actual (verifica que el token siga valiendo)
 *     security: [{ bearer: [] }]
 *     responses:
 *       200:
 *         description: Sesión válida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [organizador]
 *               properties:
 *                 organizador: { $ref: '#/components/schemas/Organizador' }
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 *   delete:
 *     tags: [Sesiones de organizadores]
 *     summary: Cerrar la sesión actual del organizador (FR-018)
 *     security: [{ bearer: [] }]
 *     responses:
 *       204:
 *         description: Sesión cerrada; el token deja de valer
 *       401: { $ref: '#/components/responses/SesionInvalida' }
 */
