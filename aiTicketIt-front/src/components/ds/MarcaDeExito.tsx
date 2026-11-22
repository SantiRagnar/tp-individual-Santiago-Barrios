import { CheckCircle } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { color, radius } from '@/theme/tokens';

const DIAMETRO = 96;
const ICONO = 48;

/** Marca de la pantalla de éxito (design-system.md § Feedback, MarcaDeExito). Decorativa: el título comunica. */
export function MarcaDeExito() {
  return (
    <View style={styles.marca} aria-hidden>
      <CheckCircle size={ICONO} color={color.accent} weight="fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  marca: {
    width: DIAMETRO,
    height: DIAMETRO,
    borderRadius: radius.pill,
    backgroundColor: color.accent900,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 32px ${color.accent600}`,
  },
});
