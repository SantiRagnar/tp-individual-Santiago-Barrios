import * as SecureStore from 'expo-secure-store';

import type { TipoDeCuenta } from '@/api/cliente';

// Android/iOS: la sesión se guarda cifrada (research R10). En web se usa almacenamientoSesion.web.ts.
const clave = (tipo: TipoDeCuenta) => `sesion.${tipo}`;

export async function leer<T>(tipo: TipoDeCuenta): Promise<T | null> {
  try {
    const texto = await SecureStore.getItemAsync(clave(tipo));
    return texto ? (JSON.parse(texto) as T) : null;
  } catch {
    return null;
  }
}

export async function guardar(tipo: TipoDeCuenta, datos: unknown): Promise<void> {
  try {
    await SecureStore.setItemAsync(clave(tipo), JSON.stringify(datos));
  } catch {
    // Si no se puede guardar, la sesión vale igual hasta cerrar la app.
  }
}

export async function borrar(tipo: TipoDeCuenta): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(clave(tipo));
  } catch {
    // Nada que hacer: si no existía, ya está borrada.
  }
}
