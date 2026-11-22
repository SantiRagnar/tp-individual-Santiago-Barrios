export type TipoDeCuenta = 'comprador' | 'organizador';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type ErrorDeCampo = { campo: string; mensaje: string };

/** Error que devuelve la API ({ error: { codigo, mensaje, campos? } }) o una falla de red (codigo "RED"). */
export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly status?: number,
    public readonly campos: ErrorDeCampo[] = [],
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

// Lo registra SesionProvider: borra la sesión de ese tipo y el guard lleva al Ingreso (US4, escenario 4).
let alInvalidarSesion: ((tipo: TipoDeCuenta) => void) | null = null;

export function configurarAlInvalidarSesion(callback: ((tipo: TipoDeCuenta) => void) | null) {
  alInvalidarSesion = callback;
}

type Opciones = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** JSON (se serializa) o un Blob, que viaja crudo con su propio Content-Type (imagen del evento). */
  body?: unknown;
  token?: string;
  /** Tipo de cuenta del token: si la API responde SESION_INVALIDA, se avisa para borrar esa sesión. */
  tipo?: TipoDeCuenta;
  /** Content-Type de un body binario, si el Blob no lo trae (en nativo, fetch(uri).blob() puede venir sin tipo). */
  tipoContenido?: string;
  /** Para cancelar el pedido (research R12 de la feature 003): un pedido cancelado lanza ErrorApi('CANCELADO'). */
  signal?: AbortSignal;
};

export async function pedir<T>(ruta: string, { metodo = 'GET', body, token, tipo, tipoContenido, signal }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const esBinario = typeof Blob !== 'undefined' && body instanceof Blob;
  if (esBinario) headers['Content-Type'] = tipoContenido ?? body.type;
  else if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: body === undefined ? undefined : esBinario ? body : JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal?.aborted) throw new ErrorApi('CANCELADO', 'Pedido cancelado.');
    throw new ErrorApi('RED', 'No pudimos conectarnos.');
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const codigo = datos?.error?.codigo ?? 'ERROR_INTERNO';
    const mensaje = datos?.error?.mensaje ?? 'Ocurrió un error inesperado.';
    if (codigo === 'SESION_INVALIDA' && token && tipo) alInvalidarSesion?.(tipo);
    throw new ErrorApi(codigo, mensaje, respuesta.status, datos?.error?.campos ?? []);
  }
  return datos as T;
}
