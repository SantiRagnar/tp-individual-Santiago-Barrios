import { StyleSheet, Text, View } from 'react-native';

import { color, radius, space, type } from '@/theme/tokens';

/**
 * Una cifra principal con kicker y aclaración (design-system.md § StatCard). Solo para el dato que el
 * organizador viene a buscar: Recaudado en el panel del evento.
 */
export function StatCard({ kicker, cifra, aclaracion }: { kicker: string; cifra: string; aclaracion: string }) {
  return (
    <View style={styles.tarjeta} accessibilityLabel={`${kicker}: ${cifra}. ${aclaracion}`}>
      <Text style={[type.kicker, { color: color.accent }]}>{kicker}</Text>
      <Text style={[type.stat, styles.tabular, { color: color.text }]}>{cifra}</Text>
      <Text style={[type.caption, { color: color.textMuted }]}>{aclaracion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: space.padCard,
    gap: space.s2,
  },
  tabular: { fontVariant: ['tabular-nums'] },
});
