import { Image } from 'expo-image';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { urlDeImagen } from '@/api/eventos';
import { color, type } from '@/theme/tokens';

/**
 * Imagen del evento a todo el ancho, o un espacio neutro con "Imagen del evento" si no tiene
 * (nunca una imagen rota). La usan las tarjetas de las dos apps (alto fijo) y el Detalle del comprador
 * ('100%' dentro de un contenedor 16:9, design-system.md § Imágenes).
 */
export function ImagenDeEvento({ imagenUrl, alto }: { imagenUrl: string | null; alto: DimensionValue }) {
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

/** Espacio neutro sin texto, para tarjetas esqueleto. */
export function ImagenEsqueleto({ alto }: { alto: number }) {
  return <View style={[styles.placeholder, { height: alto }]} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: color.neutral900,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
