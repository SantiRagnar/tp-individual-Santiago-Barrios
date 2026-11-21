import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { crearEvento, subirImagen, type EstadoGuardable, type EventoEntrada } from '@/api/eventos';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { FormularioEvento } from '@/components/ds/FormularioEvento';
import { formVacio } from '@/lib/validacionEvento';
import { useSesion } from '@/sesion/SesionProvider';
import { color } from '@/theme/tokens';

/** Organizadores 03 · Crear evento (contracts/rutas-front.md § Navegación). */
export default function CrearEvento() {
  const { organizador } = useSesion();
  const [inicial] = useState(formVacio);
  if (!organizador) return null;
  const { token } = organizador;

  async function guardar(entrada: EventoEntrada, estado: EstadoGuardable) {
    const evento = await crearEvento(token, entrada);
    if (estado === 'Publicado') {
      // replace: Volver desde el Detalle no regresa al formulario.
      router.replace({ pathname: '/organizadores/eventos/[id]', params: { id: evento.id } });
    } else {
      router.dismissTo('/organizadores/mis-eventos');
    }
  }

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/organizadores/mis-eventos'));

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <FormularioEvento
        modo="crear"
        inicial={inicial}
        onGuardar={guardar}
        subirImagen={(archivo) => subirImagen(token, archivo)}
        onVolver={volver}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
});
