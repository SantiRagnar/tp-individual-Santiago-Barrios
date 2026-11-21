import { ArrowLeft } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { color, iconSize, radius, size, space, tinte, type } from '@/theme/tokens';

/** "Volver" del page-head de Organizadores: flecha + texto, sin borde. */
export function Volver({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ hovered, pressed, focused }: { hovered?: boolean; pressed: boolean; focused?: boolean }) => [
        styles.boton,
        hovered && { backgroundColor: tinte.textoHover },
        pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <ArrowLeft size={iconSize.enLinea} color={color.textLabel} />
      <Text style={[type.bodySm, { color: color.textLabel }]}>Volver</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapTight,
    minHeight: size.controlHeight,
    paddingHorizontal: space.s2,
    borderRadius: radius.md,
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
