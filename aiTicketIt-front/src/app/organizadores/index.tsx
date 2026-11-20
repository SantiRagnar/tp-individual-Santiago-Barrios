import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ingresar } from '@/api/sesiones';
import { BrandMark } from '@/components/ds/BrandMark';
import { FormularioIngreso } from '@/components/ds/FormularioIngreso';
import { useSesion } from '@/sesion/SesionProvider';
import { color, radius, shadow, space, type } from '@/theme/tokens';

// Ancho de la tarjeta en desktop; en pantallas chicas ocupa el ancho disponible (FR-003).
const ANCHO_TARJETA = 400;

/** Organizadores 01 · Ingreso (pantallas.md). Sin Google, Apple ni registro. Enter envía. */
export default function IngresoOrganizadores() {
  const { iniciar } = useSesion();

  async function onIngresar(email: string, contrasena: string) {
    const datos = await ingresar('organizador', email, contrasena);
    // El guard de Stack.Protected lleva a la pantalla interna (research R9).
    iniciar('organizador', datos);
  }

  return (
    <ScrollView contentContainerStyle={styles.fondo} keyboardShouldPersistTaps="handled">
      <View style={styles.tarjeta}>
        <BrandMark compacto />
        <Text style={[type.bodySm, styles.bajada]}>Panel de organizadores</Text>
        <FormularioIngreso onIngresar={onIngresar} compacto />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.padScreenX,
    paddingVertical: space.padPageDesktop,
    backgroundColor: color.bg,
  },
  tarjeta: {
    width: '100%',
    maxWidth: ANCHO_TARJETA,
    gap: space.gapSection,
    padding: space.padPageDesktop,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    boxShadow: shadow.md,
  },
  bajada: { color: color.textMuted },
});
