import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const LARGO_CLAVE = 64;
const LARGO_SALT = 16;

// Hash de una contraseña que nadie conoce. Se usa cuando el email no existe,
// para que la respuesta tarde lo mismo y no revele qué cuentas existen (research R5).
const HASH_FICTICIO =
  "scrypt$" +
  "00".repeat(LARGO_SALT) +
  "$" +
  "00".repeat(LARGO_CLAVE);

/** Devuelve "scrypt$<saltHex>$<hashHex>" (data-model.md Comprador.contrasenaHash). */
export async function hashear(contrasena) {
  const salt = randomBytes(LARGO_SALT);
  const clave = await scryptAsync(contrasena, salt, LARGO_CLAVE);
  return `scrypt$${salt.toString("hex")}$${clave.toString("hex")}`;
}

export async function verificar(contrasena, contrasenaHash) {
  const partes = typeof contrasenaHash === "string" ? contrasenaHash.split("$") : [];
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;

  const salt = Buffer.from(partes[1], "hex");
  const esperado = Buffer.from(partes[2], "hex");
  if (esperado.length !== LARGO_CLAVE) return false;

  const calculado = await scryptAsync(contrasena, salt, LARGO_CLAVE);
  return timingSafeEqual(calculado, esperado);
}

/** Hace el mismo trabajo que verificar() y siempre devuelve false. */
export async function verificarContraHashFicticio(contrasena) {
  await verificar(contrasena, HASH_FICTICIO);
  return false;
}
