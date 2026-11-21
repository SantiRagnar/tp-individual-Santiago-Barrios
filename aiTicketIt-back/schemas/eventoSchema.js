import { z } from "zod";

// Solo la forma del evento (research R4; data-model.md § "Validaciones de entrada").
// Todo es opcional porque un borrador no exige nada (FR-014); las reglas para publicar
// y las de ventas viven en services/reglasEvento.js.

/** Texto opcional: se recorta y, si queda vacío, se guarda como null. */
const textoOpcional = (maximo, mensaje) =>
  z
    .string({ error: "Tiene que ser un texto" })
    .trim()
    .max(maximo, { error: mensaje })
    .transform((t) => (t === "" ? null : t))
    .nullish()
    .transform((t) => t ?? null);

const enteroOpcional = (mensaje) =>
  z
    .number({ error: mensaje })
    .int({ error: mensaje })
    .nullish()
    .transform((n) => n ?? null);

export const CATEGORIAS = ["Teatro", "Comedia", "Drama", "Amor"];

const tipoDeEntradaSchema = z.object({
  id: z.string().optional(),
  nombre: textoOpcional(60, "El nombre puede tener hasta 60 caracteres"),
  cupo: enteroOpcional("El cupo tiene que ser un número entero"),
  precio: enteroOpcional("El precio tiene que ser un número entero"),
});

const materialMultimediaSchema = z.object({
  nombre: z
    .string({ error: "Indicá el nombre del archivo" })
    .trim()
    .min(1, { error: "Indicá el nombre del archivo" })
    .max(200, { error: "El nombre del archivo puede tener hasta 200 caracteres" }),
  tipo: z.enum(["foto", "video"], { error: "El archivo tiene que ser una foto o un video" }),
});

export const eventoSchema = z.object({
  nombre: textoOpcional(120, "El nombre puede tener hasta 120 caracteres"),
  descripcion: textoOpcional(2000, "La descripción puede tener hasta 2000 caracteres"),
  categoria: z
    .enum(CATEGORIAS, { error: "Elegí una categoría de la lista" })
    .nullish()
    .transform((c) => c ?? null),
  fechaHora: z.iso
    .datetime({ offset: true, error: "Elegí fecha y hora" })
    .nullish()
    .transform((f) => f ?? null),
  ubicacion: textoOpcional(200, "La ubicación puede tener hasta 200 caracteres"),
  imagenId: z
    .string()
    .nullish()
    .transform((i) => i || null),
  materialMultimedia: z.array(materialMultimediaSchema).default([]),
  tiposDeEntrada: z.array(tipoDeEntradaSchema).default([]),
  estado: z.enum(["Borrador", "Publicado"], { error: "El estado tiene que ser Borrador o Publicado" }),
});
