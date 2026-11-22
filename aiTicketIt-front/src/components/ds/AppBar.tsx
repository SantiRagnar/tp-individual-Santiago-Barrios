import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, iconSize, radius, size, space, tinte, type } from '@/theme/tokens';

/**
 * AppBar mobile (design-system.md § AppBar): Volver siempre a la izquierda (44px), título de una
 * línea con elipsis y a lo sumo una acción a la derecha.
 */
export function AppBar({ titulo, accion, onVolver }: { titulo?: string; accion?: ReactNode; onVolver?: () => void }) {
  const volver = onVolver ?? (() => (router.canGoBack() ? router.back() : router.replace('/explorar')));
  return (
    <View style={styles.barra}>
      <Pressable
        onPress={volver}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
          styles.boton,
          pressed && { backgroundColor: tinte.textoPresionado },
          focused && Platform.OS === 'web' && styles.foco,
        ]}>
        <ArrowLeft size={iconSize.barra} color={color.text} />
      </Pressable>
      <Text style={[type.screenTitle, styles.titulo]} numberOfLines={1} accessibilityRole="header">
        {titulo ?? ''}
      </Text>
      <View style={styles.accion}>{accion}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s2,
    paddingHorizontal: space.s3,
    minHeight: size.touchTarget + space.s3,
  },
  boton: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { flex: 1, color: color.text },
  accion: { minWidth: size.touchTarget, alignItems: 'flex-end' },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
