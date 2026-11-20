export type TipoDeCuenta = 'comprador' | 'organizador';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Error que devuelve la API ({ error: { codigo, mensaje } }) o una falla de red (codigo "RED"). */
export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly status?: number,
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
  metodo?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  token?: string;
  /** Tipo de cuenta del token: si la API responde SESION_INVALIDA, se avisa para borrar esa sesión. */
  tipo?: TipoDeCuenta;
};

export async function pedir<T>(ruta: string, { metodo = 'GET', body, token, tipo }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ErrorApi('RED', 'No pudimos conectarnos.');
  }

  if (respuesta.status === 204) return undefined as T;

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const codigo = datos?.error?.codigo ?? 'ERROR_INTERNO';
    const mensaje = datos?.error?.mensaje ?? 'Ocurrió un error inesperado.';
    if (codigo === 'SESION_INVALIDA' && token && tipo) alInvalidarSesion?.(tipo);
    throw new ErrorApi(codigo, mensaje, respuesta.status);
  }
  return datos as T;
}
