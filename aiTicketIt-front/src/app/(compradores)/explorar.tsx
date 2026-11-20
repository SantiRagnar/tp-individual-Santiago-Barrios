import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ds/Avatar';
import { useSesion } from '@/sesion/SesionProvider';
import { color, size, space, type } from '@/theme/tokens';

/** Compradores 02 · Explorar — versión mínima de esta feature: saludo + avatar. */
export default function Explorar() {
  const { comprador } = useSesion();
  if (!comprador) return null;
  const { nombre, apellido } = comprador.comprador;

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.saludo}>
        <Text style={[type.h4, { color: color.text }]}>Hola, {nombre}</Text>
        <Avatar nombre={`${nombre} ${apellido}`} tamano={size.avatarMd} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  saludo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.padScreenX,
    paddingTop: space.s6,
  },
});
