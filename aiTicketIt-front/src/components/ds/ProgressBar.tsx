import { StyleSheet, View } from 'react-native';

import { color, radius } from '@/theme/tokens';

/** Alto de la variante fina `progress` del design system. */
const ALTO_FINO = 4;

/**
 * Barra de progreso fina (acento plano sobre riel neutral-900). Nunca va sola:
 * siempre acompañada del texto que dice lo mismo ("N de M entradas vendidas").
 */
export function ProgressBar({ valor, total }: { valor: number; total: number }) {
  const proporcion = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0;
  return (
    <View style={styles.riel} aria-hidden>
      <View style={[styles.relleno, { width: `${proporcion * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  riel: { height: ALTO_FINO, borderRadius: radius.sm, backgroundColor: color.neutral900, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: radius.sm, backgroundColor: color.accent },
});
