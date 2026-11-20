import { createHash, randomBytes } from "node:crypto";
import * as contrasenasPorDefecto from "./contrasenas.js";
import * as compradoresRepository from "../repository/compradoresRepository.js";
import * as organizadoresRepository from "../repository/organizadoresRepository.js";
import * as sesionesRepositoryPorDefecto from "../repository/sesionesRepository.js";
import { Sesion } from "../models/Sesion.js";
import { CredencialesInvalidas, SesionInvalida } from "../errors/ErrorDeDominio.js";

const hashDeToken = (token) => createHash("sha256").update(token).digest("hex");

/**
 * Reglas de autenticación. Las dependencias se pueden reemplazar en los tests.
 * Cada tipo de cuenta busca solo en su propio repositorio (FR-009).
 */
export function crearAutenticacionService({
  cuentas = { comprador: compradoresRepository, organizador: organizadoresRepository },
  sesionesRepository = sesionesRepositoryPorDefecto,
  contrasenas = contrasenasPorDefecto,
} = {}) {
  function repositorioDe(tipo) {
    const repositorio = cuentas[tipo];
    if (!repositorio) throw new Error(`Tipo de cuenta desconocido: ${tipo}`);
    return repositorio;
  }

  return {
    /** Devuelve { token, usuario } o lanza CredencialesInvalidas (mismo error para todo fallo, FR-011). */
    async ingresar(tipo, email, contrasena) {
      const usuario = repositorioDe(tipo).buscarPorEmail(email.trim().toLowerCase());

      if (!usuario) {
        // Mismo trabajo que con un usuario real: no se revela si el email existe (research R5).
        await contrasenas.verificarContraHashFicticio(contrasena);
        throw new CredencialesInvalidas();
      }
      if (!(await contrasenas.verificar(contrasena, usuario.contrasenaHash))) {
        throw new CredencialesInvalidas();
      }

      const token = randomBytes(32).toString("base64url");
      sesionesRepository.guardar(
        new Sesion({
          tokenHash: hashDeToken(token),
          tipo,
          usuarioId: usuario.id,
          creadaEn: new Date(),
        }),
      );
      return { token, usuario };
    },

    /**
     * Una sesión es válida si existe, es del tipo pedido y su usuario sigue existiendo
     * (data-model.md § Sesión). Devuelve { sesion, usuario } o lanza SesionInvalida.
     */
    obtenerSesion(tipo, token) {
      if (typeof token !== "string" || token.length === 0) throw new SesionInvalida();

      const sesion = sesionesRepository.buscarPorTokenHash(hashDeToken(token));
      if (!sesion || sesion.tipo !== tipo) throw new SesionInvalida();

      const usuario = repositorioDe(tipo).buscarPorId(sesion.usuarioId);
      if (!usuario) throw new SesionInvalida();

      return { sesion, usuario };
    },

    /** Cierra la sesión (FR-018): desde ese momento el token deja de valer. */
    cerrarSesion(tipo, token) {
      const { sesion } = this.obtenerSesion(tipo, token);
      sesionesRepository.eliminar(sesion.tokenHash);
    },
  };
}

export const autenticacionService = crearAutenticacionService();
