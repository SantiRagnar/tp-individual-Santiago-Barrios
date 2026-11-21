import { StyleSheet, Text, View } from 'react-native';

import type { EstadoEvento } from '@/api/eventos';
import { color, radius, space, type } from '@/theme/tokens';

export type VarianteTag = 'accent' | 'outline' | 'neutral';

/** Mapeo fijo de design-system.md § Tag: Publicado → accent, Borrador → outline, Finalizado → neutral. */
export const VARIANTE_POR_ESTADO: Record<EstadoEvento, VarianteTag> = {
  Publicado: 'accent',
  Borrador: 'outline',
  Finalizado: 'neutral',
};

const ESTILO: Record<VarianteTag, { fondo: string; borde: string; texto: string }> = {
  // design-system.md § Color: tag-accent = accent-800 + accent-100; tag-neutral = neutral-800 + neutral-100.
  accent: { fondo: color.accent800, borde: color.accent800, texto: color.accent100 },
  outline: { fondo: 'transparent', borde: color.accent, texto: color.accent },
  neutral: { fondo: color.neutral800, borde: color.neutral800, texto: color.neutral100 },
};

/** Etiqueta chica (radius-tag, 11px). La categoría del evento usa `neutral`. */
export function Tag({ children, variante }: { children: string; variante: VarianteTag }) {
  const e = ESTILO[variante];
  return (
    <View style={[styles.tag, { backgroundColor: e.fondo, borderColor: e.borde }]}>
      <Text style={[type.meta, { color: e.texto }]}>{children}</Text>
    </View>
  );
}

export function TagEstado({ estado }: { estado: EstadoEvento }) {
  return <Tag variante={VARIANTE_POR_ESTADO[estado]}>{estado}</Tag>;
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.tag,
    paddingHorizontal: space.s2,
    paddingVertical: space.s1 / 2,
  },
});
