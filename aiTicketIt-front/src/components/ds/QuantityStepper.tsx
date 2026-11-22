import { Minus, Plus } from 'phosphor-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, iconSize, opacidadDeshabilitado, radius, size, space, tinte, type } from '@/theme/tokens';

type Props = {
  valor: number;
  min: number;
  max: number;
  onCambiar: (valor: number) => void;
  deshabilitado?: boolean;
};

/**
 * Cantidad de entradas (design-system.md § QuantityStepper): "Restar" / "Sumar" secundarios de 44px que se
 * deshabilitan en su límite, valor tabular y ayuda "Máximo N" o "Sin cupo".
 */
export function QuantityStepper({ valor, min, max, onCambiar, deshabilitado = false }: Props) {
  const sinCupo = deshabilitado || max < min;
  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <BotonPaso etiqueta="Restar una entrada" deshabilitado={sinCupo || valor <= min} onPress={() => onCambiar(valor - 1)}>
          <Minus size={iconSize.barra} color={color.text} />
        </BotonPaso>
        <Text style={[type.h4, styles.valor]} accessibilityLiveRegion="polite" accessibilityLabel={`${valor} entradas`}>
          {sinCupo ? 0 : valor}
        </Text>
        <BotonPaso etiqueta="Sumar una entrada" deshabilitado={sinCupo || valor >= max} onPress={() => onCambiar(valor + 1)}>
          <Plus size={iconSize.barra} color={color.text} />
        </BotonPaso>
      </View>
      <Text style={[type.caption, { color: color.textMuted }]}>{sinCupo ? 'Sin cupo' : `Máximo ${max}`}</Text>
    </View>
  );
}

function BotonPaso({
  etiqueta,
  deshabilitado,
  onPress,
  children,
}: {
  etiqueta: string;
  deshabilitado: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.boton,
        deshabilitado && { opacity: opacidadDeshabilitado },
        !deshabilitado && hovered && { backgroundColor: tinte.textoHover },
        !deshabilitado && pressed && { backgroundColor: tinte.textoPresionado },
        focused && Platform.OS === 'web' && styles.foco,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: space.s2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.s6 },
  valor: { minWidth: size.touchTarget, textAlign: 'center', color: color.text, fontVariant: ['tabular-nums'] },
  boton: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
});
