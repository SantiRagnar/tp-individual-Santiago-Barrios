import { StyleSheet, Text, View } from 'react-native';

import { DesktopNav } from '@/components/ds/DesktopNav';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

/** Organizadores 02 · Mis eventos — versión mínima de esta feature: DesktopNav + título. */
export default function MisEventos() {
  const { organizador } = useSesion();
  if (!organizador) return null;

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <View style={styles.pageHead}>
        <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
          Mis eventos
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  pageHead: { paddingHorizontal: space.padPageDesktop, paddingTop: space.padPageDesktop },
});
