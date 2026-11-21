import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { CATEGORIAS, type ArchivoDeImagen, type EstadoGuardable, type EventoEntrada } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { CampoFechaHora } from '@/components/ds/CampoFechaHora';
import { Dropzone } from '@/components/ds/Dropzone';
import { EventPreview } from '@/components/ds/EventPreview';
import { MaterialMultimediaEditor } from '@/components/ds/MaterialMultimedia';
import { Select } from '@/components/ds/Select';
import { TextField } from '@/components/ds/TextField';
import { TicketTypeEditor } from '@/components/ds/TicketTypeEditor';
import { Volver } from '@/components/ds/Volver';
import { ANCHO_VISTA_PREVIA_AL_COSTADO } from '@/lib/grilla';
import {
  aEventoEntrada,
  LARGO_DESCRIPCION,
  notaPrimario,
  tipoVacio,
  validarEvento,
  type Errores,
  type FormEvento,
  type TipoForm,
} from '@/lib/validacionEvento';
import { color, space, type } from '@/theme/tokens';

export type ModoFormulario = 'crear' | 'editarBorrador' | 'editarPublicado';

type Props = {
  modo: ModoFormulario;
  inicial: FormEvento;
  /** Guarda en la API. Si sale bien, la pantalla navega; si falla, el formulario muestra el error. */
  onGuardar: (entrada: EventoEntrada, estado: EstadoGuardable) => Promise<void>;
  subirImagen: (archivo: ArchivoDeImagen) => Promise<{ id: string; url: string }>;
  onVolver: () => void;
};

/** Ancho de la vista previa a la derecha (design-system.md § EventPreview). */
const ANCHO_VISTA_PREVIA = 400;
const ERROR_DE_RED = 'No pudimos conectarnos. Probá de nuevo en un rato.';

/** Campos que se tocan con nombre fijo; los de tipos usan "{clave}.{campo}" (no cambian al renumerar). */
type Tocados = Set<string>;

/** El campo de un error ("tiposDeEntrada.1.cupo") → su clave de "tocado" ("tipo-7.cupo"). */
function claveDeTocado(campo: string, tipos: TipoForm[]): string {
  const partes = campo.split('.');
  if (partes[0] === 'tiposDeEntrada' && partes.length === 3) {
    const tipo = tipos[Number(partes[1])];
    return tipo ? `${tipo.clave}.${partes[2]}` : campo;
  }
  return campo;
}

/**
 * Organizadores 03 · Crear / Editar evento (pantallas.md; FR-008 a FR-018).
 * Errores (FR-013): cada uno aparece cuando su campo ya se tocó. El primario se ve deshabilitado con
 * cualquier error y nunca envía; si se lo toca igual, se muestran todos los errores.
 */
