import { StyleSheet, Text, View } from 'react-native';

import type { TipoDeEntrada } from '@/api/eventos';
import { ProgressBar } from '@/components/ds/ProgressBar';
import { miles, plata } from '@/lib/formato';
import { color, space, type } from '@/theme/tokens';

/**
 * Disponibilidad de un tipo de entrada en el panel del evento
 * (specs/005-panel-evento/contracts/rutas-front.md § Organizadores 04, punto 2).
 */
export function DisponibilidadTipo({ tipo }: { tipo: TipoDeEntrada }) {
  const nombre = tipo.nombre || 'Sin nombre';
  const titulo = tipo.precio === null ? nombre : `${nombre} · ${plata(tipo.precio)}`;
  const cupo = tipo.cupo ?? 0;
  const quedan = cupo - tipo.vendidas;
  // Sin cupo (solo en Borrador) no se muestra ni "Quedan" ni "Agotada" (spec, Edge Cases).
  const estado = tipo.cupo === null ? null : quedan <= 0 ? 'Agotada' : `Quedan ${miles(quedan)}`;

  return (
    <View style={styles.bloque}>
      <Text style={[type.bodySm, { color: color.text }]}>{titulo}</Text>
      <ProgressBar valor={tipo.vendidas} total={cupo} variante="lg" />
      <View style={styles.pie}>
        <Text style={[type.caption, { color: estado === 'Agotada' ? color.accent : color.textMuted }]}>{estado ?? ''}</Text>
        <Text style={[type.caption, styles.tabular, { color: color.textMuted }]}>
          {miles(tipo.vendidas)} / {miles(cupo)} vendidas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: space.s2 },
  pie: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s4 },
  tabular: { fontVariant: ['tabular-nums'] },
});
