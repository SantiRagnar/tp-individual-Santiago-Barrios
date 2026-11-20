import { StyleSheet, Text, View } from 'react-native';

import { color, opacidadDeshabilitado, space, type } from '@/theme/tokens';

/** Separador con texto ("o"). `deshabilitado` lo muestra al 45% junto a las opciones que separa. */
export function DividerText({ texto, deshabilitado = false }: { texto: string; deshabilitado?: boolean }) {
  return (
    <View style={[styles.fila, deshabilitado && { opacity: opacidadDeshabilitado }]} accessibilityElementsHidden>
      <View style={styles.linea} />
      <Text style={[type.label, { color: color.textMuted }]}>{texto}</Text>
      <View style={styles.linea} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.s4 },
  linea: { flex: 1, height: 1, backgroundColor: color.divider },
});
