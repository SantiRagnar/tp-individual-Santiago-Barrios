import { API_URL, pedir } from '@/api/cliente';

// contracts/eventos.openapi.yaml
export type Categoria = 'Teatro' | 'Comedia' | 'Drama' | 'Amor';
export const CATEGORIAS: Categoria[] = ['Teatro', 'Comedia', 'Drama', 'Amor'];
export type EstadoEvento = 'Publicado' | 'Borrador' | 'Finalizado';
export type EstadoGuardable = 'Publicado' | 'Borrador';

export type MaterialMultimedia = { nombre: string; tipo: 'foto' | 'video' };

export type TipoDeEntrada = {
  id: string;
  nombre: string | null;
  cupo: number | null;
  precio: number | null;
  vendidas: number;
  disponibles: number | null;
};

export type EventoResumen = {
  id: string;
  nombre: string | null;
  fechaHora: string | null;
  ubicacion: string | null;
  categoria: Categoria | null;
  estado: EstadoEvento;
  imagenUrl: string | null;
  vendidas: number;
  cupo: number;
};

export type Evento = EventoResumen & {
  descripcion: string | null;
  imagenId: string | null;
  materialMultimedia: MaterialMultimedia[];
  tiposDeEntrada: TipoDeEntrada[];
};

export type EventoEntrada = {
  nombre: string | null;
  descripcion: string | null;
  categoria: Categoria | null;
  fechaHora: string | null;
  ubicacion: string | null;
  imagenId: string | null;
  materialMultimedia: MaterialMultimedia[];
  tiposDeEntrada: { id?: string; nombre: string | null; cupo: number | null; precio: number | null }[];
  estado: EstadoGuardable;
};

const ORGANIZADOR = { tipo: 'organizador' as const };

/** La API devuelve rutas relativas (/imagenes/…); el front les antepone la URL del backend. */
export function urlDeImagen(imagenUrl: string | null): string | null {
  return imagenUrl ? `${API_URL}${imagenUrl}` : null;
}

export async function listarMisEventos(token: string) {
  const { eventos } = await pedir<{ eventos: EventoResumen[] }>('/organizadores/eventos', { token, ...ORGANIZADOR });
  return eventos;
}

export async function obtenerEvento(token: string, id: string) {
  const { evento } = await pedir<{ evento: Evento }>(`/organizadores/eventos/${encodeURIComponent(id)}`, {
    token,
    ...ORGANIZADOR,
  });
  return evento;
}

export async function crearEvento(token: string, entrada: EventoEntrada) {
  const { evento } = await pedir<{ evento: Evento }>('/organizadores/eventos', {
    metodo: 'POST',
    body: entrada,
    token,
    ...ORGANIZADOR,
  });
  return evento;
}

export type ArchivoDeImagen = { uri: string; tipoMime: string; archivo?: Blob };

/** Sube la imagen del evento (research R10): el archivo crudo, con su Content-Type. */
export async function subirImagen(token: string, { uri, tipoMime, archivo }: ArchivoDeImagen) {
  const blob = archivo ?? (await (await fetch(uri)).blob());
  return pedir<{ id: string; url: string }>('/organizadores/imagenes', {
    metodo: 'POST',
    body: blob,
    tipoContenido: tipoMime,
    token,
    ...ORGANIZADOR,
  });
}

/** Reemplazo completo del evento (research R6): los tipos existentes viajan con su id. */
export async function editarEvento(token: string, id: string, entrada: EventoEntrada) {
  const { evento } = await pedir<{ evento: Evento }>(`/organizadores/eventos/${encodeURIComponent(id)}`, {
    metodo: 'PUT',
    body: entrada,
    token,
    ...ORGANIZADOR,
  });
  return evento;
}
