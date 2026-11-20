import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, opacidadDeshabilitado, radius, size, space, tinte, type } from '@/theme/tokens';

type Variante = 'primary' | 'secondary' | 'cta';

type Props = {
  children: string;
  onPress?: () => void;
  variante?: Variante;
  disabled?: boolean;
  /** Mientras se envía: deshabilitado y con indicador. */
  enviando?: boolean;
  icono?: ReactNode;
  /** 36px (desktop) en lugar de 44/46px (mobile). */
  compacto?: boolean;
  accessibilityHint?: string;
};

/**
 * Botón del design system. El primario no se rellena: borde y texto en acento.
 * Deshabilitado = 45% de opacidad, nunca escondido.
 */
export function Button({
  children,
  onPress,
  variante = 'primary',
  disabled = false,
  enviando = false,
  icono,
  compacto = false,
  accessibilityHint,
}: Props) {
  const inactivo = disabled || enviando;
  const acento = variante !== 'secondary';
  const alto = compacto ? size.controlHeight : variante === 'cta' ? size.ctaHeight : size.touchTarget;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: enviando }}
      accessibilityHint={accessibilityHint}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.base,
        {
          minHeight: alto,
          borderColor: acento ? color.accent : color.divider,
          opacity: inactivo ? opacidadDeshabilitado : 1,
        },
        variante === 'cta' && styles.anchoCompleto,
        !inactivo && hovered && { backgroundColor: acento ? tinte.acentoHover : tinte.textoHover },
        !inactivo && pressed && { backgroundColor: acento ? tinte.acentoPresionado : tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <View style={styles.contenido}>
        {enviando ? <ActivityIndicator size="small" color={color.accent} /> : icono}
        <Text style={[type.bodySm, { color: acento ? color.accent : color.text }]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.padCard,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  anchoCompleto: { alignSelf: 'stretch' },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapTight,
  },
  foco: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: color.accent,
    outlineOffset: 2,
  },
});
