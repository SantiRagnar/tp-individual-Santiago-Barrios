import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { color, space, type } from '@/theme/tokens';

export const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';

/** Pantalla de carga: AppBar vacía + indicador. */
export function PantallaCargando({ etiqueta }: { etiqueta: string }) {
  return (
    <SafeAreaView style={styles.pantalla}>
      <AppBar />
      <ActivityIndicator style={styles.centrado} color={color.accent} accessibilityLabel={etiqueta} />
    </SafeAreaView>
  );
}

/**
 * Pantalla con AppBar (Volver), un mensaje y una acción secundaria: "Este evento no está disponible." +
 * Volver a Explorar, "No encontramos esta compra." + Volver a Mis compras, o el error de conexión + Reintentar.
 */
export function PantallaDeAviso({ mensaje, accion, onAccion }: { mensaje: string; accion: string; onAccion: () => void }) {
  return (
    <SafeAreaView style={styles.pantalla}>
      <AppBar />
      <View style={styles.aviso} accessibilityLiveRegion="polite">
        <Text style={[type.body, { color: color.text }]}>{mensaje}</Text>
        <Button variante="secondary" onPress={onAccion}>
          {accion}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  centrado: { flex: 1 },
  aviso: { paddingHorizontal: space.padScreenX, paddingTop: space.s8, gap: space.s6, alignItems: 'flex-start' },
});
