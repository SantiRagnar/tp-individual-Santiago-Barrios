import { pedir } from '@/api/cliente';
import type { Categoria } from '@/api/eventos';

// specs/003-explorar-detalle-evento/contracts/compradores.openapi.yaml

export type Orden = 'fecha' | 'precio' | 'puntaje';

export type OrganizadorResumen = {
  id: string;
  nombre: string;
  /** Promedio con un decimal; null si no tiene reseñas. */
  puntaje: number | null;
  cantidadResenas: number;
};

export type EventoCompradorResumen = {
  id: string;
  nombre: string;
  categoria: Categoria | null;
  fechaHora: string;
  ubicacion: string;
  imagenUrl: string | null;
  precioDesde: number;
  agotado: boolean;
  organizador: OrganizadorResumen;
  esFavorito: boolean;
};

export type Resena = {
  numeroCompra: string;
  autor: string;
  puntaje: number;
  comentario: string | null;
  evento: { id: string; nombre: string };
  calificadaEn: string;
};

export type TipoDeEntradaComprador = { id: string; nombre: string; precio: number; disponibles: number };

export type EventoCompradorDetalle = EventoCompradorResumen & {
  descripcion: string | null;
  precioHasta: number;
  tiposDeEntrada: TipoDeEntradaComprador[];
  resenas: { resenas: Resena[]; siguiente: string | null };
};

export type PaginaDeEventos = { eventos: EventoCompradorResumen[]; total: number; siguiente: string | null };
export type PaginaDeResenas = { resenas: Resena[]; total: number; siguiente: string | null };

export type CriterioExplorar = { busqueda: string; categoria: Categoria | null; orden: Orden };

const COMPRADOR = { tipo: 'comprador' as const };

/** Una página de Explorar (research R4). Sin cursor = la primera. */
export function listarEventos(token: string, criterio: CriterioExplorar, cursor: string | null, signal?: AbortSignal) {
  const parametros = new URLSearchParams({ orden: criterio.orden });
  const busqueda = criterio.busqueda.trim();
  if (busqueda) parametros.set('busqueda', busqueda);
  if (criterio.categoria) parametros.set('categoria', criterio.categoria);
  if (cursor) parametros.set('cursor', cursor);
  return pedir<PaginaDeEventos>(`/compradores/eventos?${parametros}`, { token, signal, ...COMPRADOR });
}

export async function obtenerEventoComprador(token: string, id: string) {
  const { evento } = await pedir<{ evento: EventoCompradorDetalle }>(`/compradores/eventos/${encodeURIComponent(id)}`, {
    token,
    ...COMPRADOR,
  });
  return evento;
}

/** Página siguiente de reseñas del organizador (research R9). */
export function listarResenas(token: string, organizadorId: string, cursor: string) {
  const parametros = new URLSearchParams({ cursor });
  return pedir<PaginaDeResenas>(`/compradores/organizadores/${encodeURIComponent(organizadorId)}/resenas?${parametros}`, {
    token,
    ...COMPRADOR,
  });
}

export async function listarFavoritos(token: string) {
  const { eventos } = await pedir<{ eventos: EventoCompradorResumen[] }>('/compradores/favoritos', { token, ...COMPRADOR });
  return eventos;
}

/** Idempotente (research R10). */
export function marcarFavorito(token: string, eventoId: string) {
  return pedir<void>(`/compradores/favoritos/${encodeURIComponent(eventoId)}`, { metodo: 'PUT', token, ...COMPRADOR });
}

/** Idempotente (research R10). */
export function desmarcarFavorito(token: string, eventoId: string) {
  return pedir<void>(`/compradores/favoritos/${encodeURIComponent(eventoId)}`, { metodo: 'DELETE', token, ...COMPRADOR });
}
