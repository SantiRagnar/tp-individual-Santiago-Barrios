import { type ReactNode, useRef } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';

import type { AutorMensaje, Mensaje } from '@/api/consultas';
import { horaDeMensaje } from '@/lib/formato';
import { color, radius, space, type } from '@/theme/tokens';

/** Distancia al final (px) dentro de la cual se considera que el usuario está "al final". */
const UMBRAL_FINAL = 48;

/**
 * Mensajes de un chat (design-system.md § Chat): los propios a la derecha en accent-800, los de la otra
 * parte a la izquierda en surface; burbuja radius-lg de hasta 78% y hora en 10px muted debajo.
 * Arranca al final y, con mensajes nuevos, baja solo si el usuario ya estaba al final (spec, edge cases).
 */
export function ChatMensajes({ mensajes, propio, vacio }: { mensajes: Mensaje[]; propio: AutorMensaje; vacio: ReactNode }) {
  const scroll = useRef<ScrollViewInstance>(null);
  const alFinal = useRef(true);

  const alDesplazar = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    alFinal.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < UMBRAL_FINAL;
  };

  if (mensajes.length === 0) return <View style={styles.vacio}>{vacio}</View>;

  return (
    <ScrollView
      ref={scroll}
      style={styles.lista}
      contentContainerStyle={styles.contenido}
      onScroll={alDesplazar}
      scrollEventThrottle={100}
      onContentSizeChange={() => {
        if (alFinal.current) scroll.current?.scrollToEnd({ animated: false });
      }}
      accessibilityRole="list">
      {mensajes.map((mensaje) => {
        const esPropio = mensaje.autor === propio;
        return (
          <View key={mensaje.id} style={[styles.fila, esPropio ? styles.derecha : styles.izquierda]} accessibilityRole="text">
            <View style={[styles.burbuja, { backgroundColor: esPropio ? color.accent800 : color.surface }]}>
              <Text style={[type.bodySm, { color: color.text }]}>{mensaje.texto}</Text>
            </View>
            <Text style={styles.hora}>{horaDeMensaje(mensaje.enviadoEn)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lista: { flex: 1 },
  contenido: { padding: space.padScreenX, gap: space.gapStack },
  vacio: { flex: 1, justifyContent: 'center', paddingHorizontal: space.padScreenX },
  fila: { maxWidth: '78%', gap: space.s1 },
  derecha: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  izquierda: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  burbuja: { borderRadius: radius.lg, paddingHorizontal: space.s4, paddingVertical: space.s3 },
  hora: { fontSize: 10, lineHeight: 14, fontFamily: type.meta.fontFamily, color: color.textMuted },
});
