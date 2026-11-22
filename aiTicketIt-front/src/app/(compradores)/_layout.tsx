import { Stack } from 'expo-router';

import { FavoritosProvider } from '@/favoritos/FavoritosProvider';
import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

/**
 * Lado compradores (contracts/rutas-front.md). Solo mira la sesión de comprador (FR-016).
 * Si el guard de una pantalla no se cumple, el router lleva a la primera disponible.
 * FavoritosProvider comparte el corazón entre pantallas; con `key` se reinicia al cambiar de comprador.
 */
export default function CompradoresLayout() {
  const { comprador } = useSesion();

  return (
    <FavoritosProvider key={comprador?.comprador.id ?? 'sin-sesion'} token={comprador?.token ?? ''}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Protected guard={!comprador}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!comprador}>
        <Stack.Screen name="(pestanas)" />
        <Stack.Screen name="eventos/[id]" />
      </Stack.Protected>
    </Stack>
    </FavoritosProvider>
  );
}
