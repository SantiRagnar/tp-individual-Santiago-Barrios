import { WarningCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { color, iconSize, radius, size, space, type } from '@/theme/tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (texto: string) => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  /** Mensaje de error a mostrar debajo; null/undefined = sin error. */
  error?: string | null;
  placeholder?: string;
  secureTextEntry?: boolean;
  /** 36px (desktop) en lugar de 44px (mobile). */
  compacto?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Textarea (≥ 90px de alto). */
  multiline?: boolean;
  maxLength?: number;
  /** Texto chico a la derecha debajo del campo (p. ej. el contador "N/2000"). */
  contador?: string;
  /** Nombre accesible si difiere del label visible (p. ej. "Cupo de la entrada 2"). */
  accessibilityLabel?: string;
};

/** Alto mínimo del textarea (design-system.md § Field). */
const ALTO_TEXTAREA = 90;

/** Campo del design system: label arriba, fondo surface, borde divider, foco en acento, error sin rojo. */
export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  error,
  placeholder,
  secureTextEntry,
  compacto = false,
  keyboardType,
  autoComplete,
  textContentType,
  returnKeyType,
  autoCapitalize = 'none',
  multiline = false,
  maxLength,
  contador,
  accessibilityLabel,
}: Props) {
  const [enfocado, setEnfocado] = useState(false);
  const invalido = Boolean(error);

  return (
    <View style={styles.campo}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setEnfocado(true)}
        onBlur={() => {
          setEnfocado(false);
          onBlur?.();
        }}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={color.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        maxLength={maxLength}
        accessibilityLabel={accessibilityLabel ?? label}
        aria-invalid={invalido}
        style={[
          type.bodySm,
          styles.input,
          multiline
            ? { minHeight: ALTO_TEXTAREA, paddingVertical: space.s3, textAlignVertical: 'top' }
            : { height: compacto ? size.controlHeight : size.touchTarget },
          enfocado && styles.inputEnfocado,
          invalido && styles.inputInvalido,
          Platform.OS === 'web' && styles.sinOutlineNativo,
        ]}
      />
      {invalido || contador ? (
        <View style={styles.pie}>
          {invalido ? <FieldError mensaje={error!} /> : <View />}
          {contador ? <Text style={[type.label, { color: color.textMuted }]}>{contador}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function FieldError({ mensaje }: { mensaje: string }) {
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <WarningCircle size={iconSize.enLinea} color={color.accent300} />
      <Text style={[type.label, { color: color.accent300 }]}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { gap: space.s2, alignSelf: 'stretch' },
  label: { color: color.textLabel },
  input: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
    color: color.text,
  },
  inputEnfocado: { borderColor: color.accent },
  inputInvalido: { borderColor: color.accent400 },
  sinOutlineNativo: { outlineWidth: 0 },
  error: { flexDirection: 'row', alignItems: 'center', gap: space.gapTight, flexShrink: 1 },
  pie: { flexDirection: 'row', justifyContent: 'space-between', gap: space.s3 },
});
