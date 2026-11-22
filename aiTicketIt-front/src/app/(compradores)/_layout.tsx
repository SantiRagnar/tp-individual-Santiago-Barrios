import { Stack } from 'expo-router';

import { AvisosDeConsultasProvider } from '@/consultas/AvisosDeConsultasProvider';
import { FavoritosProvider } from '@/favoritos/FavoritosProvider';
import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

/**
 * Lado compradores (contracts/rutas-front.md de las features 003 y 004). Solo mira la sesión de comprador (FR-016).
 * Si el guard de una pantalla no se cumple, el router lleva a la primera disponible.
 * FavoritosProvider comparte el corazón entre pantallas; con `key` se reinicia al cambiar de comprador.
 * AvisosDeConsultasProvider muestra el toast de respuestas nuevas (feature 007); solo sondea con sesión.
 */
export default function CompradoresLayout() {
  const { comprador } = useSesion();

  return (
    <FavoritosProvider key={comprador?.comprador.id ?? 'sin-sesion'} token={comprador?.token ?? ''}>
      <AvisosDeConsultasProvider key={comprador?.comprador.id ?? 'sin-sesion'} token={comprador?.token ?? ''}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Protected guard={!comprador}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={!!comprador}>
        <Stack.Screen name="(pestanas)" />
        <Stack.Screen name="eventos/[id]/index" />
        <Stack.Screen name="eventos/[id]/entradas" />
        <Stack.Screen name="eventos/[id]/pago" />
        <Stack.Screen name="compras/[numero]/confirmada" />
        <Stack.Screen name="compras/[numero]/index" />
        <Stack.Screen name="compras/[numero]/consulta" />
        <Stack.Screen name="mis-compras" />
      </Stack.Protected>
    </Stack>
      </AvisosDeConsultasProvider>
    </FavoritosProvider>
  );
}
