import { Stack } from 'expo-router';

import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

/**
 * Panel de organizadores (contracts/rutas-front.md). Solo mira la sesión de organizador (FR-016):
 * un comprador con sesión que abre /organizadores/mis-eventos termina en el Ingreso del panel.
 */
export default function OrganizadoresLayout() {
  const { organizador } = useSesion();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Protected guard={!organizador}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!organizador}>
        <Stack.Screen name="mis-eventos" />
        {/* `nuevo` antes que `[id]`, para que no se tome como un id (contracts/rutas-front.md). */}
        <Stack.Screen name="eventos/nuevo" />
        <Stack.Screen name="eventos/[id]/index" />
        <Stack.Screen name="eventos/[id]/editar" />
      </Stack.Protected>
    </Stack>
  );
}
