import { StyleSheet, Text, View } from 'react-native';

import { color, radius, type } from '@/theme/tokens';

/** Iniciales de un nombre: "Sofía Gómez" → "SG", "Compañía La Trama" → "CL". */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join('');
}

/** Círculo con iniciales del propio usuario (accent-900 + accent-200). No hay fotos de perfil. */
export function Avatar({ nombre, tamano }: { nombre: string; tamano: number }) {
  return (
    <View
      style={[styles.circulo, { width: tamano, height: tamano }]}
      accessibilityLabel={nombre}
      accessibilityRole="image">
      <Text style={[tamano >= 44 ? type.bodySm : type.label, { color: color.accent200 }]}>{iniciales(nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    borderRadius: radius.pill,
    backgroundColor: color.accent900,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
