import { Pressable } from 'react-native';

import {
  ContenidoDropzone,
  estilosDropzone,
  ImagenCargada,
  MarcoDropzone,
  TEXTO_DROPZONE,
  useSubidaDeImagen,
  type DropzoneProps,
} from '@/components/ds/dropzoneComun';

/** Imagen del evento en nativo: tocar abre la galería (research R10). */
export function Dropzone({ imagenUrl, subir, onImagen }: DropzoneProps) {
  const { subiendo, error, elegir } = useSubidaDeImagen({ subir, onImagen });

  return (
    <MarcoDropzone error={error}>
      {imagenUrl ? (
        <ImagenCargada imagenUrl={imagenUrl} subiendo={subiendo} onElegir={() => void elegir()} />
      ) : (
        <Pressable
          onPress={() => void elegir()}
          disabled={subiendo}
          accessibilityRole="button"
          accessibilityHint={TEXTO_DROPZONE}
          style={estilosDropzone.zona}>
          <ContenidoDropzone subiendo={subiendo} />
        </Pressable>
      )}
    </MarcoDropzone>
  );
}
