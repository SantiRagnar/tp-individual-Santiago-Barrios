import { Stack } from 'expo-router';

import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

/**
 * Lado compradores (contracts/rutas-front.md). Solo mira la sesión de comprador (FR-016).
 * Si el guard de una pantalla no se cumple, el router lleva a la primera disponible.
 */
export default function CompradoresLayout() {
  const { comprador } = useSesion();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Protected guard={!comprador}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!comprador}>
        <Stack.Screen name="explorar" />
      </Stack.Protected>
    </Stack>
  );
}
