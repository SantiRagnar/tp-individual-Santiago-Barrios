import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space, type } from '@/theme/tokens';

/**
 * Pie fijo del flujo de compra (design-system.md § ActionFooter): valor a la izquierda ("Desde" en
 * 12px muted + monto en 17px) y el botón primario que ocupa el resto.
 */
export function ActionFooter({ etiqueta, valor, children }: { etiqueta: string; valor: string; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.pie, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]}>
      <View>
        <Text style={[type.label, { color: color.textMuted }]}>{etiqueta}</Text>
        <Text style={[type.screenTitle, styles.valor]}>{valor}</Text>
      </View>
      <View style={styles.accion}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s6,
    paddingHorizontal: space.padScreenX,
    paddingTop: space.padCard,
    backgroundColor: color.bg,
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  valor: { color: color.text, fontVariant: ['tabular-nums'] },
  accion: { flex: 1 },
});
