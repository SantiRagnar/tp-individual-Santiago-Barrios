import { Inter_400Regular, Inter_500Medium, useFonts } from '@expo-google-fonts/inter';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { SesionProvider, useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Un solo tema, oscuro (design-system.md).
const tema = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: color.bg, card: color.bg, text: color.text, primary: color.accent },
};

/**
 * La splash se mantiene hasta tener fuentes y sesiones resueltas, así el Ingreso no aparece
 * un instante antes de saltar a la pantalla interna (research R9).
 */
function Navegacion({ fuentesCargadas }: { fuentesCargadas: boolean }) {
  const { cargando } = useSesion();
  const listo = fuentesCargadas && !cargando;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />;
}

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({ Inter_400Regular, Inter_500Medium });

  return (
    <ThemeProvider value={tema}>
      <SesionProvider>
        {/* Si las fuentes fallan, se sigue con la del sistema. */}
        <Navegacion fuentesCargadas={fuentesCargadas || Boolean(errorFuentes)} />
      </SesionProvider>
    </ThemeProvider>
  );
}
