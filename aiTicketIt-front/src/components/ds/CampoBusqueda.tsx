import { MagnifyingGlass } from 'phosphor-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { color, iconSize, radius, size, space, type } from '@/theme/tokens';

/**
 * Field de búsqueda (design-system.md § Field): sin label visible, con ícono y placeholder.
 * El nombre accesible es el placeholder.
 */
export function CampoBusqueda({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={[styles.campo, enfocado && styles.enfocado]}>
      <MagnifyingGlass size={iconSize.barra} color={color.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        placeholder={placeholder}
        placeholderTextColor={color.textMuted}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        maxLength={100}
        style={[type.bodySm, styles.input, Platform.OS === 'web' && styles.sinOutlineNativo]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s3,
    minHeight: size.touchTarget,
    paddingHorizontal: space.s4,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: radius.md,
  },
  enfocado: { borderColor: color.accent },
  input: { flex: 1, color: color.text, minHeight: size.touchTarget },
  sinOutlineNativo: { outlineWidth: 0 },
});
