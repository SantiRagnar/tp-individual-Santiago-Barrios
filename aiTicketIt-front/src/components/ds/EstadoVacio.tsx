import { StyleSheet, Text, View } from 'react-native';

import { color, space, type } from '@/theme/tokens';

/** Estado vacío de una lista: título + texto muted (p. ej. "No encontramos eventos"). */
export function EstadoVacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.contenedor} accessibilityLiveRegion="polite">
      <Text style={[type.h5, { color: color.text }]}>{titulo}</Text>
      <Text style={[type.bodySm, styles.texto]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: space.s2, paddingVertical: space.s8 },
  texto: { color: color.textMuted, textAlign: 'center' },
});
