import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { desmarcarFavorito, marcarFavorito } from '@/api/compradores';
import { color, radius, shadow, size, space, type } from '@/theme/tokens';

const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';
/** Cuánto se ve el aviso de error antes de irse solo. */
const DURACION_AVISO_MS = 4000;

type Contexto = {
  /** Estado del corazón: lo que el comprador eligió en esta sesión o, si no tocó nada, lo que dijo el servidor. */
  esFavorito: (eventoId: string, segunServidor: boolean) => boolean;
  alternar: (eventoId: string, segunServidor: boolean) => void;
};

const ContextoFavoritos = createContext<Contexto | null>(null);

/**
 * Estado compartido del corazón de favorito entre Explorar, Detalle y Favoritos (research R13).
 * Cambia al instante (optimista) y manda PUT/DELETE, que son idempotentes. Si el comprador toca de
 * nuevo mientras hay un pedido en curso, al terminar se manda solo el estado final. Si falla, vuelve
 * al último estado confirmado y muestra el aviso de conexión.
 */
export function FavoritosProvider({ token, children }: { token: string; children: ReactNode }) {
  // Solo los eventos que el comprador tocó en esta sesión; el resto usa el valor del servidor.
  const [elegidos, setElegidos] = useState<ReadonlyMap<string, boolean>>(new Map());
  const [aviso, setAviso] = useState<string | null>(null);
  const confirmados = useRef(new Map<string, boolean>());
  const deseados = useRef(new Map<string, boolean>());
  const enCurso = useRef(new Set<string>());

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(espera);
  }, [aviso]);

  const elegir = useCallback((eventoId: string, valor: boolean) => {
    setElegidos((actual) => new Map(actual).set(eventoId, valor));
  }, []);

  const enviar = useCallback(
    async (eventoId: string) => {
      enCurso.current.add(eventoId);
      try {
        // Si el comprador volvió a tocar mientras se enviaba, se manda el estado final.
        for (;;) {
          const valor = deseados.current.get(eventoId)!;
          await (valor ? marcarFavorito(token, eventoId) : desmarcarFavorito(token, eventoId));
          confirmados.current.set(eventoId, valor);
          if (deseados.current.get(eventoId) === valor) break;
        }
      } catch {
        // Un 401 ya borró la sesión (pedir → SesionProvider); para el resto, se revierte.
        const anterior = confirmados.current.get(eventoId)!;
        deseados.current.set(eventoId, anterior);
        elegir(eventoId, anterior);
        setAviso(SIN_CONEXION);
      } finally {
        enCurso.current.delete(eventoId);
      }
    },
    [token, elegir],
  );

  const esFavorito = useCallback(
    (eventoId: string, segunServidor: boolean) => elegidos.get(eventoId) ?? segunServidor,
    [elegidos],
  );

  const alternar = useCallback(
    (eventoId: string, segunServidor: boolean) => {
      if (!confirmados.current.has(eventoId)) confirmados.current.set(eventoId, segunServidor);
      const nuevo = !(deseados.current.get(eventoId) ?? elegidos.get(eventoId) ?? segunServidor);
      deseados.current.set(eventoId, nuevo);
      elegir(eventoId, nuevo);
      if (!enCurso.current.has(eventoId)) void enviar(eventoId);
    },
    [elegidos, elegir, enviar],
  );

  const valor = useMemo(() => ({ esFavorito, alternar }), [esFavorito, alternar]);

  return (
    <ContextoFavoritos.Provider value={valor}>
      {children}
      {aviso ? <Aviso texto={aviso} /> : null}
    </ContextoFavoritos.Provider>
  );
}

function Aviso({ texto }: { texto: string }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      style={[styles.aviso, { bottom: bottom + size.tabHeight + space.s6 }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none">
      <Text style={[type.bodySm, { color: color.text }]}>{texto}</Text>
    </View>
  );
}

export function useFavoritos() {
  const contexto = useContext(ContextoFavoritos);
  if (!contexto) throw new Error('useFavoritos se usa dentro de FavoritosProvider');
  return contexto;
}

const styles = StyleSheet.create({
  aviso: {
    position: 'absolute',
    left: space.padScreenX,
    right: space.padScreenX,
    padding: space.padCard,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    boxShadow: shadow.md,
  },
});
