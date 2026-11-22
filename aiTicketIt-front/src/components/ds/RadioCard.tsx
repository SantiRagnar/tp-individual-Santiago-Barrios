import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, opacidadDeshabilitado, radius, shadow, space, tinte, type } from '@/theme/tokens';

type Props = {
  titulo: string;
  /** Línea secundaria muted ("Quedan 12", "Agotada"). */
  secundario?: string;
  /** Dato a la derecha (precio). */
  detalle?: string;
  /** Ícono de 20px a la izquierda (medios de pago). */
  icono?: ReactNode;
  elegida: boolean;
  deshabilitada?: boolean;
  onPress: () => void;
};

/**
 * Opción de una lista de radio en tarjeta (design-system.md § RadioCard): `surface`, ≥ 56px, punto en acento
 * y `shadow-sm` cuando está elegida. Deshabilitada = 45% pero visible (tipo "Agotada").
 */
export function RadioCard({ titulo, secundario, detalle, icono, elegida, deshabilitada = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitada}
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida, disabled: deshabilitada }}
      accessibilityLabel={[titulo, secundario, detalle].filter(Boolean).join(', ')}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.tarjeta,
        elegida && styles.elegida,
        deshabilitada && { opacity: opacidadDeshabilitado },
        !deshabilitada && hovered && { backgroundColor: tinte.textoHover },
        !deshabilitada && pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <View style={[styles.radio, elegida && styles.radioElegido]}>{elegida ? <View style={styles.punto} /> : null}</View>
      {icono}
      <View style={styles.textos}>
        <Text style={[type.body, { color: color.text }]}>{titulo}</Text>
        {secundario ? <Text style={[type.caption, { color: color.textMuted }]}>{secundario}</Text> : null}
      </View>
      {detalle ? <Text style={[type.body, styles.detalle]}>{detalle}</Text> : null}
    </Pressable>
  );
}

const PUNTO = 10;
const RADIO = 20;

const styles = StyleSheet.create({
  tarjeta: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    padding: space.padCard,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  elegida: { boxShadow: shadow.sm },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.neutral500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioElegido: { borderColor: color.accent },
  punto: { width: PUNTO, height: PUNTO, borderRadius: radius.pill, backgroundColor: color.accent },
  textos: { flex: 1, gap: space.s1 },
  detalle: { color: color.text, fontVariant: ['tabular-nums'] },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
