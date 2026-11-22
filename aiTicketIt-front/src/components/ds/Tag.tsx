import { ArrowCounterClockwise, CheckCircle, Clock, Ticket, XCircle, type Icon } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { EstadoEvento } from '@/api/eventos';
import type { EstadoCompra } from '@/api/ventas';
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
export function Tag({ children, variante, Icono }: { children: string; variante: VarianteTag; Icono?: Icon }) {
  const e = ESTILO[variante];
  return (
    <View style={[styles.tag, Icono && styles.conIcono, { backgroundColor: e.fondo, borderColor: e.borde }]}>
      {Icono ? <Icono size={type.meta.fontSize} color={e.texto} aria-hidden /> : null}
      <Text style={[type.meta, { color: e.texto }]}>{children}</Text>
    </View>
  );
}

export function TagEstado({ estado }: { estado: EstadoEvento }) {
  return <Tag variante={VARIANTE_POR_ESTADO[estado]}>{estado}</Tag>;
}

/** Mapeo fijo de design-system.md § Tag para los estados de compra (variante + ícono + palabra). */
const TAG_POR_ESTADO_COMPRA: Record<EstadoCompra, { variante: VarianteTag; Icono: Icon }> = {
  'Pendiente de pago': { variante: 'outline', Icono: Clock },
  Confirmada: { variante: 'accent', Icono: CheckCircle },
  Utilizada: { variante: 'neutral', Icono: Ticket },
  Cancelada: { variante: 'neutral', Icono: XCircle },
  Reembolsada: { variante: 'neutral', Icono: ArrowCounterClockwise },
};

export function TagEstadoCompra({ estado }: { estado: EstadoCompra }) {
  const { variante, Icono } = TAG_POR_ESTADO_COMPRA[estado];
  return (
    <Tag variante={variante} Icono={Icono}>
      {estado}
    </Tag>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.tag,
    paddingHorizontal: space.s2,
    paddingVertical: space.s1 / 2,
  },
  conIcono: { flexDirection: 'row', alignItems: 'center', gap: space.s1 },
});
