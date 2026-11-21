import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { editarEvento, obtenerEvento, subirImagen, type EstadoGuardable, type Evento, type EventoEntrada } from '@/api/eventos';
import { Button } from '@/components/ds/Button';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { FormularioEvento } from '@/components/ds/FormularioEvento';
import { formDesdeEvento, type FormEvento } from '@/lib/validacionEvento';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'no-encontrado' }
  | { tipo: 'error' }
  | { tipo: 'listo'; evento: Evento; inicial: FormEvento };

/** Organizadores 03 como Editar evento (FR-019, FR-020, FR-025). */
export default function EditarEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizador } = useSesion();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const token = organizador?.token;

  const irAlDetalle = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/organizadores/eventos/[id]', params: { id } });
  };

  useEffect(() => {
    if (!token || !id) return;
    let vigente = true;
    obtenerEvento(token, id)
      .then((evento) => {
        if (!vigente) return;
        // Un Finalizado no se edita: vuelve al Detalle (que no ofrece Editar).
        if (evento.estado === 'Finalizado') return irAlDetalle();
        setEstado({ tipo: 'listo', evento, inicial: formDesdeEvento(evento) });
      })
      .catch((error) => {
        if (!vigente) return;
        if (error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO') setEstado({ tipo: 'no-encontrado' });
        else setEstado({ tipo: 'error' });
      });
    return () => {
      vigente = false;
    };
    // irAlDetalle solo navega; se recarga al cambiar el evento, la sesión o al reintentar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id, intento]);

  if (!organizador || !token) return null;

  async function guardar(entrada: EventoEntrada, estadoNuevo: EstadoGuardable) {
    try {
      await editarEvento(token!, id, entrada);
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'EVENTO_FINALIZADO') return irAlDetalle();
      throw error;
    }
    if (estadoNuevo === 'Borrador') router.dismissTo('/organizadores/mis-eventos');
    else irAlDetalle();
  }

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      {estado.tipo === 'cargando' ? <ActivityIndicator color={color.accent} style={styles.mensaje} /> : null}
      {estado.tipo === 'no-encontrado' ? (
        <View style={styles.mensaje} accessibilityLiveRegion="polite">
          <Text style={[type.body, { color: color.text }]}>No encontramos el evento.</Text>
          <Link href="/organizadores/mis-eventos">
            <Text style={[type.bodySm, { color: color.accent }]}>Ir a Mis eventos</Text>
          </Link>
        </View>
      ) : null}
      {estado.tipo === 'error' ? (
        <View style={styles.mensaje} accessibilityLiveRegion="polite">
          <Text style={[type.bodySm, { color: color.text }]}>No pudimos conectarnos. Probá de nuevo en un rato.</Text>
          <Button variante="secondary" compacto onPress={() => setIntento((n) => n + 1)}>
            Reintentar
          </Button>
        </View>
      ) : null}
      {estado.tipo === 'listo' ? (
        <FormularioEvento
          modo={estado.evento.estado === 'Publicado' ? 'editarPublicado' : 'editarBorrador'}
          inicial={estado.inicial}
          onGuardar={guardar}
          subirImagen={(archivo) => subirImagen(token, archivo)}
          onVolver={irAlDetalle}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  mensaje: { padding: space.padPageDesktop, gap: space.s4, alignItems: 'flex-start' },
});
