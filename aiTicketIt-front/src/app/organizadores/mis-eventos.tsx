import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { listarMisEventos, type EventoResumen } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { EventManageCard, EventManageCardEsqueleto, NuevoEventoTile } from '@/components/ds/EventManageCard';
import { anchoDeCelda, columnasMisEventos } from '@/lib/grilla';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; eventos: EventoResumen[] };

const ESQUELETOS = 4;

function contador(n: number) {
  return n === 1 ? '1 evento' : `${n} eventos`;
}

/** Organizadores 02 · Mis eventos (contracts/rutas-front.md § Organizadores 02). */
export default function MisEventos() {
  const { organizador } = useSesion();
  const { width } = useWindowDimensions();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const token = organizador?.token;

  const cargar = useCallback(async () => {
    if (!token) return;
    setEstado((e) => (e.tipo === 'listo' ? e : { tipo: 'cargando' }));
    try {
      setEstado({ tipo: 'listo', eventos: await listarMisEventos(token) });
    } catch (error) {
      // Un 401 ya borró la sesión (pedir → SesionProvider); acá queda la falla de red u otra.
      const mensaje =
        error instanceof ErrorApi && error.codigo !== 'RED'
          ? error.message
          : 'No pudimos conectarnos. Probá de nuevo en un rato.';
      setEstado({ tipo: 'error', mensaje });
    }
  }, [token]);

  // Recarga cada vez que se vuelve a la pantalla (después de crear o editar).
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (!organizador) return null;

  const columnas = columnasMisEventos(width);
  const margen = width >= 600 ? space.padPageDesktop : space.padScreenX;
  const celda = anchoDeCelda(width - margen * 2, columnas, space.gapGrid);
  const crear = () => router.push('/organizadores/eventos/nuevo');

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <ScrollView contentContainerStyle={[styles.contenido, { paddingHorizontal: margen }]}>
        <View style={styles.pageHead}>
          <View style={styles.titulo}>
            <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
              Mis eventos
            </Text>
            {estado.tipo === 'listo' ? (
              <Text style={[type.bodySm, { color: color.textMuted }]}>{contador(estado.eventos.length)}</Text>
            ) : null}
          </View>
          <Button compacto onPress={crear}>
            Crear evento
          </Button>
        </View>

        {estado.tipo === 'error' ? (
          <View style={styles.error} accessibilityLiveRegion="polite">
            <Text style={[type.bodySm, { color: color.text }]}>{estado.mensaje}</Text>
            <Button variante="secondary" compacto onPress={() => void cargar()}>
              Reintentar
            </Button>
          </View>
        ) : (
          <View style={styles.grilla}>
            {estado.tipo === 'cargando'
              ? Array.from({ length: ESQUELETOS }, (_, i) => (
                  <View key={i} style={{ width: celda }}>
                    <EventManageCardEsqueleto />
                  </View>
                ))
              : estado.eventos.map((evento) => (
                  <View key={evento.id} style={{ width: celda }}>
                    <EventManageCard
                      evento={evento}
                      onPress={() => router.push({ pathname: '/organizadores/eventos/[id]', params: { id: evento.id } })}
                    />
                  </View>
                ))}
            {estado.tipo === 'listo' ? (
              <View style={{ width: celda }}>
                <NuevoEventoTile onPress={crear} />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingVertical: space.padPageDesktop, gap: space.s8 },
  pageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s6,
    flexWrap: 'wrap',
  },
  titulo: { flexDirection: 'row', alignItems: 'baseline', gap: space.s4, flexWrap: 'wrap' },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: space.gapGrid },
  error: { gap: space.s4, alignItems: 'flex-start' },
});
