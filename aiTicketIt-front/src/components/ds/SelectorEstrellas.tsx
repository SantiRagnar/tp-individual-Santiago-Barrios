import { Star } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { color, radius, size, space, tinte } from '@/theme/tokens';

type Props = {
  /** Puntaje elegido (1–5) o null sin elegir. */
  valor: number | null;
  onCambiar?: (puntaje: number) => void;
  /** `lg` (36px) en Calificar experiencia; `sm` (28px) en el recordatorio de Explorar (tokens `star-lg` / `star-sm`). */
  tamano?: 'lg' | 'sm';
  /** Sin acción: muestra una calificación ya guardada o bloquea mientras se envía. */
  deshabilitado?: boolean;
};

/**
 * Cinco estrellas para calificar (design-system.md § Rating, feature 006). Botones con etiqueta "N estrellas"
 * y la elegida marcada como seleccionada (equivale a `aria-pressed`); llenas hasta la elegida, en accent-300.
 */
export function SelectorEstrellas({ valor, onCambiar, tamano = 'lg', deshabilitado = false }: Props) {
  const lado = tamano === 'lg' ? size.starLg : size.starSm;
  return (
    <View style={styles.fila} accessibilityRole="radiogroup" accessibilityLabel="Puntaje">
      {[1, 2, 3, 4, 5].map((n) => {
        const llena = valor !== null && n <= valor;
        return (
          <Pressable
            key={n}
            onPress={() => onCambiar?.(n)}
            disabled={deshabilitado || !onCambiar}
            accessibilityRole="button"
            accessibilityLabel={n === 1 ? '1 estrella' : `${n} estrellas`}
            accessibilityState={{ selected: valor === n, disabled: deshabilitado || !onCambiar }}
            hitSlop={(size.touchTarget - lado) / 2}
            style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
              styles.estrella,
              pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <Star size={lado} color={color.accent300} weight={llena ? 'fill' : 'regular'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: space.s1 },
  estrella: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
