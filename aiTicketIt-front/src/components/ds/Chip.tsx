import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { color, radius, size, space, tinte, type } from '@/theme/tokens';

type EstadoPress = { pressed: boolean; hovered?: boolean; focused?: boolean };

/**
 * Filtro de una sola elección en píldora (design-system.md § Chip). El activo con el tratamiento del
 * primario (borde y texto en acento); los demás como secundario.
 */
export function Chip({ etiqueta, activo, onPress }: { etiqueta: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={({ pressed, hovered, focused }: EstadoPress) => [
        styles.chip,
        { borderColor: activo ? color.accent : color.divider },
        hovered && { backgroundColor: activo ? tinte.acentoHover : tinte.textoHover },
        pressed && { backgroundColor: activo ? tinte.acentoPresionado : tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <Text style={[type.bodySm, { color: activo ? color.accent : color.text }]}>{etiqueta}</Text>
    </Pressable>
  );
}

/** Fila de chips con scroll horizontal. La primera opción siempre es "Todos" (`valor` null). */
export function FilaDeChips<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiquetaTodos = 'Todos',
}: {
  opciones: readonly T[];
  valor: T | null;
  onCambiar: (valor: T | null) => void;
  etiquetaTodos?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      accessibilityRole="radiogroup">
      <Chip etiqueta={etiquetaTodos} activo={valor === null} onPress={() => onCambiar(null)} />
      {opciones.map((opcion) => (
        <Chip key={opcion} etiqueta={opcion} activo={valor === opcion} onPress={() => onCambiar(opcion)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: { gap: space.gapTight },
  chip: {
    minHeight: size.chipHeight,
    paddingHorizontal: space.padCard,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
