import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { configurarAlInvalidarSesion, ErrorApi, type TipoDeCuenta } from '@/api/cliente';
import { cerrarSesion as cerrarSesionApi, obtenerSesionActual } from '@/api/sesiones';
import * as almacenamiento from '@/sesion/almacenamientoSesion';

// data-model.md § "Estado de sesión en el front"
export type CompradorSesion = { id: string; nombre: string; apellido: string; email: string };
export type OrganizadorSesion = { id: string; nombre: string; email: string };

export type SesionComprador = { token: string; comprador: CompradorSesion };
export type SesionOrganizador = { token: string; organizador: OrganizadorSesion };

type DatosPorTipo = { comprador: SesionComprador; organizador: SesionOrganizador };

type Estado = {
  comprador: SesionComprador | null;
  organizador: SesionOrganizador | null;
};

type ContextoSesion = Estado & {
  /** true mientras se leen y validan las sesiones guardadas al abrir la app. */
  cargando: boolean;
  iniciar: <T extends TipoDeCuenta>(tipo: T, datos: DatosPorTipo[T]) => void;
  limpiar: (tipo: TipoDeCuenta) => void;
  /** Cierra la sesión en el backend y la borra del dispositivo (FR-018). Sin interfaz en esta feature. */
  cerrarSesion: (tipo: TipoDeCuenta) => Promise<void>;
};

const TIPOS: TipoDeCuenta[] = ['comprador', 'organizador'];

const Contexto = createContext<ContextoSesion | null>(null);

/**
 * Valida una sesión guardada (research R11): 401 → se descarta; error de red → se conserva
 * y la próxima operación decide; 200 → se actualizan los datos del usuario.
 */
async function validarGuardada<T extends TipoDeCuenta>(tipo: T, guardada: DatosPorTipo[T] | null) {
  if (!guardada) return null;
  try {
    const actual = await obtenerSesionActual(tipo, guardada.token);
    return { ...guardada, ...actual } as DatosPorTipo[T];
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === 'RED') return guardada;
    await almacenamiento.borrar(tipo);
    return null;
  }
}

/** Las dos sesiones son independientes: cada lado de la app usa solo la suya. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ comprador: null, organizador: null });
  const [cargando, setCargando] = useState(true);

  const limpiar = useCallback((tipo: TipoDeCuenta) => {
    setEstado((e) => ({ ...e, [tipo]: null }));
    void almacenamiento.borrar(tipo);
  }, []);

  const iniciar = useCallback(<T extends TipoDeCuenta>(tipo: T, datos: DatosPorTipo[T]) => {
    setEstado((e) => ({ ...e, [tipo]: datos }));
    void almacenamiento.guardar(tipo, datos);
  }, []);

  // Una respuesta SESION_INVALIDA de cualquier llamada borra esa sesión; el guard lleva al Ingreso.
  useEffect(() => {
    configurarAlInvalidarSesion(limpiar);
    return () => configurarAlInvalidarSesion(null);
  }, [limpiar]);

  // Al abrir la app: leer y validar las sesiones guardadas (FR-017).
  useEffect(() => {
    let activo = true;
    (async () => {
      const [comprador, organizador] = await Promise.all(
        TIPOS.map(async (tipo) =>
          validarGuardada(tipo, await almacenamiento.leer<DatosPorTipo[typeof tipo]>(tipo)),
        ),
      );
      if (!activo) return;
      setEstado({
        comprador: comprador as SesionComprador | null,
        organizador: organizador as SesionOrganizador | null,
      });
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const cerrarSesion = useCallback(
    async (tipo: TipoDeCuenta) => {
      const token = estado[tipo]?.token;
      if (token) {
        try {
          await cerrarSesionApi(tipo, token);
        } catch {
          // Si el backend no responde o la sesión ya no valía, igual se borra del dispositivo.
        }
      }
      limpiar(tipo);
    },
    [estado, limpiar],
  );

  const valor = useMemo(
    () => ({ ...estado, cargando, iniciar, limpiar, cerrarSesion }),
    [estado, cargando, iniciar, limpiar, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSesion se usa dentro de SesionProvider');
  return contexto;
}
