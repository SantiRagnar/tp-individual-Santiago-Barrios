import { StyleSheet } from 'react-native';

import { color, radius, size, space, type } from '@/theme/tokens';

/** Estilos compartidos de Field (design-system.md § Field) para los campos que no son TextField. */
export const estilosCampo = StyleSheet.create({
  campo: { gap: space.s2, alignSelf: 'stretch' },
  label: { ...type.label, color: color.textLabel },
  control: {
    minHeight: size.controlHeight,
    justifyContent: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.divider,
    borderRadius: radius.md,
    paddingHorizontal: space.s4,
  },
  controlInvalido: { borderColor: color.accent400 },
  valor: { ...type.bodySm, color: color.text },
  placeholder: { ...type.bodySm, color: color.textMuted },
});

/** Los mismos valores como CSS, para los controles nativos del navegador (archivos .web.tsx). */
export const cssCampo = {
  control: {
    boxSizing: 'border-box',
    width: '100%',
    height: size.controlHeight,
    backgroundColor: color.surface,
    color: color.text,
    border: `1px solid ${color.divider}`,
    borderRadius: radius.md,
    padding: `0 ${space.s4}px`,
    fontFamily: type.bodySm.fontFamily,
    fontSize: type.bodySm.fontSize,
    colorScheme: 'dark',
    outline: 'none',
  },
  // Siempre el `border` completo: mezclarlo con borderColor hace que React avise al quitar uno.
  invalido: { border: `1px solid ${color.accent400}` },
  enfocado: { border: `1px solid ${color.accent}` },
} as const;
