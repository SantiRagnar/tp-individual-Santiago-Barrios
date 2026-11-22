import { z } from "zod";

// Body de POST /compradores/compras/{numero}/calificacion (specs/006-calificaciones-opiniones/data-model.md
// § Calificación y § Validaciones de entrada, research R5). El comentario se recorta acá: un texto vacío o
// solo con espacios llega al servicio como null, y el límite de 500 se cuenta después de recortar (FR-003).

export const LARGO_MAXIMO_COMENTARIO = 500;

const MENSAJE_PUNTAJE = "Elegí de 1 a 5 estrellas";
const MENSAJE_COMENTARIO = `El comentario puede tener hasta ${LARGO_MAXIMO_COMENTARIO} caracteres`;

export const calificacionSchema = z.strictObject(
  {
    puntaje: z
      .number({ error: MENSAJE_PUNTAJE })
      .int({ error: MENSAJE_PUNTAJE })
      .min(1, { error: MENSAJE_PUNTAJE })
      .max(5, { error: MENSAJE_PUNTAJE }),
    comentario: z
      .string({ error: MENSAJE_COMENTARIO })
      .trim()
      .max(LARGO_MAXIMO_COMENTARIO, { error: MENSAJE_COMENTARIO })
      .nullish()
      .transform((texto) => (texto ? texto : null)),
  },
  { error: "Hay datos que no corresponden a una calificación" },
);
