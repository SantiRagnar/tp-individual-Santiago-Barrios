import type { Categoria, EstadoGuardable, Evento, EventoEntrada, MaterialMultimedia } from '@/api/eventos';

// Mismas reglas y mensajes que aiTicketIt-back/services/reglasEvento.js (research R13).
// Estado del formulario: data-model.md § "Estado del formulario en el front".

export type TipoForm = {
  /** Clave estable para React y para los "tocados" (no cambia al renumerar). */
  clave: string;
  /** id del tipo guardado (al editar); los nuevos no tienen. */
  id?: string;
  nombre: string;
  /** Texto mientras se escribe; se convierte a entero al guardar. */
  cupo: string;
  precio: string;
  /** Lo maneja el sistema; 0 para los tipos nuevos. */
  vendidas: number;
};

export type FormEvento = {
  nombre: string;
  descripcion: string;
  categoria: Categoria | null;
  fechaHora: string | null;
  ubicacion: string;
  imagenId: string | null;
  /** Ruta relativa de la imagen (/imagenes/…), para la vista previa. */
  imagenUrl: string | null;
  materialMultimedia: MaterialMultimedia[];
  tiposDeEntrada: TipoForm[];
};

/** campo ("nombre", "tiposDeEntrada.1.cupo"…) → mensaje. */
export type Errores = Record<string, string>;

export const LARGO_DESCRIPCION = 2000;

let ultimaClave = 0;
const nuevaClave = () => `tipo-${++ultimaClave}`;

export function tipoVacio(): TipoForm {
  return { clave: nuevaClave(), nombre: '', cupo: '', precio: '', vendidas: 0 };
}

export function formVacio(): FormEvento {
  return {
    nombre: '',
    descripcion: '',
    categoria: null,
    fechaHora: null,
    ubicacion: '',
    imagenId: null,
    imagenUrl: null,
    materialMultimedia: [],
    tiposDeEntrada: [],
  };
}

/** Precarga el formulario con un evento guardado (Editar evento), incluidos los id de tipo. */
export function formDesdeEvento(evento: Evento): FormEvento {
  return {
    nombre: evento.nombre ?? '',
    descripcion: evento.descripcion ?? '',
    categoria: evento.categoria,
    fechaHora: evento.fechaHora,
    ubicacion: evento.ubicacion ?? '',
    imagenId: evento.imagenId,
    imagenUrl: evento.imagenUrl,
    materialMultimedia: evento.materialMultimedia,
    tiposDeEntrada: evento.tiposDeEntrada.map((t) => ({
      clave: nuevaClave(),
      id: t.id,
      nombre: t.nombre ?? '',
      cupo: t.cupo === null ? '' : String(t.cupo),
      precio: t.precio === null ? '' : String(t.precio),
      vendidas: t.vendidas,
    })),
  };
}

/** "120" → 120; "" → null; "1.5", "1,5" o "abc" → NaN (para poder mostrar el error). */
export function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return null;
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN;
}

/** Deja escribir solo lo que puede ser un número (dígitos, signo y separador decimal). */
export function filtrarNumero(texto: string): string {
  return texto.replace(/[^\d.,-]/g, '');
}

const normalizarNombre = (nombre: string) => nombre.trim().toLowerCase();

/** Reglas para publicar o guardar cambios de un Publicado (FR-011, FR-012) y cupo ≥ vendidas (FR-020). */
export function validarEvento(form: FormEvento, ahora: Date): Errores {
  const errores: Errores = {};

  if (!form.nombre.trim()) errores.nombre = 'Poné un nombre al evento';

  if (!form.fechaHora) errores.fechaHora = 'Elegí fecha y hora';
  else if (new Date(form.fechaHora).getTime() <= ahora.getTime()) errores.fechaHora = 'La fecha tiene que ser futura';

  if (!form.ubicacion.trim()) errores.ubicacion = 'Indicá dónde se hace el evento';

  if (form.tiposDeEntrada.length === 0) errores.tiposDeEntrada = 'Agregá al menos un tipo de entrada';

  const vistos = new Set<string>();
  form.tiposDeEntrada.forEach((tipo, i) => {
    const campo = (nombre: string) => `tiposDeEntrada.${i}.${nombre}`;

    const nombre = normalizarNombre(tipo.nombre);
    if (!nombre) errores[campo('nombre')] = 'Poné un nombre';
    else if (vistos.has(nombre)) errores[campo('nombre')] = 'Ya hay una entrada con este nombre';
    if (nombre) vistos.add(nombre);

    const cupo = aNumero(tipo.cupo);
    if (cupo === null) errores[campo('cupo')] = 'Indicá el cupo';
    else if (!Number.isInteger(cupo) || cupo < 1) errores[campo('cupo')] = 'El cupo tiene que ser 1 o más';
    else if (cupo < tipo.vendidas) errores[campo('cupo')] = `El cupo no puede ser menor a las vendidas (${tipo.vendidas})`;

    const precio = aNumero(tipo.precio);
    if (precio === null) errores[campo('precio')] = 'Indicá el precio';
    else if (Number.isNaN(precio)) errores[campo('precio')] = 'Indicá el precio';
    else if (precio < 0) errores[campo('precio')] = 'El precio no puede ser negativo';
  });

  return errores;
}

/**
 * Nota bajo el primario deshabilitado (FR-013). Solo se muestra con al menos un error visible.
 * `accion` = "publicar" (Crear / Borrador) o "guardar" (Publicado).
 */
export function notaPrimario(visibles: string[], accion: 'publicar' | 'guardar'): string | null {
  if (visibles.length === 0) return null;
  if (visibles.length === 1 && visibles[0] === 'tiposDeEntrada') return `Agregá al menos un tipo de entrada para ${accion}.`;
  return visibles.length === 1
    ? `Revisá el campo marcado para ${accion}.`
    : `Revisá los campos marcados para ${accion}.`;
}

const entero = (texto: string) => {
  const n = aNumero(texto);
  return n !== null && Number.isInteger(n) ? n : null;
};
const textoONull = (texto: string) => texto.trim() || null;

/** Lo que se manda a la API: textos recortados, vacíos → null, cupo y precio a entero. */
export function aEventoEntrada(form: FormEvento, estado: EstadoGuardable): EventoEntrada {
  return {
    nombre: textoONull(form.nombre),
    descripcion: textoONull(form.descripcion),
    categoria: form.categoria,
    fechaHora: form.fechaHora,
    ubicacion: textoONull(form.ubicacion),
    imagenId: form.imagenId,
    materialMultimedia: form.materialMultimedia,
    tiposDeEntrada: form.tiposDeEntrada.map((t) => ({
      ...(t.id ? { id: t.id } : {}),
      nombre: textoONull(t.nombre),
      cupo: entero(t.cupo),
      precio: entero(t.precio),
    })),
    estado,
  };
}
