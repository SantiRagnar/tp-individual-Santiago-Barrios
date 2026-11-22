import * as ImagePicker from 'expo-image-picker';
import { Image as IconoFoto, Plus, VideoCamera, X } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MaterialMultimedia } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { estilosCampo } from '@/components/ds/estilosCampo';
import { color, iconSize, radius, size, space, tinte, type } from '@/theme/tokens';

type Props = {
  archivos: MaterialMultimedia[];
  onChange: (archivos: MaterialMultimedia[]) => void;
};

/** Nombre del archivo elegido: el que informa el sistema o el último tramo de la uri. */
function nombreDe(asset: ImagePicker.ImagePickerAsset): string {
  return asset.fileName ?? asset.file?.name ?? asset.uri.split('/').pop() ?? 'archivo';
}

/**
 * Material multimedia (research R9): solo se registran nombre y tipo de cada archivo, como tags
 * `tag-neutral` con ícono de foto o video, que se pueden quitar.
 */
export function MaterialMultimediaEditor({ archivos, onChange }: Props) {
  async function agregar() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
    });
    if (resultado.canceled) return;
    const nuevos = resultado.assets.map((asset) => ({
      nombre: nombreDe(asset).slice(0, 200),
      tipo: asset.type === 'video' ? ('video' as const) : ('foto' as const),
    }));
    onChange([...archivos, ...nuevos]);
  }

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>Material multimedia</Text>
      <View style={styles.tags}>
        {archivos.map((archivo, i) => {
          const Icono = archivo.tipo === 'video' ? VideoCamera : IconoFoto;
          return (
            <View key={`${archivo.nombre}-${i}`} style={styles.tag}>
              <Icono size={iconSize.enLinea} color={color.neutral100} />
              <Text style={[type.meta, { color: color.neutral100 }]} numberOfLines={1}>
                {archivo.nombre}
              </Text>
              <Pressable
                onPress={() => onChange(archivos.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${archivo.nombre}`}
                hitSlop={space.s3}
                style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.quitar, hovered && { backgroundColor: tinte.textoHover }]}>
                <X size={iconSize.enLinea} color={color.neutral100} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.accion}>
        <Button variante="ghost" compacto onPress={() => void agregar()} icono={<Plus size={iconSize.enLinea} color={color.text} />}>
          Agregar foto o video
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.gapTight },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.gapTight,
    maxWidth: '100%',
    minHeight: size.chipHeight - space.s3,
    paddingLeft: space.s3,
    paddingRight: space.s1,
    borderRadius: radius.tag,
    backgroundColor: color.neutral800,
  },
  quitar: { borderRadius: radius.sm, padding: space.s1 },
  accion: { alignItems: 'flex-start' },
});
