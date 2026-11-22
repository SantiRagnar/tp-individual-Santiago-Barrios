import { CalendarBlank, MapPin, Star } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventoCompradorResumen } from '@/api/compradores';
import { Button } from '@/components/ds/Button';
import { ImagenDeEvento, ImagenEsqueleto } from '@/components/ds/ImagenEvento';
import { Tag } from '@/components/ds/Tag';
import { fechaCorta, plata, puntaje } from '@/lib/formato';
import { color, iconSize, radius, shadow, space, tinte, type } from '@/theme/tokens';

/** Alto de la imagen en la EventCard mobile (design-system.md § EventCard). */
const ALTO_IMAGEN = 150;

type EstadoPress = { pressed: boolean; hovered?: boolean; focused?: boolean };

/** "4.5 · Compañía La Trama", o solo el organizador si todavía no tiene reseñas. */
export function textoOrganizador({ nombre, puntaje: valor }: EventoCompradorResumen['organizador']) {
  return valor === null ? nombre : `${puntaje(valor)} · ${nombre}`;
}

type Props = {
  evento: EventoCompradorResumen;
  onPress: () => void;
  /** Acción arriba a la derecha de la imagen (el corazón de favorito). */
  accionSuperior?: ReactNode;
  /** Comprar → Elegir entradas (feature 004, FR-003). */
  onComprar: () => void;
};

/**
 * Tarjeta de evento de Compradores 02 (design-system.md § EventCard). Toda la tarjeta abre el
 * Detalle; el corazón y Comprar son acciones propias. Para que sigan siendo botones accesibles no se
 * anidan dentro del área tocable principal: el corazón va encima de la imagen y Comprar en el pie (research R14).
 */
export function EventCard({ evento, onPress, accionSuperior, onComprar }: Props) {
  const fecha = fechaCorta(evento.fechaHora);
  const organizador = textoOrganizador(evento.organizador);
  const desde = `Desde ${plata(evento.precioDesde)}`;

  return (
    <View style={styles.tarjeta}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${evento.nombre}, ${fecha}, ${evento.ubicacion}, ${desde}, ${organizador}`}
        accessibilityHint="Abre el detalle del evento"
        style={({ pressed, hovered, focused }: EstadoPress) => [
          hovered && { backgroundColor: tinte.textoHover },
          pressed && { backgroundColor: tinte.textoPresionado },
          focused && Platform.OS === 'web' && styles.foco,
        ]}>
        <ImagenDeEvento imagenUrl={evento.imagenUrl} alto={ALTO_IMAGEN} />
        <View style={styles.cuerpo}>
          <Text style={[type.cardTitle, { color: color.text }]} numberOfLines={2}>
            {evento.nombre}
          </Text>
          <View style={styles.dato}>
            <CalendarBlank size={iconSize.enLinea} color={color.accent} />
            <Text style={[type.bodySm, { color: color.textLabel }]}>{fecha}</Text>
          </View>
          <View style={styles.dato}>
            <MapPin size={iconSize.enLinea} color={color.accent} />
            <Text style={[type.bodySm, styles.flexible, { color: color.textLabel }]} numberOfLines={1}>
              {evento.ubicacion}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.pie}>
        {/* Parte de la tarjeta: también abre el Detalle. Para lectores de pantalla ya está en el label de arriba. */}
        <Pressable onPress={onPress} accessible={false} style={styles.precio}>
          <Text style={[type.bodySm, { color: color.text }]}>{desde}</Text>
          <View style={styles.dato}>
            {evento.organizador.puntaje !== null ? <Star size={iconSize.enLinea} color={color.accent} weight="fill" /> : null}
            <Text style={[type.caption, styles.flexible, { color: color.textMuted }]} numberOfLines={1}>
              {organizador}
            </Text>
          </View>
        </Pressable>
        {evento.agotado ? (
          <Button variante="primary" disabled>
            Agotado
          </Button>
        ) : (
          <Button variante="primary" onPress={onComprar}>
            Comprar
          </Button>
        )}
      </View>

      {evento.categoria ? (
        <View style={styles.categoria} pointerEvents="none">
          <Tag variante="neutral">{evento.categoria}</Tag>
        </View>
      ) : null}
      {accionSuperior ? <View style={styles.accionSuperior}>{accionSuperior}</View> : null}
    </View>
  );
}

/** Tarjeta esqueleto mientras carga Explorar. */
export function EventCardEsqueleto() {
  return (
    <View style={styles.tarjeta} aria-hidden>
      <ImagenEsqueleto alto={ALTO_IMAGEN} />
      <View style={styles.cuerpo}>
        <View style={[styles.lineaEsqueleto, { width: '70%' }]} />
        <View style={[styles.lineaEsqueleto, { width: '45%' }]} />
        <View style={[styles.lineaEsqueleto, { width: '55%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    boxShadow: shadow.sm,
    overflow: 'hidden',
  },
  cuerpo: { padding: space.padCard, gap: space.s2 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: space.gapTight },
  flexible: { flexShrink: 1 },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s4,
    paddingHorizontal: space.padCard,
    paddingBottom: space.padCard,
  },
  precio: { flex: 1, gap: space.s1 },
  categoria: { position: 'absolute', top: space.s4, left: space.s4 },
  accionSuperior: { position: 'absolute', top: space.s1, right: space.s1 },
  lineaEsqueleto: { height: space.s4, borderRadius: radius.sm, backgroundColor: color.neutral900 },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: -2 },
});
