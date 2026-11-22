import { pedir } from '@/api/cliente';
import type { EstadoCompra } from '@/api/compras';

// specs/007-consultas-chat/contracts/consultas.openapi.yaml. Ningún GET marca como leída (research R4).

export type AutorMensaje = 'comprador' | 'organizador';

export type Mensaje = { id: string; autor: AutorMensaje; texto: string; enviadoEn: string };

/** Fila de Consultas del evento y cabecera del chat del organizador. `noLeida` es la del organizador. */
export type ConsultaResumen = {
  numero: string;
  comprador: { nombre: string };
  tipoDeEntrada: { nombre: string | null };
  cantidad: number;
  monto: number;
  estado: EstadoCompra;
  ultimoMensaje: Mensaje | null;
  noLeida: boolean;
};

/** Chat con una respuesta del organizador que el comprador todavía no leyó (toast). */
export type ConsultaNoLeida = {
  numero: string;
  evento: { id: string; nombre: string };
  organizador: { nombre: string };
  ultimoMensaje: Mensaje;
};

const COMPRADOR = { tipo: 'comprador' as const };
const ORGANIZADOR = { tipo: 'organizador' as const };
const conDespuesDe = (ruta: string, despuesDe?: string | null) =>
  despuesDe ? `${ruta}?despuesDe=${encodeURIComponent(despuesDe)}` : ruta;
const deCompra = (numero: string) => `/compradores/compras/${encodeURIComponent(numero)}/mensajes`;
const deEvento = (eventoId: string) => `/organizadores/eventos/${encodeURIComponent(eventoId)}/consultas`;

// ── Comprador ──

/** Mensajes del chat de la compra; con `despuesDe`, solo los posteriores (sondeo). */
export async function listarMensajes(token: string, numero: string, despuesDe?: string | null): Promise<Mensaje[]> {
  const { mensajes } = await pedir<{ mensajes: Mensaje[] }>(conDespuesDe(deCompra(numero), despuesDe), { token, ...COMPRADOR });
  return mensajes;
}

export async function enviarMensaje(token: string, numero: string, texto: string): Promise<Mensaje> {
  const { mensaje } = await pedir<{ mensaje: Mensaje }>(deCompra(numero), { metodo: 'POST', body: { texto }, token, ...COMPRADOR });
  return mensaje;
}

export async function marcarLeida(token: string, numero: string): Promise<void> {
  await pedir<void>(`${deCompra(numero)}/lectura`, { metodo: 'PUT', token, ...COMPRADOR });
}

export async function listarNoLeidas(token: string): Promise<ConsultaNoLeida[]> {
  const { consultas } = await pedir<{ consultas: ConsultaNoLeida[] }>('/compradores/consultas/no-leidas', { token, ...COMPRADOR });
  return consultas;
}

// ── Organizador ──

export async function listarConsultasDelEvento(
  token: string,
  eventoId: string,
): Promise<{ consultas: ConsultaResumen[]; noLeidas: number }> {
  return pedir(deEvento(eventoId), { token, ...ORGANIZADOR });
}

/** Cabecera + mensajes de la consulta de una compra del evento (aunque no tenga mensajes). */
export async function obtenerConsulta(
  token: string,
  eventoId: string,
  numero: string,
  despuesDe?: string | null,
): Promise<{ consulta: ConsultaResumen; mensajes: Mensaje[] }> {
  return pedir(conDespuesDe(`${deEvento(eventoId)}/${encodeURIComponent(numero)}`, despuesDe), { token, ...ORGANIZADOR });
}

export async function responder(token: string, eventoId: string, numero: string, texto: string): Promise<Mensaje> {
  const { mensaje } = await pedir<{ mensaje: Mensaje }>(`${deEvento(eventoId)}/${encodeURIComponent(numero)}/mensajes`, {
    metodo: 'POST',
    body: { texto },
    token,
    ...ORGANIZADOR,
  });
  return mensaje;
}

export async function marcarLeidaOrganizador(token: string, eventoId: string, numero: string): Promise<void> {
  await pedir<void>(`${deEvento(eventoId)}/${encodeURIComponent(numero)}/lectura`, { metodo: 'PUT', token, ...ORGANIZADOR });
}
