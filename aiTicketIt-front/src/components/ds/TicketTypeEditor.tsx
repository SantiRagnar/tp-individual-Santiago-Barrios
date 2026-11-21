import { Plus, Trash } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { estilosCampo } from '@/components/ds/estilosCampo';
import { FieldError, TextField } from '@/components/ds/TextField';
import { miles } from '@/lib/formato';
import { filtrarNumero, type TipoForm } from '@/lib/validacionEvento';
import { color, iconSize, opacidadDeshabilitado, radius, shadow, size, space, tinte, type } from '@/theme/tokens';

type CampoTipo = 'nombre' | 'cupo' | 'precio';

type Props = {
  tipos: TipoForm[];
  /** Error visible del campo `tiposDeEntrada.{i}.{campo}` o el general (`tiposDeEntrada`). */
  errorDe: (campo: string) => string | null;
  onCambiar: (indice: number, campo: CampoTipo, valor: string) => void;
  onSalir: (clave: string, campo: CampoTipo) => void;
  onAgregar: () => void;
  onQuitar: (indice: number) => void;
  /** Ancho disponible para la grilla. */
  ancho: number;
};

/** Columnas de la grilla: 3 en desktop, menos en pantallas angostas (design-system.md § TicketTypeEditor). */
function columnas(ancho: number) {
  if (ancho >= 720) return 3;
  if (ancho >= 460) return 2;
  return 1;
}

/** Tipos de entrada del evento: tarjetas "Entrada N" + tile "Agregar tipo de entrada". */
export function TicketTypeEditor({ tipos, errorDe, onCambiar, onSalir, onAgregar, onQuitar, ancho }: Props) {
  const { width } = useWindowDimensions();
  const cols = columnas(Math.min(ancho, width));
  const celda = Math.floor((ancho - space.gapGrid * (cols - 1)) / cols);
  const errorGeneral = errorDe('tiposDeEntrada');

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>Tipos de entrada</Text>
      {errorGeneral ? <FieldError mensaje={errorGeneral} /> : null}
      <View style={styles.grilla}>
        {tipos.map((tipo, i) => {
          const numero = i + 1;
          const conVentas = tipo.vendidas > 0;
          const campo = (c: CampoTipo) => `tiposDeEntrada.${i}.${c}`;
          return (
            <View key={tipo.clave} style={[styles.tarjeta, { width: celda }]}>
              <View style={styles.cabecera}>
                <Text style={[type.kicker, { color: color.textMuted }]}>Entrada {numero}</Text>
                <Pressable
                  onPress={() => onQuitar(i)}
                  disabled={conVentas}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar entrada ${numero}`}
                  accessibilityHint={conVentas ? 'Tiene ventas: no se puede quitar' : undefined}
                  accessibilityState={{ disabled: conVentas }}
                  style={({ hovered, focused }: { hovered?: boolean; focused?: boolean }) => [
                    styles.quitar,
                    conVentas && { opacity: opacidadDeshabilitado },
                    !conVentas && hovered && { backgroundColor: tinte.textoHover },
                    focused && Platform.OS === 'web' && styles.foco,
                  ]}>
                  <Trash size={iconSize.enLinea} color={color.textLabel} />
                </Pressable>
              </View>
              {conVentas ? (
                <Text style={[type.label, { color: color.textMuted }]}>Tiene ventas: no se puede quitar</Text>
              ) : null}
              <TextField
                label="Nombre"
                accessibilityLabel={`Nombre de la entrada ${numero}`}
                placeholder="Ej.: Platea"
                value={tipo.nombre}
                onChangeText={(v) => onCambiar(i, 'nombre', v)}
                onBlur={() => onSalir(tipo.clave, 'nombre')}
                error={errorDe(campo('nombre'))}
                autoCapitalize="sentences"
                maxLength={60}
                compacto
              />
              <View style={styles.fila}>
                <View style={styles.mitad}>
                  <TextField
                    label="Cupo"
                    accessibilityLabel={`Cupo de la entrada ${numero}`}
                    value={tipo.cupo}
                    onChangeText={(v) => onCambiar(i, 'cupo', filtrarNumero(v))}
                    onBlur={() => onSalir(tipo.clave, 'cupo')}
                    error={errorDe(campo('cupo'))}
                    keyboardType="number-pad"
                    compacto
                  />
                </View>
                <View style={styles.mitad}>
                  <TextField
                    label="Precio ($)"
                    accessibilityLabel={`Precio de la entrada ${numero}`}
                    value={tipo.precio}
                    onChangeText={(v) => onCambiar(i, 'precio', filtrarNumero(v))}
                    onBlur={() => onSalir(tipo.clave, 'precio')}
                    error={errorDe(campo('precio'))}
                    keyboardType="numbers-and-punctuation"
                    compacto
                  />
                </View>
              </View>
              {conVentas ? (
                <Text style={[type.label, { color: color.textMuted }]}>{miles(tipo.vendidas)} vendidas</Text>
              ) : null}
            </View>
          );
        })}
        <Pressable
          onPress={onAgregar}
          accessibilityRole="button"
          style={({ hovered, focused }: { hovered?: boolean; focused?: boolean }) => [
            styles.tile,
            { width: celda },
            hovered && { backgroundColor: tinte.acentoHover },
            focused && Platform.OS === 'web' && styles.foco,
          ]}>
          <Plus size={iconSize.barra} color={color.accent} />
          <Text style={[type.bodySm, { color: color.accent }]}>Agregar tipo de entrada</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: space.gapGrid },
  tarjeta: {
    gap: space.s3,
    padding: space.padCard,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    boxShadow: shadow.sm,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quitar: {
    width: size.controlHeight,
    height: size.controlHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  fila: { flexDirection: 'row', gap: space.s3 },
  mitad: { flex: 1 },
  tile: {
    minHeight: size.controlHeight * 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapTight,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.divider,
    borderRadius: radius.md,
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
