import { z } from "zod";

// Body de POST …/mensajes y query de GET …/mensajes (specs/007-consultas-chat/research.md R7;
// data-model.md Mensaje.texto). El autor no viene del body: lo define la sesión.

export const LARGO_MAXIMO_MENSAJE = 1000;
const MENSAJE_VACIO = "Escribí un mensaje";

export const mensajeSchema = z.strictObject(
  {
    texto: z
      .string({ error: MENSAJE_VACIO })
      .trim()
      .min(1, { error: MENSAJE_VACIO })
      .max(LARGO_MAXIMO_MENSAJE, { error: `El mensaje puede tener hasta ${LARGO_MAXIMO_MENSAJE} caracteres` }),
  },
  { error: "Hay datos que no corresponden a un mensaje" },
);

export const consultaQuerySchema = z.object({
  despuesDe: z.string().min(1, { error: "Indicá desde qué mensaje" }).optional(),
});
