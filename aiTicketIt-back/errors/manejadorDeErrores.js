import { DatosInvalidos, ErrorDeDominio } from "./ErrorDeDominio.js";

/**
 * Traduce cualquier error al formato { error: { codigo, mensaje, campos? } }.
 * Nunca registra el body del request (puede tener contraseñas) ni detalles internos en la respuesta.
 */
// eslint-disable-next-line no-unused-vars
export function manejadorDeErrores(err, req, res, next) {
  // JSON mal formado en el body
  if (err?.type === "entity.parse.failed") {
    err = new DatosInvalidos();
  }

  if (err instanceof ErrorDeDominio) {
    const error = { codigo: err.codigo, mensaje: err.mensaje };
    if (err.campos) error.campos = err.campos;
    return res.status(err.status).json({ error });
  }

  console.error(`Error inesperado en ${req.method} ${req.path}: ${err?.name ?? "Error"}`);
  return res.status(500).json({
    error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error inesperado." },
  });
}
