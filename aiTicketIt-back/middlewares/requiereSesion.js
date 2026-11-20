import { SesionInvalida } from "../errors/ErrorDeDominio.js";
import { autenticacionService } from "../services/autenticacionService.js";

/**
 * Exige una sesión válida del tipo indicado (FR-015, FR-016).
 * Deja en req.sesion = { tipo, usuario, token }. La validación vive en autenticacionService.
 */
export function requiereSesion(tipo) {
  return (req, res, next) => {
    const [esquema, token] = (req.get("Authorization") ?? "").split(" ");
    if (esquema !== "Bearer" || !token) return next(new SesionInvalida());

    const { usuario } = autenticacionService.obtenerSesion(tipo, token);
    req.sesion = { tipo, usuario, token };
    next();
  };
}
