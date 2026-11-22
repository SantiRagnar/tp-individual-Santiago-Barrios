import { DatosInvalidos } from "../errors/ErrorDeDominio.js";

/**
 * Como `validar`, pero sobre los parámetros de la URL. En Express 5 `req.query` es un getter sin
 * setter, así que los datos normalizados se dejan como propiedad propia de `req` con
 * Object.defineProperty: los controllers siguen leyendo `req.query`.
 */
export function validarQuery(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.query ?? {});
    if (!resultado.success) {
      const campos = [];
      for (const issue of resultado.error.issues) {
        const campo = issue.path.length > 0 ? issue.path.join(".") : "query";
        if (!campos.some((c) => c.campo === campo)) campos.push({ campo, mensaje: issue.message });
      }
      return next(new DatosInvalidos(campos));
    }
    Object.defineProperty(req, "query", { value: resultado.data, writable: true, configurable: true, enumerable: true });
    next();
  };
}
