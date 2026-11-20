import { AppleLogo, GoogleLogo } from 'phosphor-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ingresar } from '@/api/sesiones';
import { BrandMark } from '@/components/ds/BrandMark';
import { Button } from '@/components/ds/Button';
import { DividerText } from '@/components/ds/DividerText';
import { FormularioIngreso } from '@/components/ds/FormularioIngreso';
import { useSesion } from '@/sesion/SesionProvider';
import { color, iconSize, opacidadDeshabilitado, size, space, type } from '@/theme/tokens';

/** Compradores 01 · Ingreso (pantallas.md). */
export default function IngresoCompradores() {
  const { iniciar } = useSesion();

  async function onIngresar(email: string, contrasena: string) {
    const datos = await ingresar('comprador', email, contrasena);
    // El guard de Stack.Protected lleva a la pantalla interna (research R9).
    iniciar('comprador', datos);
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.columna}>
          <BrandMark />
          <Text style={[type.body, styles.bajada]}>Ingresá para descubrir eventos y comprar entradas.</Text>

          <FormularioIngreso onIngresar={onIngresar} />

          {/* Fuera de esta feature: visibles y deshabilitados (FR-002). */}
          <DividerText texto="o" deshabilitado />
          <Button
            variante="secondary"
            disabled
            icono={<GoogleLogo size={iconSize.barra} color={color.text} />}>
            Ingresar con Google
          </Button>
          <Button
            variante="secondary"
            disabled
            icono={<AppleLogo size={iconSize.barra} color={color.text} />}>
            Ingresar con Apple
          </Button>
          <Text
            style={[type.caption, styles.registro]}
            accessibilityRole="link"
            accessibilityState={{ disabled: true }}>
            ¿No tenés cuenta? <Text style={{ color: color.accent }}>Registrate</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.padScreenX, paddingVertical: space.s8 },
  columna: { width: '100%', maxWidth: size.frameMobileW, alignSelf: 'center', gap: space.gapSection },
  bajada: { color: color.textMuted },
  registro: { color: color.textMuted, opacity: opacidadDeshabilitado },
});
