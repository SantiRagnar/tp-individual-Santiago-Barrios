import { pedir, type TipoDeCuenta } from '@/api/cliente';
import type { CompradorSesion, OrganizadorSesion } from '@/sesion/SesionProvider';

// contracts/sesiones.openapi.yaml
const RUTA: Record<TipoDeCuenta, string> = {
  comprador: '/compradores/sesiones',
  organizador: '/organizadores/sesiones',
};

export type RespuestaIngreso<T extends TipoDeCuenta> = T extends 'comprador'
  ? { token: string; comprador: CompradorSesion }
  : { token: string; organizador: OrganizadorSesion };

export function ingresar<T extends TipoDeCuenta>(tipo: T, email: string, contrasena: string) {
  return pedir<RespuestaIngreso<T>>(RUTA[tipo], { metodo: 'POST', body: { email, contrasena } });
}

export type RespuestaSesionActual<T extends TipoDeCuenta> = T extends 'comprador'
  ? { comprador: CompradorSesion }
  : { organizador: OrganizadorSesion };

/** Verifica que el token siga valiendo (GET /{tipo}/sesiones/actual). */
export function obtenerSesionActual<T extends TipoDeCuenta>(tipo: T, token: string) {
  return pedir<RespuestaSesionActual<T>>(`${RUTA[tipo]}/actual`, { token, tipo });
}

/** Cierra la sesión (DELETE /{tipo}/sesiones/actual, FR-018). Sin interfaz en esta feature. */
export function cerrarSesion(tipo: TipoDeCuenta, token: string) {
  return pedir<void>(`${RUTA[tipo]}/actual`, { metodo: 'DELETE', token, tipo });
}
