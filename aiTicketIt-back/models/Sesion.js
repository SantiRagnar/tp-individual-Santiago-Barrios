export const TIPOS_DE_CUENTA = ["comprador", "organizador"];

/** Ver data-model.md § Sesión. Solo se guarda el hash del token, nunca el token en claro. */
export class Sesion {
  constructor({ tokenHash, tipo, usuarioId, creadaEn = new Date() }) {
    if (!TIPOS_DE_CUENTA.includes(tipo)) {
      throw new Error(`Tipo de cuenta desconocido: ${tipo}`);
    }
    this.tokenHash = tokenHash;
    this.tipo = tipo;
    this.usuarioId = usuarioId;
    this.creadaEn = creadaEn;
  }
}
