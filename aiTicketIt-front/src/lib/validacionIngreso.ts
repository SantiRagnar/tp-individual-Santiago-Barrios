// Mismas reglas y mensajes que aiTicketIt-back/schemas/ingresoSchema.js (data-model.md § "Validaciones de entrada").
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve el mensaje de error o null si el email es válido. */
export function validarEmail(email: string): string | null {
  const limpio = email.trim();
  if (limpio.length === 0) return 'Ingresá tu email';
  if (!FORMATO_EMAIL.test(limpio)) return 'Ingresá un email válido';
  return null;
}

/** La contraseña no se recorta: solo se exige que no esté vacía. */
export function validarContrasena(contrasena: string): string | null {
  return contrasena.length === 0 ? 'Ingresá tu contraseña' : null;
}
