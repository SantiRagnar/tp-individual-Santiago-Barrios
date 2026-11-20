import { z } from "zod";

// Reglas de data-model.md § "Validaciones de entrada". Los mensajes son los mismos que muestra el front.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ingresoSchema = z.object({
  email: z
    .string({ error: "Ingresá tu email" })
    .trim()
    .toLowerCase()
    .min(1, { error: "Ingresá tu email", abort: true })
    .regex(FORMATO_EMAIL, { error: "Ingresá un email válido" }),
  // La contraseña no se recorta: se compara exactamente (FR-010).
  contrasena: z
    .string({ error: "Ingresá tu contraseña" })
    .min(1, { error: "Ingresá tu contraseña" }),
});
