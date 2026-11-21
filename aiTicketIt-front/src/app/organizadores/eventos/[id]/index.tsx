import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { obtenerEvento, type Evento } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { TagEstado } from '@/components/ds/Tag';
import { Volver } from '@/components/ds/Volver';
import { fechaCorta } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'no-encontrado' }
  | { tipo: 'error' }
  | { tipo: 'listo'; evento: Evento };

/**
 * Organizadores 04 · Detalle del evento, versión mínima (FR-021; contracts/rutas-front.md § Organizadores 04).
 * Disponibilidad, Recaudado y Ventas llegan con su propia feature.
 */
export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizador } = useSesion();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const token = organizador?.token;

  const cargar = useCallback(async () => {
    if (!token || !id) return;
    try {
      setEstado({ tipo: 'listo', evento: await obtenerEvento(token, id) });
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO') setEstado({ tipo: 'no-encontrado' });
      else setEstado({ tipo: 'error' });
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (!organizador) return null;

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/organizadores/mis-eventos'));

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <Volver onPress={volver} />
        {estado.tipo === 'cargando' ? <ActivityIndicator color={color.accent} style={styles.cargando} /> : null}

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
            <Text style={[type.bodySm, { color: color.text }]}>No pudimos conectarnos. Probá de nuevo en un rato.</Text>
            <Button variante="secondary" compacto onPress={() => void cargar()}>
              Reintentar
            </Button>
          </View>
        ) : null}

        {estado.tipo === 'listo' ? <Cabecera evento={estado.evento} /> : null}
      </ScrollView>
    </View>
  );
}

function Cabecera({ evento }: { evento: Evento }) {
  return (
    <View style={styles.pageHead}>
      <View style={styles.titulo}>
        <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
          {evento.nombre ?? 'Nombre del evento'}
        </Text>
        <View style={styles.subtitulo}>
          <Text style={[type.bodySm, { color: color.textMuted }]}>
            {fechaCorta(evento.fechaHora)} · {evento.ubicacion ?? 'Ubicación'}
          </Text>
          <TagEstado estado={evento.estado} />
        </View>
      </View>
      <View style={styles.acciones}>
        {evento.estado === 'Finalizado' ? null : (
          <Button
            variante="secondary"
            compacto
            onPress={() => router.push({ pathname: '/organizadores/eventos/[id]/editar', params: { id: evento.id } })}>
            Editar evento
          </Button>
        )}
        {/* Sin contador: las consultas llegan con su propia feature (FR-021). */}
        <Button variante="secondary" compacto disabled>
          Consultas del evento
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { padding: space.padPageDesktop, gap: space.s6 },
  cargando: { alignSelf: 'flex-start' },
  bloque: { gap: space.s4, alignItems: 'flex-start' },
  pageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.s6,
    flexWrap: 'wrap',
  },
  titulo: { gap: space.s2, flexShrink: 1 },
  subtitulo: { flexDirection: 'row', alignItems: 'center', gap: space.s3, flexWrap: 'wrap' },
  acciones: { flexDirection: 'row', gap: space.s3, flexWrap: 'wrap' },
});
