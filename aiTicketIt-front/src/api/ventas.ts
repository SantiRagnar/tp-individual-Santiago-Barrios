import type { EstadoCompra, MedioDePago } from './compras';
import { pedir } from './cliente';

// Ventas del evento para el panel del organizador (specs/005-panel-evento/contracts/ventas.openapi.yaml).

// Los estados y medios de pago son los mismos que los de la compra (feature 004).
export type { EstadoCompra, MedioDePago };

export type Venta = {
  numero: string;
  comprador: { nombre: string };
  tipoDeEntrada: { id: string; nombre: string | null };
  cantidad: number;
  estado: EstadoCompra;
  medioDePago: MedioDePago;
  monto: number;
  creadaEn: string;
  acciones: { marcarUtilizada: boolean };
};

export type ResumenDeVentas = {
  recaudado: number;
  entradasVendidas: number;
  comprasActivas: number;
  porEstado: Record<'Todas' | EstadoCompra, number>;
};

export type PaginaDeVentas = { resumen: ResumenDeVentas; ventas: Venta[]; siguiente: string | null };

const ORGANIZADOR = { tipo: 'organizador' as const };

const rutaVentas = (eventoId: string) => `/organizadores/eventos/${encodeURIComponent(eventoId)}/ventas`;

export function listarVentas(
  token: string,
  eventoId: string,
  { estado, cursor, signal }: { estado: EstadoCompra | null; cursor: string | null; signal?: AbortSignal },
) {
  const parametros = new URLSearchParams();
  if (estado) parametros.set('estado', estado);
  if (cursor) parametros.set('cursor', cursor);
  const query = parametros.toString();
  return pedir<PaginaDeVentas>(`${rutaVentas(eventoId)}${query ? `?${query}` : ''}`, { token, signal, ...ORGANIZADOR });
}

export function marcarUtilizada(token: string, eventoId: string, numero: string) {
  return pedir<{ venta: Venta; resumen: ResumenDeVentas }>(
    `${rutaVentas(eventoId)}/${encodeURIComponent(numero)}/utilizacion`,
    { metodo: 'POST', token, ...ORGANIZADOR },
  );
}
