import { DatosInvalidos } from "../errors/ErrorDeDominio.js";

/** Valida req.body contra un schema de zod y lo reemplaza por los datos normalizados. */
export function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const campos = [];
      for (const issue of resultado.error.issues) {
        // Ruta completa con puntos (tiposDeEntrada.1.cupo), así el front ubica el error (research R5).
        const campo = issue.path.length > 0 ? issue.path.join(".") : "body";
        // Un mensaje por campo: el primero que falla.
        if (!campos.some((c) => c.campo === campo)) {
          campos.push({ campo, mensaje: issue.message });
        }
      }
      return next(new DatosInvalidos(campos));
    }
    req.body = resultado.data;
    next();
  };
}
