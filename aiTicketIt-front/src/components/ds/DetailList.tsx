import { StyleSheet, Text, View } from 'react-native';

import { color, radius, shadow, space, type } from '@/theme/tokens';

export type Detalle = { termino: string; valor: string; numerico?: boolean };

/** `detail-list` dentro de card (design-system.md § DetailList): término muted, valor en color-text. */
export function DetailList({ detalles }: { detalles: Detalle[] }) {
  return (
    <View style={styles.tarjeta}>
      {detalles.map(({ termino, valor, numerico }, i) => (
        <View key={termino} style={[styles.fila, i > 0 && styles.separada]}>
          <Text style={[type.bodySm, { color: color.textMuted }]}>{termino}</Text>
          <Text style={[type.bodySm, styles.valor, numerico && styles.tabular]}>{valor}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { paddingHorizontal: space.padCard, borderRadius: radius.md, backgroundColor: color.surface, boxShadow: shadow.sm },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s6, paddingVertical: space.s4 },
  separada: { borderTopWidth: 1, borderTopColor: color.divider },
  valor: { flexShrink: 1, color: color.text, textAlign: 'right' },
  tabular: { fontVariant: ['tabular-nums'] },
});
