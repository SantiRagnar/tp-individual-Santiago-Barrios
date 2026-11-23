import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Corre `tarea` cada `cadaMs` mientras la pantalla está enfocada y la app en primer plano
 * (specs/007-consultas-chat/research.md R3). Nunca hay dos ejecuciones a la vez: el siguiente intento
 * se agenda cuando termina el anterior. Los errores se ignoran: el próximo intento reintenta.
 */
export function useSondeo(tarea: () => Promise<unknown>, { cadaMs = 3000, activo = true }: { cadaMs?: number; activo?: boolean } = {}) {
  // La última versión de la tarea, sin reiniciar el ciclo cuando cambia.
  const tareaActual = useRef(tarea);
  useEffect(() => {
    tareaActual.current = tarea;
  }, [tarea]);

  useFocusEffect(
    useCallback(() => {
      if (!activo) return undefined;
      let vigente = true;
      let temporizador: ReturnType<typeof setTimeout> | null = null;
      let enPrimerPlano = AppState.currentState === 'active' || AppState.currentState == null;

      const agendar = () => {
        if (vigente) temporizador = setTimeout(ciclo, cadaMs);
      };
      const ciclo = async () => {
        temporizador = null;
        if (!vigente) return;
        if (enPrimerPlano) {
          try {
            await tareaActual.current();
          } catch {
            // Se reintenta en el próximo ciclo.
          }
        }
        agendar();
      };

      const suscripcion = AppState.addEventListener('change', (estado) => {
        enPrimerPlano = estado === 'active';
      });
      agendar();

      return () => {
        vigente = false;
        if (temporizador) clearTimeout(temporizador);
        suscripcion.remove();
      };
    }, [activo, cadaMs]),
  );
}
