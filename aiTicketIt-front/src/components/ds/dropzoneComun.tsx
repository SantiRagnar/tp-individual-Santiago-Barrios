import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { urlDeImagen, type ArchivoDeImagen } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { estilosCampo } from '@/components/ds/estilosCampo';
import { FieldError } from '@/components/ds/TextField';
import { color, radius, space, type } from '@/theme/tokens';

export type DropzoneProps = {
  /** Ruta relativa de la imagen actual (/imagenes/…), o null. */
  imagenUrl: string | null;
  subir: (archivo: ArchivoDeImagen) => Promise<{ id: string; url: string }>;
  onImagen: (imagen: { id: string; url: string }) => void;
};

export const LABEL_IMAGEN = 'Imagen del evento';
export const TEXTO_DROPZONE = 'Arrastrá un archivo o hacé clic. JPG o PNG, 1600×900.';

const TIPOS = ['image/jpeg', 'image/png'];
const MAXIMO_BYTES = 5 * 1024 * 1024;
const ALTO_MINIATURA = 140;

/** Tipo MIME a partir del que informa el sistema o, si falta, de la extensión del nombre. */
function tipoDe(mimeType: string | undefined | null, nombre: string | undefined | null): string | null {
  if (mimeType) return mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
  const extension = nombre?.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  return null;
}

export type ArchivoElegido = { uri: string; mimeType?: string | null; nombre?: string | null; tamano?: number; archivo?: Blob };

/** Elegir, validar (tipo y 5 MB) y subir la imagen. Si algo falla, se conserva la imagen anterior. */
export function useSubidaDeImagen({ subir, onImagen }: Pick<DropzoneProps, 'subir' | 'onImagen'>) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function procesar({ uri, mimeType, nombre, tamano, archivo }: ArchivoElegido) {
    const tipoMime = tipoDe(mimeType, nombre);
    if (!tipoMime || !TIPOS.includes(tipoMime)) return setError('La imagen tiene que ser JPG o PNG');
    if (tamano !== undefined && tamano > MAXIMO_BYTES) return setError('La imagen no puede pesar más de 5 MB');

    setError(null);
    setSubiendo(true);
    try {
      onImagen(await subir({ uri, tipoMime, archivo }));
    } catch (e) {
      const codigo = (e as { codigo?: string }).codigo;
      if (codigo === 'IMAGEN_INVALIDA') setError('La imagen tiene que ser JPG o PNG');
      else if (codigo === 'IMAGEN_MUY_GRANDE') setError('La imagen no puede pesar más de 5 MB');
      else setError('No pudimos subir la imagen. Probá de nuevo.');
    } finally {
      setSubiendo(false);
    }
  }

  async function elegir() {
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (resultado.canceled || !resultado.assets[0]) return;
    const asset = resultado.assets[0];
    await procesar({
      uri: asset.uri,
      mimeType: asset.mimeType ?? asset.file?.type,
      nombre: asset.fileName ?? asset.file?.name,
      tamano: asset.fileSize ?? asset.file?.size,
      archivo: asset.file,
    });
  }

  return { subiendo, error, elegir, procesar };
}

/** Contenido de la zona vacía: el texto de formato y medida, o el indicador mientras sube. */
export function ContenidoDropzone({ subiendo }: { subiendo: boolean }) {
  if (subiendo) return <ActivityIndicator color={color.accent} />;
  return <Text style={[type.bodySm, { color: color.textMuted }]}>{TEXTO_DROPZONE}</Text>;
}

/**
 * Con imagen cargada: miniatura + "Cambiar imagen" (ghost). Va fuera del botón de la zona
 * para no anidar botones. Devuelve null si no hay imagen.
 */
export function ImagenCargada({
  imagenUrl,
  subiendo,
  onElegir,
}: {
  imagenUrl: string | null;
  subiendo: boolean;
  onElegir: () => void;
}) {
  const uri = urlDeImagen(imagenUrl);
  if (!uri) return null;
  return (
    <View style={styles.conImagen}>
      <Image source={{ uri }} style={styles.miniatura} contentFit="cover" accessibilityLabel={LABEL_IMAGEN} />
      {subiendo ? (
        <ActivityIndicator color={color.accent} />
      ) : (
        <Button variante="ghost" compacto onPress={onElegir}>
          Cambiar imagen
        </Button>
      )}
    </View>
  );
}

export function MarcoDropzone({ error, children }: { error: string | null; children: React.ReactNode }) {
  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>{LABEL_IMAGEN}</Text>
      {children}
      {error ? <FieldError mensaje={error} /> : null}
    </View>
  );
}

export const estilosDropzone = StyleSheet.create({
  zona: {
    minHeight: ALTO_MINIATURA,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.padCard,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.divider,
    borderRadius: radius.md,
  },
  zonaActiva: { borderColor: color.accent },
});

const styles = StyleSheet.create({
  conImagen: { alignSelf: 'stretch', gap: space.s3, alignItems: 'flex-start' },
  miniatura: { alignSelf: 'stretch', height: ALTO_MINIATURA, borderRadius: radius.md },
});
