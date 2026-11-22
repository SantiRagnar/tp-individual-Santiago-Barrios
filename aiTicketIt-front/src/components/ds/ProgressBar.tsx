import { Platform, StyleSheet, View } from 'react-native';

import { color, radius, size } from '@/theme/tokens';

/** Alto de la variante fina `progress` del design system. */
const ALTO_FINO = 4;

/**
 * Barra de progreso sobre riel neutral-900. Nunca va sola: siempre acompañada del texto que dice lo
 * mismo. `fino` (4px, acento plano): tarjeta de evento. `lg` (10px, degradé accent-700 → accent):
 * disponibilidad por tipo de entrada (design-system.md § ProgressBar). El degradé sale con CSS en web;
 * en nativo queda el acento plano (specs/005-panel-evento/research.md R10).
 */
export function ProgressBar({ valor, total, variante = 'fino' }: { valor: number; total: number; variante?: 'fino' | 'lg' }) {
  const proporcion = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0;
  const lg = variante === 'lg';
  return (
    <View style={[styles.riel, lg && styles.rielLg]} aria-hidden>
      <View style={[styles.relleno, lg && styles.rellenoLg, { width: `${proporcion * 100}%` }]} />
    </View>
  );
}

const degradeWeb =
  Platform.OS === 'web' ? ({ backgroundImage: `linear-gradient(90deg, ${color.accent700}, ${color.accent})` } as object) : {};

const styles = StyleSheet.create({
  riel: { height: ALTO_FINO, borderRadius: radius.sm, backgroundColor: color.neutral900, overflow: 'hidden' },
  rielLg: { height: size.progressLg, borderRadius: radius.pill },
  relleno: { height: '100%', borderRadius: radius.sm, backgroundColor: color.accent },
  rellenoLg: { borderRadius: radius.pill, ...degradeWeb },
});
