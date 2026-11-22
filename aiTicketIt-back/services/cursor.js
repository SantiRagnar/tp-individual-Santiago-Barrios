// Cursores opacos de paginación (research R4, R9): base64url del JSON de la clave del último
// elemento devuelto. El cliente no los interpreta: solo los devuelve para pedir la página siguiente.

export function codificar(clave) {
  return Buffer.from(JSON.stringify(clave), "utf8").toString("base64url");
}

/**
 * Devuelve la clave o null si el texto no es un cursor válido. `validarForma(clave)` decide si la
 * clave tiene la forma esperada para el orden pedido (un cursor de otro orden no sirve).
 */
export function decodificar(texto, validarForma) {
  if (typeof texto !== "string" || !/^[A-Za-z0-9_-]+$/.test(texto)) return null;
  try {
    const clave = JSON.parse(Buffer.from(texto, "base64url").toString("utf8"));
    return validarForma(clave) ? clave : null;
  } catch {
    return null;
  }
}
