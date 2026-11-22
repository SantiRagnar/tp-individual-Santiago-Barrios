import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { obtenerCompra, type Compra } from '@/api/compras';
import { enviarMensaje, listarMensajes, marcarLeida, type Mensaje } from '@/api/consultas';
import { AppBar } from '@/components/ds/AppBar';
import { ChatMensajes } from '@/components/ds/ChatMensajes';
import { CompositorChat } from '@/components/ds/CompositorChat';
import { EstadoVacio } from '@/components/ds/EstadoVacio';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { useSondeo } from '@/hooks/useSondeo';
import { numeroCompra } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'noEncontrada' }
  | { tipo: 'error' }
  | { tipo: 'listo'; compra: Compra; mensajes: Mensaje[] };

/**
 * Compradores 10 · Chat de la compra (specs/007-consultas-chat/contracts/rutas-front.md).
 * Al enfocarse carga y marca como leída; mientras está abierta, trae los mensajes nuevos cada 3 s (FR-021).
 */
export default function ChatDeLaCompra() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  // Último id conocido, para el sondeo incremental (despuesDe).
  const ultimoId = useRef<string | null>(null);

  const agregar = useCallback((nuevos: Mensaje[]) => {
    if (nuevos.length === 0) return;
    ultimoId.current = nuevos.at(-1)!.id;
    setEstado((e) => {
      if (e.tipo !== 'listo') return e;
      const conocidos = new Set(e.mensajes.map((m) => m.id));
      return { ...e, mensajes: [...e.mensajes, ...nuevos.filter((m) => !conocidos.has(m.id))] };
    });
  }, []);

  const cargar = useCallback(
    (vigente: () => boolean = () => true) =>
      Promise.all([obtenerCompra(token, numero), listarMensajes(token, numero)]).then(
        ([compra, mensajes]) => {
          if (!vigente()) return;
          ultimoId.current = mensajes.at(-1)?.id ?? null;
          setEstado({ tipo: 'listo', compra, mensajes });
          void marcarLeida(token, numero).catch(() => {});
        },
        (error) => {
          if (!vigente()) return;
          const noEncontrada = error instanceof ErrorApi && error.codigo === 'COMPRA_NO_ENCONTRADA';
          setEstado((e) => (noEncontrada ? { tipo: 'noEncontrada' } : e.tipo === 'listo' ? e : { tipo: 'error' }));
        },
      ),
    [token, numero],
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void cargar(() => vigente);
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  // Mensajes nuevos del organizador sin tocar nada; si llegan, el chat queda leído (FR-021, FR-022).
  useSondeo(
    useCallback(async () => {
      const nuevos = await listarMensajes(token, numero, ultimoId.current);
      agregar(nuevos);
      if (nuevos.some((m) => m.autor === 'organizador')) await marcarLeida(token, numero);
    }, [token, numero, agregar]),
    { activo: estado.tipo === 'listo' },
  );

  const enviar = async (texto: string) => {
    setErrorEnvio(null);
    try {
      agregar([await enviarMensaje(token, numero, texto)]);
      return true;
    } catch (error) {
      if (!(error instanceof ErrorApi && error.codigo === 'SESION_INVALIDA')) {
        setErrorEnvio(error instanceof ErrorApi && error.codigo === 'DATOS_INVALIDOS' ? (error.campos[0]?.mensaje ?? error.message) : SIN_CONEXION);
      }
      return false;
    }
  };

  const volver = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/compras/[numero]', params: { numero } }));

  if (estado.tipo === 'cargando') return <PantallaCargando etiqueta="Cargando la consulta" />;
  if (estado.tipo === 'noEncontrada') {
    return <PantallaDeAviso mensaje="No encontramos esta compra." accion="Volver a Mis compras" onAccion={() => router.dismissTo('/mis-compras')} />;
  }
  if (estado.tipo === 'error') {
    return (
      <PantallaDeAviso
        mensaje={SIN_CONEXION}
        accion="Reintentar"
        onAccion={() => {
          setEstado({ tipo: 'cargando' });
          void cargar();
        }}
      />
    );
  }

  const { compra, mensajes } = estado;
  const organizador = compra.evento.organizador.nombre;

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'bottom']}>
      <AppBar titulo={compra.evento.nombre} subtitulo={`${organizador} · Compra ${numeroCompra(compra.numero)}`} onVolver={volver} />
      <KeyboardAvoidingView style={styles.cuerpo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ChatMensajes
          mensajes={mensajes}
          propio="comprador"
          vacio={<EstadoVacio titulo="Todavía no hay mensajes" texto={`Escribí tu consulta y ${organizador} te va a responder acá.`} />}
        />
        <CompositorChat variante="mobile" placeholder="Escribí tu consulta" onEnviar={enviar} error={errorEnvio} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  cuerpo: { flex: 1 },
});
