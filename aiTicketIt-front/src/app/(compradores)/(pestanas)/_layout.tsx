import { Tabs } from 'expo-router';

import { BottomNav, type Pestana } from '@/components/ds/BottomNav';
import { color } from '@/theme/tokens';

/**
 * Pestañas raíz de compradores: Explorar y Favoritos (research R11 de la feature 003). Viven dentro
 * del Stack de (compradores), así el Detalle se apila arriba y al volver cada pestaña conserva su estado.
 */
export default function PestanasLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg } }}
      tabBar={({ state, navigateToTab }) => (
        <BottomNav
          actual={state.routes[state.index]!.name as Pestana}
          onCambiar={(pestana) => {
            const ruta = state.routes.find((r) => r.name === pestana);
            if (ruta) navigateToTab(ruta.key);
          }}
        />
      )}>
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="favoritos" />
    </Tabs>
  );
}
