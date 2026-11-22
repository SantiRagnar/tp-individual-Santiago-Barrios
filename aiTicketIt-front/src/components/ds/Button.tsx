import type { ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, opacidadDeshabilitado, radius, size, space, tinte, type } from '@/theme/tokens';

type Variante = 'primary' | 'secondary' | 'cta' | 'ghost';

type Props = {
  children: string;
  onPress?: () => void;
  variante?: Variante;
  disabled?: boolean;
  /**
   * Se ve deshabilitado (45%, `aria-disabled`) pero sigue recibiendo foco y toque: para el primario de un
   * formulario con errores, que al tocarlo muestra todos los errores (design-system.md § Estados).
   */
  pareceDeshabilitado?: boolean;
  /** Mientras se envía: deshabilitado y con indicador. */
  enviando?: boolean;
  icono?: ReactNode;
  /** 36px (desktop) en lugar de 44/46px (mobile). */
  compacto?: boolean;
  accessibilityHint?: string;
  /** `tag-count` dentro del botón (p. ej. consultas sin leer); 0 o undefined = sin contador (feature 007). */
  contador?: number;
  /** `dot-unread` al lado del texto: hay mensajes sin leer (feature 007). */
  noLeido?: boolean;
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
  pareceDeshabilitado = false,
  enviando = false,
  icono,
  compacto = false,
  accessibilityHint,
  contador,
  noLeido = false,
}: Props) {
  const inactivo = disabled || enviando;
  const atenuado = inactivo || pareceDeshabilitado;
  const acento = variante !== 'secondary' && variante !== 'ghost';
  const borde = variante === 'ghost' ? 'transparent' : acento ? color.accent : color.divider;
  const alto = compacto ? size.controlHeight : variante === 'cta' ? size.ctaHeight : size.touchTarget;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: atenuado, busy: enviando }}
      accessibilityHint={accessibilityHint}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.base,
        {
          minHeight: alto,
          borderColor: borde,
          opacity: atenuado ? opacidadDeshabilitado : 1,
        },
        variante === 'cta' && styles.anchoCompleto,
        !atenuado && hovered && { backgroundColor: acento ? tinte.acentoHover : tinte.textoHover },
        !atenuado && pressed && { backgroundColor: acento ? tinte.acentoPresionado : tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <View style={styles.contenido}>
        {enviando ? <ActivityIndicator size="small" color={color.accent} /> : icono}
        <Text style={[type.bodySm, { color: acento ? color.accent : color.text }]}>{children}</Text>
        {contador ? (
          <View style={styles.contador} accessibilityLabel={`${contador} sin leer`}>
            <Text style={[type.meta, styles.contadorTexto]}>{contador}</Text>
          </View>
        ) : null}
        {noLeido ? <View style={styles.punto} accessibilityLabel="Tenés mensajes sin leer" accessibilityRole="image" /> : null}
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
  // `tag-count` (design-system.md § Tag): pastilla en acento con el número.
  contador: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: space.s2,
    borderRadius: radius.pill,
    backgroundColor: color.accent800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { color: color.accent200, fontVariant: ['tabular-nums'] },
  // `dot-unread`: punto de 8px en acento.
  punto: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: color.accent },
  foco: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: color.accent,
    outlineOffset: 2,
  },
});
