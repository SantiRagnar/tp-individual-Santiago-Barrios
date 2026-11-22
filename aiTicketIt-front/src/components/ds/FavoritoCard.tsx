import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventoCompradorResumen } from '@/api/compradores';
import { BotonFavorito } from '@/components/ds/BotonFavorito';
import { fechaCorta, plata } from '@/lib/formato';
import { color, radius, shadow, space, tinte, type } from '@/theme/tokens';

type EstadoPress = { pressed: boolean; hovered?: boolean; focused?: boolean };

/** Fila de Compradores 11 · Favoritos: título, fecha corta, "Desde $ X" y corazón para quitar. */
export function FavoritoCard({ evento, onPress }: { evento: EventoCompradorResumen; onPress: () => void }) {
  const fecha = fechaCorta(evento.fechaHora);
  const desde = `Desde ${plata(evento.precioDesde)}`;
  return (
    <View style={styles.tarjeta}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${evento.nombre}, ${fecha}, ${desde}`}
        accessibilityHint="Abre el detalle del evento"
        style={({ pressed, hovered, focused }: EstadoPress) => [
          styles.contenido,
          hovered && { backgroundColor: tinte.textoHover },
          pressed && { backgroundColor: tinte.textoPresionado },
          focused && Platform.OS === 'web' && styles.foco,
        ]}>
        <Text style={[type.cardTitle, { color: color.text }]} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <Text style={[type.bodySm, { color: color.textLabel }]}>{fecha}</Text>
        <Text style={[type.bodySm, { color: color.text }]}>{desde}</Text>
      </Pressable>
      <BotonFavorito eventoId={evento.id} segunServidor={evento.esFavorito} />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.s3,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    boxShadow: shadow.sm,
    overflow: 'hidden',
  },
  contenido: { flex: 1, padding: space.padCard, gap: space.s1 },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: -2 },
});
