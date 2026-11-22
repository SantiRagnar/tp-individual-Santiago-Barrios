import { StyleSheet, Text, View } from 'react-native';

import { entradas, fechaCorta, plata } from '@/lib/formato';
import { color, radius, shadow, space, type } from '@/theme/tokens';

type Props = { evento: string; fechaHora: string; sala: string; tipo: string; cantidad: number; total: number };

/** Tarjeta "Resumen" de Compradores 06 · Pago (design-system.md § ResumenCompra). */
export function ResumenCompra({ evento, fechaHora, sala, tipo, cantidad, total }: Props) {
  return (
    <View style={styles.tarjeta}>
      <Text style={[type.kicker, { color: color.textMuted }]}>Resumen</Text>
      <Text style={[type.h4, { color: color.text }]}>{evento}</Text>
      <Text style={[type.caption, { color: color.textMuted }]}>{`${fechaCorta(fechaHora)} · ${sala}`}</Text>
      <View style={styles.fila}>
        <Text style={[type.body, { color: color.text }]}>{entradas(tipo, cantidad)}</Text>
        <Text style={[type.body, styles.total]}>{plata(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: space.s2,
    padding: space.padCard,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    boxShadow: shadow.sm,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.s3,
    paddingTop: space.s3,
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  total: { color: color.text, fontVariant: ['tabular-nums'] },
});
