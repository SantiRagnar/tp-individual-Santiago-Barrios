import type { Icon } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { color, iconSize, space, type } from '@/theme/tokens';

/** Datos del evento (design-system.md § facts): ícono en acento + dato, sin etiqueta. */
export function Facts({ datos }: { datos: { Icono: Icon; texto: string }[] }) {
  return (
    <View style={styles.lista}>
      {datos.map(({ Icono, texto }) => (
        <View key={texto} style={styles.dato}>
          <Icono size={iconSize.barra} color={color.accent} />
          <Text style={[type.bodySm, styles.texto]}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: space.s3 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: space.s3 },
  texto: { flex: 1, color: color.text },
});
