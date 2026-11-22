import { z } from "zod";

// Parámetros de GET /organizadores/eventos/:id/ventas (specs/005-panel-evento/data-model.md
// § Validaciones de entrada). Solo la forma: que el cursor sea válido lo decide el servicio.

export const ESTADOS_COMPRA = ["Pendiente de pago", "Confirmada", "Utilizada", "Cancelada", "Reembolsada"];

export const ventasSchema = z.object({
  estado: z
    .union([z.literal(""), z.enum(ESTADOS_COMPRA)], { error: "Elegí un estado válido" })
    .nullish()
    .transform((e) => e || null),
  cursor: z
    .string({ error: "El cursor no es válido" })
    .nullish()
    .transform((c) => c || null),
});
