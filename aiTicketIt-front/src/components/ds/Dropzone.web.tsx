import { useState, type DragEvent } from 'react';
import { Pressable, View } from 'react-native';

import {
  ContenidoDropzone,
  estilosDropzone,
  ImagenCargada,
  MarcoDropzone,
  TEXTO_DROPZONE,
  useSubidaDeImagen,
  type DropzoneProps,
} from '@/components/ds/dropzoneComun';

/** Imagen del evento en web: clic abre el selector de archivos y además se puede arrastrar (research R10). */
export function Dropzone({ imagenUrl, subir, onImagen }: DropzoneProps) {
  const { subiendo, error, elegir, procesar } = useSubidaDeImagen({ subir, onImagen });
  const [arrastrando, setArrastrando] = useState(false);

  function onDrop(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastrando(false);
    const archivo = evento.dataTransfer.files[0];
    if (!archivo || subiendo) return;
    void procesar({
      uri: URL.createObjectURL(archivo),
      mimeType: archivo.type,
      nombre: archivo.name,
      tamano: archivo.size,
      archivo,
    });
  }

  return (
    <MarcoDropzone error={error}>
      <div
        style={{ display: 'flex', flexDirection: 'column' }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={onDrop}>
        {imagenUrl ? (
          // Con imagen: la zona sigue aceptando que se arrastre otra, y "Cambiar imagen" es su propio botón.
          <View style={[estilosDropzone.zona, arrastrando && estilosDropzone.zonaActiva]}>
            <ImagenCargada imagenUrl={imagenUrl} subiendo={subiendo} onElegir={() => void elegir()} />
          </View>
        ) : (
          <Pressable
            onPress={() => void elegir()}
            disabled={subiendo}
            accessibilityRole="button"
            accessibilityHint={TEXTO_DROPZONE}
            style={[estilosDropzone.zona, arrastrando && estilosDropzone.zonaActiva]}>
            <ContenidoDropzone subiendo={subiendo} />
          </Pressable>
        )}
      </div>
    </MarcoDropzone>
  );
}
