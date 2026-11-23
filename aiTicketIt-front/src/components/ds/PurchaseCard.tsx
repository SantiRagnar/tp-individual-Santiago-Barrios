import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Compra } from '@/api/compras';
import { ImagenDeEvento } from '@/components/ds/ImagenEvento';
import { PuntoNoLeido } from '@/components/ds/ListaConversaciones';
import { TagCompra } from '@/components/ds/Tag';
import { cuentaRegresiva, entradas, estrellas, fechaCorta } from '@/lib/formato';
import { color, radius, shadow, space, tinte, type } from '@/theme/tokens';

const ANCHO_IMAGEN = 104;
const ALTO_IMAGEN = 78;
/** Cancelada y Reembolsada: imagen al 40% (design-system.md § Imágenes). */
const OPACIDAD_INACTIVA = 0.4;

/**
 * Fila de Mis compras (design-system.md § PurchaseCard): texto a la izquierda e imagen de 104px a la derecha;
 * abajo el Tag de estado y, si está Confirmada, la cuenta regresiva. Si la compra se puede calificar
 * (`acciones.calificar`), "Calificá tu experiencia" abre Calificar experiencia con `onCalificar` (feature 006);
 * ya calificada muestra "Calificaste ★★★★☆".
 */
export function PurchaseCard({ compra, onPress, onCalificar }: { compra: Compra; onPress: () => void; onCalificar?: () => void }) {
  const inactiva = compra.estado === 'Cancelada' || compra.estado === 'Reembolsada';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${compra.evento.nombre}, ${compra.estado}${compra.consultaNoLeida ? ', tenés mensajes sin leer' : ''}`}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.tarjeta,
        hovered && { backgroundColor: tinte.textoHover },
        pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      <View style={styles.fila}>
        <View style={styles.textos}>
          <Text style={[type.cardTitle, { color: color.text }]} numberOfLines={2}>
            {compra.evento.nombre}
          </Text>
          <Text style={[type.caption, { color: color.textMuted }]}>{fechaCorta(compra.evento.fechaHora)}</Text>
          <Text style={[type.caption, { color: color.textLabel }]}>{entradas(compra.tipoDeEntrada.nombre, compra.cantidad)}</Text>
        </View>
        <View style={[styles.imagen, inactiva && { opacity: OPACIDAD_INACTIVA }]}>
          <ImagenDeEvento imagenUrl={compra.evento.imagenUrl} alto={ALTO_IMAGEN} />
        </View>
      </View>
      {/* Respuesta sin leer (feature 007, FR-023): fuera de la imagen, así no hereda su opacidad. */}
      {compra.consultaNoLeida ? (
        <View style={styles.punto}>
          <PuntoNoLeido />
        </View>
      ) : null}
      <View style={styles.pie}>
        <TagCompra estado={compra.estado} />
        {compra.diasParaEvento !== null ? (
          <Text style={[type.caption, { color: color.accent300 }]}>{cuentaRegresiva(compra.diasParaEvento)}</Text>
        ) : null}
        {compra.calificacion ? (
          <Text style={[type.caption, { color: color.textLabel }]} accessibilityLabel={`Calificaste ${compra.calificacion.puntaje} de 5 estrellas`}>
            {`Calificaste ${estrellas(compra.calificacion.puntaje)}`}
          </Text>
        ) : compra.acciones.calificar ? (
          <Pressable
            onPress={onCalificar}
            accessibilityRole="button"
            accessibilityLabel={`Calificá tu experiencia en ${compra.evento.nombre}`}
            hitSlop={space.s3}
            style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
              pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <Text style={[type.caption, { color: color.accent }]}>Calificá tu experiencia</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { gap: space.s4, padding: space.padCard, borderRadius: radius.md, backgroundColor: color.surface, boxShadow: shadow.sm },
  fila: { flexDirection: 'row', gap: space.s4 },
  textos: { flex: 1, gap: space.s1 },
  imagen: { width: ANCHO_IMAGEN, borderRadius: radius.sm, overflow: 'hidden' },
  pie: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s4 },
  punto: { position: 'absolute', top: space.s3, right: space.s3 },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
