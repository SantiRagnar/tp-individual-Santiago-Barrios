import { router, usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, View, StyleSheet } from 'react-native';

import { listarNoLeidas, type ConsultaNoLeida } from '@/api/consultas';
import { Toast } from '@/components/ds/Toast';
import { numeroCompra } from '@/lib/formato';

const CADA_MS = 3000;

type Aviso = { clave: number; titulo: string; texto: string; destino: () => void };

/** `version` cambia cada vez que cambia el conjunto de consultas no leídas: Mis compras y el Detalle recargan. */
const ContextoAvisos = createContext<{ version: number }>({ version: 0 });

export function useAvisosDeConsultas() {
  return useContext(ContextoAvisos);
}

/** Clave de lo no leído: compra + último mensaje. Si cambia, hay algo nuevo o algo se leyó. */
const firma = (consultas: ConsultaNoLeida[]) => consultas.map((c) => `${c.numero}:${c.ultimoMensaje.id}`).sort().join('|');

/**
 * Avisos de respuestas del organizador en la app de compradores (specs/007-consultas-chat/research.md R9;
 * FR-024, FR-025). Pregunta cada 3 s, con la app en primer plano, qué chats tienen respuestas sin leer.
 * El primer resultado es la línea de base (no avisa lo que llegó antes de abrir la app). Después, cada
 * mensaje nuevo dispara a lo sumo un toast, salvo el del chat que está abierto.
 */
export function AvisosDeConsultasProvider({ token, children }: { token: string; children: ReactNode }) {
  const pathname = usePathname();
  const rutaActual = useRef(pathname);
  useEffect(() => {
    rutaActual.current = pathname;
  }, [pathname]);
  const avisados = useRef<Set<string> | null>(null); // ids de mensajes ya avisados; null = sin línea de base
  const ultimaFirma = useRef<string | null>(null);
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const revisar = useCallback(async () => {
    const consultas = await listarNoLeidas(token);

    const nuevaFirma = firma(consultas);
    if (ultimaFirma.current !== null && nuevaFirma !== ultimaFirma.current) setVersion((v) => v + 1);
    ultimaFirma.current = nuevaFirma;

    if (avisados.current === null) {
      avisados.current = new Set(consultas.map((c) => c.ultimoMensaje.id));
      return;
    }
    const nuevas = consultas.filter((c) => !avisados.current!.has(c.ultimoMensaje.id));
    nuevas.forEach((c) => avisados.current!.add(c.ultimoMensaje.id));
    // El chat abierto ya muestra el mensaje: no hace falta avisarlo (US6, escenario 5).
    const paraAvisar = nuevas.filter((c) => rutaActual.current !== `/compras/${c.numero}/consulta`);
    if (paraAvisar.length === 0) return;

    if (paraAvisar.length === 1) {
      const [c] = paraAvisar;
      setAviso({
        clave: Date.now(),
        titulo: `Nuevo mensaje de ${c.organizador.nombre}`,
        texto: `${c.evento.nombre} · Compra ${numeroCompra(c.numero)}`,
        destino: () => router.push({ pathname: '/compras/[numero]/consulta', params: { numero: c.numero } }),
      });
    } else {
      setAviso({
        clave: Date.now(),
        titulo: `Tenés ${paraAvisar.length} mensajes nuevos`,
        texto: 'Tocá para ver tus compras',
        destino: () => router.push('/mis-compras'),
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    let enPrimerPlano = AppState.currentState === 'active' || AppState.currentState == null;

    const ciclo = async () => {
      temporizador = null;
      if (!vigente) return;
      if (enPrimerPlano) {
        try {
          await revisar();
        } catch {
          // Sin conexión: se reintenta en el próximo ciclo, sin avisos.
        }
      }
      if (vigente) temporizador = setTimeout(ciclo, CADA_MS);
    };
    const suscripcion = AppState.addEventListener('change', (estado) => {
      enPrimerPlano = estado === 'active';
    });
    void ciclo();
    return () => {
      vigente = false;
      if (temporizador) clearTimeout(temporizador);
      suscripcion.remove();
    };
  }, [token, revisar]);

  const ocultar = useCallback(() => setAviso(null), []);

  return (
    <ContextoAvisos.Provider value={{ version }}>
      <View style={styles.contenedor}>
        {children}
        {aviso ? (
          <Toast
            key={aviso.clave}
            titulo={aviso.titulo}
            texto={aviso.texto}
            onOcultar={ocultar}
            onPress={() => {
              ocultar();
              aviso.destino();
            }}
          />
        ) : null}
      </View>
    </ContextoAvisos.Provider>
  );
}

const styles = StyleSheet.create({ contenedor: { flex: 1 } });
