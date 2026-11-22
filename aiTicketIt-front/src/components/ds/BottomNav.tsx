import { Compass, Heart, type Icon } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, iconSize, size, space, tinte, type } from '@/theme/tokens';

export type Pestana = 'explorar' | 'favoritos';

const PESTANAS: { clave: Pestana; etiqueta: string; Icono: Icon }[] = [
  { clave: 'explorar', etiqueta: 'Explorar', Icono: Compass },
  { clave: 'favoritos', etiqueta: 'Favoritos', Icono: Heart },
];

/**
 * Pestañas raíz de Compradores (design-system.md § BottomNav): la actual con ícono relleno y texto
 * en acento; las demás en línea neutral-400. Ícono 22px + etiqueta 12px, 48px de alto.
 */
export function BottomNav({ actual, onCambiar }: { actual: Pestana; onCambiar: (pestana: Pestana) => void }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[styles.barra, { paddingBottom: Math.max(bottom, space.s3) }]} accessibilityRole="tablist">
      {PESTANAS.map(({ clave, etiqueta, Icono }) => {
        const activa = clave === actual;
        const tono = activa ? color.accent : color.neutral400;
        return (
          <Pressable
            key={clave}
            onPress={() => onCambiar(clave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            accessibilityLabel={etiqueta}
            style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
              styles.pestana,
              pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <Icono size={iconSize.pestana} color={tono} weight={activa ? 'fill' : 'regular'} />
            <Text style={[type.label, { color: tono }]}>{etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: color.bg,
    borderTopWidth: 1,
    borderTopColor: color.divider,
  },
  pestana: {
    flex: 1,
    minHeight: size.tabHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s1,
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: -2 },
});
