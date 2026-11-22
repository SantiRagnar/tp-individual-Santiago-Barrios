import { Heart } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { useFavoritos } from '@/favoritos/FavoritosProvider';
import { color, iconSize, radius, size, tinte } from '@/theme/tokens';

/**
 * Corazón de favorito (design-system.md: `heart` / `heart-fill` en accent-300). El estado es el
 * compartido de FavoritosProvider, así se ve igual en Explorar, Detalle y Favoritos (FR-019).
 * `fondo` lo pone sobre un círculo oscuro, para que se lea encima de la imagen de la EventCard.
 */
export function BotonFavorito({ eventoId, segunServidor, fondo = false }: { eventoId: string; segunServidor: boolean; fondo?: boolean }) {
  const { esFavorito, alternar } = useFavoritos();
  const activo = esFavorito(eventoId, segunServidor);
  return (
    <Pressable
      onPress={() => alternar(eventoId, segunServidor)}
      accessibilityRole="button"
      accessibilityLabel={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      accessibilityState={{ selected: activo }}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.boton,
        fondo && { backgroundColor: color.scrimStrong },
        pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <Heart size={iconSize.barra} color={color.accent300} weight={activo ? 'fill' : 'regular'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