export function FormularioEvento({ modo, inicial, onGuardar, subirImagen, onVolver }: Props) {
  const { width } = useWindowDimensions();
  const [form, setForm] = useState<FormEvento>(inicial);
  const [tocados, setTocados] = useState<Tocados>(new Set());
  const [intento, setIntento] = useState(false);
  const [erroresServidor, setErroresServidor] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const errores = useMemo(() => validarEvento(form, new Date()), [form]);
  const hayErrores = Object.keys(errores).length > 0;

  /** Errores visibles: los del front de campos tocados (o todos tras un intento) + los del back. */
  const visibles = useMemo(() => {
    const resultado: Errores = { ...erroresServidor };
    for (const [campo, mensaje] of Object.entries(errores)) {
      if (intento || tocados.has(claveDeTocado(campo, form.tiposDeEntrada))) resultado[campo] = mensaje;
    }
    return resultado;
  }, [errores, erroresServidor, intento, tocados, form.tiposDeEntrada]);

  const errorDe = (campo: string) => visibles[campo] ?? null;
  const tocar = (clave: string) => setTocados((t) => (t.has(clave) ? t : new Set(t).add(clave)));

  function cambiar(parcial: Partial<FormEvento>) {
    setForm((f) => ({ ...f, ...parcial }));
    setErroresServidor({});
    setErrorGeneral(null);
  }

  function cambiarTipo(indice: number, campo: 'nombre' | 'cupo' | 'precio', valor: string) {
    // Se valida mientras se escribe (design-system.md § Estados): escribir cuenta como tocar.
    tocar(`${form.tiposDeEntrada[indice]!.clave}.${campo}`);
    cambiar({ tiposDeEntrada: form.tiposDeEntrada.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)) });
  }

  const publicado = modo === 'editarPublicado';
  const accion = publicado ? 'guardar' : 'publicar';
  const textoPrimario = publicado ? 'Guardar cambios' : 'Publicar evento';
  const nota = hayErrores ? notaPrimario(Object.keys(visibles), accion) : null;

  async function guardar(estado: EstadoGuardable) {
    setGuardando(true);
    setErrorGeneral(null);
    try {
      await onGuardar(aEventoEntrada(form, estado), estado);
    } catch (error) {
      if (error instanceof ErrorApi && error.campos.length > 0) {
        setErroresServidor(Object.fromEntries(error.campos.map((c) => [c.campo, c.mensaje])));
        setIntento(true);
      } else if (error instanceof ErrorApi && error.codigo !== 'RED') {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral(ERROR_DE_RED);
      }
    } finally {
      setGuardando(false);
    }
  }

  function onPrimario() {
    if (hayErrores) {
      setIntento(true);
      return;
    }
    void guardar('Publicado');
  }

  const alCostado = width >= ANCHO_VISTA_PREVIA_AL_COSTADO;
  const margen = width >= 600 ? space.padPageDesktop : space.padScreenX;
  const anchoFormulario = alCostado ? width - margen * 2 - ANCHO_VISTA_PREVIA - space.gapGrid * 2 : width - margen * 2;

  return (
    <ScrollView contentContainerStyle={[styles.contenido, { paddingHorizontal: margen }]} keyboardShouldPersistTaps="handled">
      <View style={styles.pageHead}>
        <Volver onPress={onVolver} />
        <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
          {modo === 'crear' ? 'Crear evento' : 'Editar evento'}
        </Text>
      </View>

      <View style={[styles.columnas, !alCostado && styles.apiladas]}>
        <View style={[styles.formulario, alCostado && { flex: 1 }]}>
          <Dropzone
            imagenUrl={form.imagenUrl}
            subir={subirImagen}
            onImagen={({ id, url }) => cambiar({ imagenId: id, imagenUrl: url })}
          />
          <TextField
            label="Nombre del evento"
            value={form.nombre}
            onChangeText={(nombre) => {
              tocar('nombre');
              cambiar({ nombre });
            }}
            onBlur={() => tocar('nombre')}
            error={errorDe('nombre')}
            autoCapitalize="sentences"
            maxLength={120}
            compacto
          />
          <TextField
            label="Descripción"
            value={form.descripcion}
            onChangeText={(descripcion) => cambiar({ descripcion })}
            onBlur={() => tocar('descripcion')}
            error={errorDe('descripcion')}
            autoCapitalize="sentences"
            multiline
            maxLength={LARGO_DESCRIPCION}
            contador={`${form.descripcion.length}/${LARGO_DESCRIPCION}`}
          />
          <Select
            label="Categoría"
            value={form.categoria}
            opciones={CATEGORIAS}
            placeholder="Elegí una categoría"
            onChange={(categoria) => cambiar({ categoria })}
          />
          <CampoFechaHora
            value={form.fechaHora}
            onChange={(fechaHora) => {
              cambiar({ fechaHora });
              tocar('fechaHora');
            }}
            onBlur={() => tocar('fechaHora')}
            error={errorDe('fechaHora')}
          />
          <TextField
            label="Ubicación"
            placeholder="Sala y dirección"
            value={form.ubicacion}
            onChangeText={(ubicacion) => {
              tocar('ubicacion');
              cambiar({ ubicacion });
            }}
            onBlur={() => tocar('ubicacion')}
            error={errorDe('ubicacion')}
            autoCapitalize="sentences"
            maxLength={200}
            compacto
          />
          <MaterialMultimediaEditor
            archivos={form.materialMultimedia}
            onChange={(materialMultimedia) => cambiar({ materialMultimedia })}
          />
          <TicketTypeEditor
            tipos={form.tiposDeEntrada}
            errorDe={errorDe}
            ancho={anchoFormulario}
            onCambiar={cambiarTipo}
            onSalir={(clave, campo) => tocar(`${clave}.${campo}`)}
            onAgregar={() => {
              tocar('tiposDeEntrada');
              cambiar({ tiposDeEntrada: [...form.tiposDeEntrada, tipoVacio()] });
            }}
            onQuitar={(indice) => {
              cambiar({ tiposDeEntrada: form.tiposDeEntrada.filter((_, i) => i !== indice) });
              tocar('tiposDeEntrada');
            }}
          />

          <View style={styles.acciones}>
            <View style={styles.botones}>
              <Button
                compacto
                onPress={onPrimario}
                pareceDeshabilitado={hayErrores}
                disabled={guardando}
                accessibilityHint={nota ?? undefined}>
                {textoPrimario}
              </Button>
              {publicado ? null : (
                <Button variante="secondary" compacto onPress={() => void guardar('Borrador')} disabled={guardando}>
                  Guardar borrador
                </Button>
              )}
            </View>
            {nota ? (
              <Text style={[type.label, { color: color.textMuted }]} accessibilityLiveRegion="polite">
                {nota}
              </Text>
            ) : null}
            {errorGeneral ? (
              <Text style={[type.bodySm, { color: color.accent300 }]} accessibilityLiveRegion="polite">
                {errorGeneral}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={alCostado ? { width: ANCHO_VISTA_PREVIA } : undefined}>
          <EventPreview form={form} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingVertical: space.padPageDesktop, gap: space.s8 },
  pageHead: { gap: space.s3 },
  columnas: { flexDirection: 'row', alignItems: 'flex-start', gap: space.gapGrid * 2 },
  apiladas: { flexDirection: 'column', alignItems: 'stretch' },
  formulario: { gap: space.s6 },
  acciones: { gap: space.s3 },
  botones: { flexDirection: 'row', gap: space.s3, flexWrap: 'wrap' },
});
