import type { TipoDeCuenta } from '@/api/cliente';

// Web: expo-secure-store no está disponible, se usa localStorage (research R10).
// Puede fallar (modo privado, almacenamiento bloqueado): en ese caso la sesión dura hasta recargar.
const clave = (tipo: TipoDeCuenta) => `sesion.${tipo}`;

export async function leer<T>(tipo: TipoDeCuenta): Promise<T | null> {
  try {
    const texto = globalThis.localStorage?.getItem(clave(tipo));
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

export async function guardar(tipo: TipoDeCuenta, datos: unknown): Promise<void> {
  try {
    globalThis.localStorage?.setItem(clave(tipo), JSON.stringify(datos));
  } catch {
    // Sin almacenamiento: la sesión vale hasta recargar la página.
  }
}

export async function borrar(tipo: TipoDeCuenta): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(clave(tipo));
  } catch {
    // Nada que hacer.
  }
}
