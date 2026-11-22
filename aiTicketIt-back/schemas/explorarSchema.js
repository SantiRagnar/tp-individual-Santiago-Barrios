import { z } from "zod";
import { CATEGORIAS } from "./eventoSchema.js";

// Parámetros de Explorar y de las reseñas (specs/003-explorar-detalle-evento/data-model.md
// § Validaciones de entrada). Solo la forma: que el cursor corresponda al orden lo decide el servicio.

export const ORDENES = ["fecha", "precio", "puntaje"];

const cursor = z
  .string({ error: "El cursor no es válido" })
  .nullish()
  .transform((c) => c || null);

export const explorarSchema = z.object({
  busqueda: z
    .string({ error: "La búsqueda tiene que ser un texto" })
    .trim()
    .max(100, { error: "La búsqueda puede tener hasta 100 caracteres" })
    .nullish()
    .transform((t) => t || null),
  categoria: z
    .enum(CATEGORIAS, { error: "Elegí una categoría válida" })
    .nullish()
    .transform((c) => c ?? null),
  orden: z.enum(ORDENES, { error: "Elegí un orden válido" }).default("fecha"),
  cursor,
});

export const resenasSchema = z.object({ cursor });
