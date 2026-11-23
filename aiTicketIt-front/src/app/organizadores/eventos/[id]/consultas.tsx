import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import {
  listarConsultasDelEvento,
  marcarLeidaOrganizador,
  obtenerConsulta,
  responder,
  type ConsultaResumen,
  type Mensaje,
} from '@/api/consultas';
import { obtenerEvento } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { ChatMensajes } from '@/components/ds/ChatMensajes';
import { CompositorChat } from '@/components/ds/CompositorChat';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { EstadoVacio } from '@/components/ds/EstadoVacio';
import { ListaConversaciones } from '@/components/ds/ListaConversaciones';
import { SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { TagCompra } from '@/components/ds/Tag';
import { Volver } from '@/components/ds/Volver';
import { useSondeo } from '@/hooks/useSondeo';
import { entradasDeCompra, numeroCompra, plata } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, radius, shadow, space, type } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'no-encontrado' }
  | { tipo: 'error' }
  | { tipo: 'listo'; nombreEvento: string; consultas: ConsultaResumen[] };

type Abierta = { consulta: ConsultaResumen; mensajes: Mensaje[] } | null;

/**
 * Organizadores 05 · Consultas del evento (specs/007-consultas-chat/contracts/rutas-front.md).
 * `?compra=A-1042` abre esa consulta (desde Ventas, aunque no tenga mensajes). Abrir una consulta la marca
 * como leída; entrar sin elegir no marca ninguna (US3). Lista y consulta abierta se actualizan cada 3 s.
 */
