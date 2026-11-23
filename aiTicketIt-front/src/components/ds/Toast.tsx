import { ChatCircle } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, iconSize, radius, shadow, size, space, tinte, type } from '@/theme/tokens';

export const DURACION_TOAST_MS = 5000;

/**
 * Toast (design-system.md § Toast, feature 007): aviso breve arriba, debajo del safe area. Todo el toast es
 * tocable y desaparece solo a los 5 s. Para reiniciar el tiempo con un aviso nuevo, cambiá su `key`.
 */
export function Toast({
  titulo,
  texto,
  onPress,
  onOcultar,
}: {
  titulo: string;
  texto: string;
  onPress: () => void;
  onOcultar: () => void;
}) {
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    const espera = setTimeout(onOcultar, DURACION_TOAST_MS);
    return () => clearTimeout(espera);
  }, [onOcultar]);

  return (
    <View style={[styles.capa, { top: top + space.s3 }]} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${titulo}. ${texto}`}
        style={({ hovered, pressed, focused }: { hovered?: boolean; pressed: boolean; focused?: boolean }) => [
          styles.toast,
          hovered && { backgroundColor: color.neutral800 },
          pressed && { backgroundColor: tinte.textoPresionado },
          focused && Platform.OS === 'web' && styles.foco,
        ]}>
        <ChatCircle size={iconSize.barra} color={color.accent} weight="fill" />
        <View style={styles.textos}>
          <Text style={[type.bodySm, styles.titulo]} numberOfLines={1}>
            {titulo}
          </Text>
          <Text style={[type.caption, { color: color.textMuted }]} numberOfLines={1}>
            {texto}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.padScreenX, zIndex: 10 },
  toast: {
    width: '100%',
    maxWidth: size.frameMobileW,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    padding: space.s4,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    boxShadow: shadow.lg,
  },
  textos: { flex: 1, gap: space.s1 },
  titulo: { color: color.text, fontFamily: type.h5.fontFamily },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
