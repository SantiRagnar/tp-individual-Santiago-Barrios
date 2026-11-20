import { DatosInvalidos } from "../errors/ErrorDeDominio.js";

/** Valida req.body contra un schema de zod y lo reemplaza por los datos normalizados. */
export function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body ?? {});
    if (!resultado.success) {
      const campos = [];
      for (const issue of resultado.error.issues) {
        const campo = String(issue.path[0] ?? "body");
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