export default function ConsultasDelEvento() {
  const { id, compra } = useLocalSearchParams<{ id: string; compra?: string }>();
  const { organizador } = useSesion();
  const token = organizador?.token ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [abierta, setAbierta] = useState<Abierta>(null);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const seleccionada = compra ?? null;
  const ultimoId = useRef<string | null>(null);

  const cargar = useCallback(
    async (vigente: () => boolean = () => true) => {
      try {
        const [evento, { consultas }] = await Promise.all([obtenerEvento(token, id), listarConsultasDelEvento(token, id)]);
        if (vigente()) setEstado({ tipo: 'listo', nombreEvento: evento.nombre ?? 'Nombre del evento', consultas });
      } catch (error) {
        if (!vigente()) return;
        if (error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO') setEstado({ tipo: 'no-encontrado' });
        else setEstado((e) => (e.tipo === 'listo' ? e : { tipo: 'error' }));
      }
    },
    [token, id],
  );

  /** Marca leída en el servidor y en la lista local, sin esperar al sondeo (FR-016). */
  const marcarLeidaLocal = useCallback(
    (numero: string) => {
      void marcarLeidaOrganizador(token, id, numero).catch(() => {});
      setEstado((e) =>
        e.tipo === 'listo' ? { ...e, consultas: e.consultas.map((c) => (c.numero === numero ? { ...c, noLeida: false } : c)) } : e,
      );
    },
    [token, id],
  );

  const abrir = useCallback(
    async (numero: string, vigente: () => boolean = () => true) => {
      setErrorEnvio(null);
      try {
        const respuesta = await obtenerConsulta(token, id, numero);
        if (!vigente()) return;
        ultimoId.current = respuesta.mensajes.at(-1)?.id ?? null;
        setAbierta(respuesta);
        marcarLeidaLocal(numero);
      } catch (error) {
        if (!vigente()) return;
        // Una compra que no es de este evento se ignora: queda sin consulta elegida (FR-014).
        if (error instanceof ErrorApi && error.codigo === 'COMPRA_NO_ENCONTRADA') router.setParams({ compra: undefined });
        setAbierta(null);
      }
    },
    [token, id, marcarLeidaLocal],
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void cargar(() => vigente);
      if (seleccionada) void abrir(seleccionada, () => vigente);
      else setAbierta(null);
      return () => {
        vigente = false;
      };
    }, [cargar, abrir, seleccionada]),
  );

  // Sondeo: lista (orden, últimos mensajes, puntos) y mensajes nuevos de la consulta abierta (FR-021).
  useSondeo(
    useCallback(async () => {
      const { consultas } = await listarConsultasDelEvento(token, id);
      let llegoDelComprador = false;
      if (seleccionada) {
        const { consulta, mensajes } = await obtenerConsulta(token, id, seleccionada, ultimoId.current);
        if (mensajes.length > 0) ultimoId.current = mensajes.at(-1)!.id;
        llegoDelComprador = mensajes.some((m) => m.autor === 'comprador');
        setAbierta((a) => {
          if (!a || a.consulta.numero !== consulta.numero) return a;
          const conocidos = new Set(a.mensajes.map((m) => m.id));
          return { consulta, mensajes: [...a.mensajes, ...mensajes.filter((m) => !conocidos.has(m.id))] };
        });
      }
      setEstado((e) => (e.tipo === 'listo' ? { ...e, consultas } : e));
      // Si la consulta abierta recibió mensajes del comprador, queda leída.
      if (seleccionada && (llegoDelComprador || consultas.some((c) => c.numero === seleccionada && c.noLeida))) {
        marcarLeidaLocal(seleccionada);
      }
    }, [token, id, seleccionada, marcarLeidaLocal]),
    { activo: estado.tipo === 'listo' },
  );

  const enviar = async (texto: string) => {
    if (!abierta) return false;
    setErrorEnvio(null);
    try {
      const mensaje = await responder(token, id, abierta.consulta.numero, texto);
      ultimoId.current = mensaje.id;
      const actualizada = { ...abierta.consulta, ultimoMensaje: mensaje, noLeida: false };
      setAbierta((a) => (a ? { consulta: actualizada, mensajes: [...a.mensajes, mensaje] } : a));
      // La consulta sube primera en la lista (US2, escenario 5; US4, escenario 4).
      setEstado((e) =>
        e.tipo === 'listo' ? { ...e, consultas: [actualizada, ...e.consultas.filter((c) => c.numero !== actualizada.numero)] } : e,
      );
      return true;
    } catch (error) {
      if (!(error instanceof ErrorApi && error.codigo === 'SESION_INVALIDA')) {
        setErrorEnvio(error instanceof ErrorApi && error.codigo === 'DATOS_INVALIDOS' ? (error.campos[0]?.mensaje ?? error.message) : SIN_CONEXION);
      }
      return false;
    }
  };

  if (!organizador) return null;

  const volver = () =>
    router.canGoBack() ? router.back() : router.replace({ pathname: '/organizadores/eventos/[id]', params: { id } });

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <View style={styles.contenido}>
        <Volver onPress={volver} />
        {estado.tipo === 'cargando' ? <ActivityIndicator color={color.accent} style={styles.alInicio} /> : null}
        {estado.tipo === 'no-encontrado' ? (
          <View style={styles.bloque} accessibilityLiveRegion="polite">
            <Text style={[type.body, { color: color.text }]}>No encontramos el evento.</Text>
            <Link href="/organizadores/mis-eventos">
              <Text style={[type.bodySm, { color: color.accent }]}>Ir a Mis eventos</Text>
            </Link>
          </View>
        ) : null}
        {estado.tipo === 'error' ? (
          <View style={styles.bloque} accessibilityLiveRegion="polite">
            <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
            <Button
              variante="secondary"
              compacto
              onPress={() => {
                setEstado({ tipo: 'cargando' });
                void cargar();
              }}>
              Reintentar
            </Button>
          </View>
        ) : null}

        {estado.tipo === 'listo' ? (
          <>
            <View style={styles.titulo}>
              <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
                Consultas del evento
              </Text>
              <Text style={[type.bodySm, { color: color.textMuted }]}>{estado.nombreEvento}</Text>
            </View>

            {estado.consultas.length === 0 && !seleccionada ? (
              <EstadoVacio titulo="Todavía no hay consultas" texto="Cuando un comprador escriba, vas a verla acá." />
            ) : (
              <View style={styles.columnas}>
                <ListaConversaciones
                  consultas={estado.consultas}
                  seleccionada={seleccionada}
                  onElegir={(numero) => router.setParams({ compra: numero })}
                />
                <View style={styles.chat}>
                  {!seleccionada ? (
                    <View style={styles.sinElegir}>
                      <Text style={[type.bodySm, { color: color.textMuted }]}>Elegí una conversación para ver los mensajes.</Text>
                    </View>
                  ) : !abierta || abierta.consulta.numero !== seleccionada ? (
                    <ActivityIndicator color={color.accent} style={styles.centrado} />
                  ) : (
                    <>
                      <CabeceraConsulta consulta={abierta.consulta} />
                      <ChatMensajes
                        key={abierta.consulta.numero}
                        mensajes={abierta.mensajes}
                        propio="organizador"
                        vacio={
                          <Text style={[type.bodySm, styles.vacioTexto]}>{`Todavía no hay mensajes con ${abierta.consulta.comprador.nombre}.`}</Text>
                        }
                      />
                      <CompositorChat
                        key={`compositor-${abierta.consulta.numero}`}
                        variante="desktop"
                        placeholder={`Responder a ${abierta.consulta.comprador.nombre}`}
                        onEnviar={enviar}
                        error={errorEnvio}
                      />
                    </>
                  )}
                </View>
              </View>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
}

function CabeceraConsulta({ consulta }: { consulta: ConsultaResumen }) {
  return (
    <View style={styles.cabecera}>
      <View style={styles.cabeceraTextos}>
        <Text style={[type.h5, { color: color.text }]} numberOfLines={1}>
          {consulta.comprador.nombre}
        </Text>
        <Text style={[type.caption, { color: color.textMuted }]}>
          {`Compra ${numeroCompra(consulta.numero)} · ${entradasDeCompra(consulta.tipoDeEntrada.nombre, consulta.cantidad)} · ${plata(consulta.monto)}`}
        </Text>
      </View>
      <TagCompra estado={consulta.estado} />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { flex: 1, padding: space.padPageDesktop, gap: space.s6 },
  alInicio: { alignSelf: 'flex-start' },
  bloque: { gap: space.s4, alignItems: 'flex-start' },
  titulo: { gap: space.s1 },
  columnas: { flex: 1, flexDirection: 'row', gap: space.gapGrid, minHeight: 0 },
  chat: { flex: 1, minWidth: 0, borderRadius: radius.lg, backgroundColor: color.bg, boxShadow: shadow.sm, overflow: 'hidden' },
  sinElegir: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.s8 },
  centrado: { flex: 1 },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s4,
    paddingHorizontal: space.padScreenX,
    paddingVertical: space.s4,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  cabeceraTextos: { flex: 1, gap: space.s1 },
  vacioTexto: { color: color.textMuted, textAlign: 'center' },
});
