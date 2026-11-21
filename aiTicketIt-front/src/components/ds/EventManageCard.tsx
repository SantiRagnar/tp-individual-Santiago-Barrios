import { Image } from 'expo-image';
import { Plus } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { urlDeImagen, type EventoResumen } from '@/api/eventos';
import { ProgressBar } from '@/components/ds/ProgressBar';
import { TagEstado } from '@/components/ds/Tag';
import { entradasVendidas, fechaCorta } from '@/lib/formato';
import { color, iconSize, radius, shadow, space, tinte, type } from '@/theme/tokens';

/** Alto de la imagen en las tarjetas desktop (design-system.md § Imágenes). */
const ALTO_IMAGEN = 140;
/** Título de la tarjeta: 15px (design-system.md § EventManageCard). */
const titulo = { ...type.body, fontFamily: type.cardTitle.fontFamily };

type EstadoPress = { hovered?: boolean; pressed: boolean; focused?: boolean };

const fondoInteractivo = ({ hovered, pressed, focused }: EstadoPress) => [
  hovered && { backgroundColor: tinte.textoHover },
  pressed && { backgroundColor: tinte.textoPresionado },
  focused && Platform.OS === 'web' && styles.foco,
];

/** Espacio de la imagen cuando el evento no tiene: placeholder neutro con "Imagen del evento". */
export function ImagenDeEvento({ imagenUrl, alto = ALTO_IMAGEN }: { imagenUrl: string | null; alto?: number }) {
  const uri = urlDeImagen(imagenUrl);
  if (!uri) {
    return (
      <View style={[styles.placeholder, { height: alto }]}>
        <Text style={[type.caption, { color: color.textMuted }]}>Imagen del evento</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={{ height: alto, width: '100%' }} contentFit="cover" accessible={false} />;
}

/** Tarjeta de Mis eventos (Organizadores 02). Toda la tarjeta es un botón que abre el Detalle. */
export function EventManageCard({ evento, onPress }: { evento: EventoResumen; onPress: () => void }) {
  const nombre = evento.nombre ?? 'Nombre del evento';
  const fecha = fechaCorta(evento.fechaHora);
  const vendidas = entradasVendidas(evento.vendidas, evento.cupo);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${nombre}, ${fecha}, ${evento.estado}, ${vendidas}`}
      style={(estado: EstadoPress) => [styles.tarjeta, ...fondoInteractivo(estado)]}>
      <ImagenDeEvento imagenUrl={evento.imagenUrl} />
      <View style={styles.cuerpo}>
        <Text style={[titulo, { color: color.text }]} numberOfLines={2}>
          {nombre}
        </Text>
        <View style={styles.filaFecha}>
          <Text style={[type.caption, { color: color.textMuted }]}>{fecha}</Text>
          <TagEstado estado={evento.estado} />
        </View>
        <ProgressBar valor={evento.vendidas} total={evento.cupo} />
        <Text style={[type.label, { color: color.textLabel }]}>{vendidas}</Text>
      </View>
    </Pressable>
  );
}

/** Tile punteado del final de la grilla: equivale a "Crear evento". */
export function NuevoEventoTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={(estado: EstadoPress) => [styles.tarjeta, styles.tile, ...fondoInteractivo(estado)]}>
      <Plus size={iconSize.barra} color={color.accent} />
      <Text style={[type.bodySm, { color: color.accent }]}>Nuevo evento</Text>
    </Pressable>
  );
}

/** Tarjeta esqueleto mientras carga. */
export function EventManageCardEsqueleto() {
  return (
    <View style={styles.tarjeta} aria-hidden>
      <View style={[styles.placeholder, { height: ALTO_IMAGEN }]} />
      <View style={styles.cuerpo}>
        <View style={[styles.lineaEsqueleto, { width: '70%' }]} />
        <View style={[styles.lineaEsqueleto, { width: '45%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    boxShadow: shadow.sm,
    overflow: 'hidden',
  },
  tile: {
    minHeight: ALTO_IMAGEN * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapTight,
    backgroundColor: 'transparent',
    boxShadow: undefined,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.divider,
  },
  placeholder: {
    backgroundColor: color.neutral900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: { padding: space.padCard, gap: space.s3 },
  filaFecha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s3, flexWrap: 'wrap' },
  lineaEsqueleto: { height: space.s4, borderRadius: radius.sm, backgroundColor: color.neutral900 },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
