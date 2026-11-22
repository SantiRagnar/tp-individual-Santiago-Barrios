import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { color, radius, size, space, tinte, type } from '@/theme/tokens';

type EstadoPress = { pressed: boolean; hovered?: boolean; focused?: boolean };

/**
 * Filtro de una sola elección en píldora (design-system.md § Chip). El activo con el tratamiento del
 * primario (borde y texto en acento); los demás como secundario.
 */
export function Chip({
  etiqueta,
  activo,
  onPress,
  chico = false,
}: {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  /** `chip-sm` (26px): filtros de estado sobre una tabla desktop. */
  chico?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      style={({ pressed, hovered, focused }: EstadoPress) => [
        styles.chip,
        chico && styles.chipChico,
        { borderColor: activo ? color.accent : color.divider },
        hovered && { backgroundColor: activo ? tinte.acentoHover : tinte.textoHover },
        pressed && { backgroundColor: activo ? tinte.acentoPresionado : tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <Text style={[chico ? type.caption : type.bodySm, { color: activo ? color.accent : color.text }]}>{etiqueta}</Text>
    </Pressable>
  );
}

/** Fila de chips con scroll horizontal. La primera opción siempre es "Todos" (`valor` null). */
export function FilaDeChips<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiquetaTodos = 'Todos',
  etiquetaDe = (opcion) => opcion,
  chico = false,
}: {
  opciones: readonly T[];
  valor: T | null;
  onCambiar: (valor: T | null) => void;
  etiquetaTodos?: string;
  /** Texto de cada chip (por defecto, el valor). Sirve para "Confirmadas 51". */
  etiquetaDe?: (opcion: T) => string;
  chico?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      accessibilityRole="radiogroup">
      <Chip etiqueta={etiquetaTodos} activo={valor === null} onPress={() => onCambiar(null)} chico={chico} />
      {opciones.map((opcion) => (
        <Chip key={opcion} etiqueta={etiquetaDe(opcion)} activo={valor === opcion} onPress={() => onCambiar(opcion)} chico={chico} />
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
  chipChico: { minHeight: size.chipHeightSm, paddingHorizontal: space.s4 },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
