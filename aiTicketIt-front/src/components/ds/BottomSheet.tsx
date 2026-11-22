import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, radius, shadow, space } from '@/theme/tokens';

const MANIJA_ANCHO = 36;
const MANIJA_ALTO = 4;

/**
 * Hoja desde abajo (design-system.md § BottomSheet): scrim `color-scrim-strong` que la cierra al tocarlo,
 * `surface`, `radius-sheet`, `shadow-lg` y manija arriba. Atrás en Android también la cierra.
 */
export function BottomSheet({ visible, onCerrar, children }: { visible: boolean; onCerrar: () => void; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityRole="button" accessibilityLabel="Cerrar menú" />
        <View style={[styles.hoja, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]} accessibilityViewIsModal>
          <View style={styles.manija} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.scrimStrong },
  hoja: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: shadow.lg,
    paddingHorizontal: space.padScreenX,
    paddingTop: space.s3,
    gap: space.s6,
  },
  manija: {
    alignSelf: 'center',
    width: MANIJA_ANCHO,
    height: MANIJA_ALTO,
    borderRadius: radius.pill,
    backgroundColor: color.neutral600,
  },
});
