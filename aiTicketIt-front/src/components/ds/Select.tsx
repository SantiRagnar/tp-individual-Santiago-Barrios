import { CaretDown, Check } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { estilosCampo } from '@/components/ds/estilosCampo';
import { color, iconSize, radius, shadow, size, space, tinte, type } from '@/theme/tokens';

export type SelectProps<T extends string> = {
  label: string;
  value: T | null;
  opciones: readonly T[];
  placeholder: string;
  onChange: (valor: T | null) => void;
};

/** Select del design system en nativo: abre una hoja con las opciones (research R12). */
export function Select<T extends string>({ label, value, opciones, placeholder, onChange }: SelectProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const elegir = (valor: T | null) => {
    onChange(valor);
    setAbierto(false);
  };

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>{label}</Text>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        style={[estilosCampo.control, styles.fila]}>
        <Text style={value ? estilosCampo.valor : estilosCampo.placeholder}>{value ?? placeholder}</Text>
        <CaretDown size={iconSize.enLinea} color={color.textMuted} />
      </Pressable>

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable style={styles.scrim} onPress={() => setAbierto(false)} accessibilityLabel="Cerrar" />
        <View style={styles.hoja}>
          <Text style={[type.h5, { color: color.text }]}>{label}</Text>
          {[null, ...opciones].map((opcion) => (
            <Pressable
              key={opcion ?? '-'}
              onPress={() => elegir(opcion)}
              accessibilityRole="button"
              accessibilityState={{ selected: opcion === value }}
              style={({ pressed }) => [styles.opcion, pressed && { backgroundColor: tinte.textoPresionado }]}>
              <Text style={[type.body, { color: opcion ? color.text : color.textMuted }]}>{opcion ?? placeholder}</Text>
              {opcion === value ? <Check size={iconSize.enLinea} color={color.accent} /> : null}
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scrim: { flex: 1, backgroundColor: color.scrim },
  hoja: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: shadow.lg,
    padding: space.padScreenX,
    paddingBottom: space.padFooterBottom,
    gap: space.s2,
  },
  opcion: {
    minHeight: size.tabHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.s3,
    borderRadius: radius.md,
  },
});
