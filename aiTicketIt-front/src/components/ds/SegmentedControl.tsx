import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, radius, size, space, tinte, type } from '@/theme/tokens';

type EstadoPress = { pressed: boolean; hovered?: boolean; focused?: boolean };

/**
 * Elección única entre 2 a 4 opciones cortas, en partes iguales del ancho disponible
 * (design-system.md § SegmentedControl; Ordenar en Explorar).
 */
export function SegmentedControl<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambiar,
}: {
  /** Nombre accesible del grupo (p. ej. "Ordenar por"). */
  etiqueta: string;
  opciones: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onCambiar: (valor: T) => void;
}) {
  return (
    <View style={styles.grupo} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      {opciones.map((opcion) => {
        const elegida = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => onCambiar(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegida }}
            style={({ pressed, hovered, focused }: EstadoPress) => [
              styles.segmento,
              elegida && styles.elegido,
              !elegida && hovered && { backgroundColor: tinte.textoHover },
              !elegida && pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <Text style={[type.bodySm, { color: elegida ? color.accent : color.textLabel }]}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    flexDirection: 'row',
    padding: space.s1,
    gap: space.s1,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  segmento: {
    flex: 1,
    minHeight: size.controlHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  elegido: { borderColor: color.accent, backgroundColor: color.bg },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
