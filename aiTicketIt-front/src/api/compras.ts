import { pedir } from '@/api/cliente';

// specs/004-compra-pago-mis-compras/contracts/compras.openapi.yaml. El pago es simulado (FR-008).

export type MedioDePago = 'Tarjeta de crédito' | 'Tarjeta de débito' | 'Mercado Pago' | 'Transferencia';
export type EstadoCompra = 'Pendiente de pago' | 'Confirmada' | 'Utilizada' | 'Cancelada' | 'Reembolsada';
export type MotivoNoCancelable = 'UTILIZADA' | 'EVENTO_REALIZADO' | 'REEMBOLSADA' | 'CANCELADA';
/** specs/006-calificaciones-opiniones/data-model.md § Vista Compra `motivoNoCalificable`. */
export type MotivoNoCalificable = 'YA_CALIFICADA' | 'NO_UTILIZADA';

/** En el orden del diseño (Compradores 06). */
export const MEDIOS_DE_PAGO: MedioDePago[] = ['Tarjeta de crédito', 'Tarjeta de débito', 'Mercado Pago', 'Transferencia'];

export type Compra = {
  numero: string;
  estado: EstadoCompra;
  cantidad: number;
  monto: number;
  medioDePago: MedioDePago;
  creadaEn: string;
  /** Copia del tipo al pagar (research R6). */
  tipoDeEntrada: { id: string; nombre: string; precioUnitario: number };
  evento: {
    id: string;
    nombre: string;
    fechaHora: string;
    ubicacion: string;
    imagenUrl: string | null;
    organizador: { id: string; nombre: string };
  };
  /** Solo Confirmadas de eventos futuros; si no, null. */
  diasParaEvento: number | null;
  calificacion: { puntaje: number; comentario: string | null; calificadaEn: string } | null;
  /** `calificar`: Utilizada y sin calificar (data-model.md § Vista Compra `acciones.calificar`, feature 006). */
  acciones: { completarPago: boolean; cancelar: boolean; calificar: boolean };
  motivoNoCancelable: MotivoNoCancelable | null;
  motivoNoCalificable: MotivoNoCalificable | null;
};

export type NuevaCalificacion = { puntaje: number; comentario: string | null };

export type NuevaCompra = {
  eventoId: string;
  tipoDeEntradaId: string;
  cantidad: number;
  medioDePago: MedioDePago;
  /** El precio que mostró el Resumen; si cambió, la API responde 409 PRECIO_CAMBIADO (research R3). */
  precioUnitario: number;
};

const COMPRADOR = { tipo: 'comprador' as const };

/** Pagar (simulado): crea la compra Confirmada. 409 LUGARES_INSUFICIENTES / PRECIO_CAMBIADO, 404 si el evento no está disponible. */
export async function comprar(token: string, nuevaCompra: NuevaCompra): Promise<Compra> {
  const { compra } = await pedir<{ compra: Compra }>('/compradores/compras', { metodo: 'POST', body: nuevaCompra, token, ...COMPRADOR });
  return compra;
}

/** Mis compras, la más nueva primero (sin paginar). */
export async function listarCompras(token: string): Promise<Compra[]> {
  const { compras } = await pedir<{ compras: Compra[] }>('/compradores/compras', { token, ...COMPRADOR });
  return compras;
}

export async function obtenerCompra(token: string, numero: string): Promise<Compra> {
  const { compra } = await pedir<{ compra: Compra }>(`/compradores/compras/${encodeURIComponent(numero)}`, { token, ...COMPRADOR });
  return compra;
}

/** Completar pago (simulado): Pendiente de pago → Confirmada. */
export async function completarPago(token: string, numero: string): Promise<Compra> {
  const { compra } = await pedir<{ compra: Compra }>(`/compradores/compras/${encodeURIComponent(numero)}/pago`, {
    metodo: 'POST',
    token,
    ...COMPRADOR,
  });
  return compra;
}

/** Cancelar: Confirmada → Reembolsada, Pendiente de pago → Cancelada. */
export async function cancelarCompra(token: string, numero: string): Promise<Compra> {
  const { compra } = await pedir<{ compra: Compra }>(`/compradores/compras/${encodeURIComponent(numero)}/cancelacion`, {
    metodo: 'POST',
    token,
    ...COMPRADOR,
  });
  return compra;
}

/**
 * Calificar una compra Utilizada, una sola vez (specs/006-calificaciones-opiniones/contracts/calificaciones.openapi.yaml).
 * 409 COMPRA_YA_CALIFICADA / CALIFICACION_NO_PERMITIDA, 404 si es ajena o no existe.
 */
export async function calificarCompra(token: string, numero: string, calificacion: NuevaCalificacion): Promise<Compra> {
  const { compra } = await pedir<{ compra: Compra }>(`/compradores/compras/${encodeURIComponent(numero)}/calificacion`, {
    metodo: 'POST',
    body: calificacion,
    token,
    ...COMPRADOR,
  });
  return compra;
}

/** Compra a recordar en Explorar: Utilizada sin calificar del evento más reciente, o null (feature 006, research R7). */
export async function obtenerPendienteDeCalificar(token: string): Promise<Compra | null> {
  const { compra } = await pedir<{ compra: Compra | null }>('/compradores/calificaciones/pendiente', { token, ...COMPRADOR });
  return compra;
}
