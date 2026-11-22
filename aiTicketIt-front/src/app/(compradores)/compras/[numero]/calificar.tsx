import { router, useLocalSearchParams } from 'expo-router';
import { Info } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { calificarCompra, obtenerCompra, type Compra, type MotivoNoCalificable } from '@/api/compras';
import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { SelectorEstrellas } from '@/components/ds/SelectorEstrellas';
import { TextField } from '@/components/ds/TextField';
import { marcarCalificacionNueva } from '@/lib/calificacionesRecientes';
import { contadorCaracteres, entradas, fechaCorta, numeroCompra, palabraPuntaje } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, iconSize, space, type } from '@/theme/tokens';

const LARGO_MAXIMO = 500;

/** Nota cuando no se puede calificar (pantallas.md § Compradores 12, feature 006). */
const NOTA_POR_MOTIVO: Record<MotivoNoCalificable, string> = {
  YA_CALIFICADA: 'Esta compra ya fue calificada.',
  NO_UTILIZADA: 'Solo podés calificar una entrada utilizada.',
};

type Estado = { tipo: 'cargando' } | { tipo: 'noEncontrada' } | { tipo: 'error' } | { tipo: 'listo'; compra: Compra };

/**
 * Compradores 12 · Calificar experiencia (specs/006-calificaciones-opiniones/contracts/rutas-front.md).
 * Si la compra ya está calificada se muestra lo guardado, sin acción (FR-011, FR-019). Al enviar: desde el
 * Detalle (`desde=detalle`) se vuelve a él; desde Mis compras se reemplaza por el Detalle (research R9).
 */
export default function CalificarExperiencia() {
  const { numero, desde } = useLocalSearchParams<{ numero: string; desde?: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const { bottom } = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  const cargar = useCallback(
    () =>
      obtenerCompra(token, numero).then(
        (compra) => setEstado({ tipo: 'listo', compra }),
        (error) => {
          const noEncontrada = error instanceof ErrorApi && error.codigo === 'COMPRA_NO_ENCONTRADA';
          setEstado((e) => (noEncontrada ? { tipo: 'noEncontrada' } : e.tipo === 'listo' ? e : { tipo: 'error' }));
        },
      ),
    [token, numero],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (estado.tipo === 'cargando') return <PantallaCargando etiqueta="Cargando la compra" />;
  if (estado.tipo === 'noEncontrada') {
    return <PantallaDeAviso mensaje="No encontramos esta compra." accion="Volver a Mis compras" onAccion={() => router.dismissTo('/mis-compras')} />;
  }
  if (estado.tipo === 'error') {
    return (
      <PantallaDeAviso
        mensaje={SIN_CONEXION}
        accion="Reintentar"
        onAccion={() => {
          setEstado({ tipo: 'cargando' });
          void cargar();
        }}
      />
    );
  }

  const { compra } = estado;
  const guardada = compra.calificacion;
  const puedeEnviar = compra.acciones.calificar && puntaje !== null && !enviando;
  const puntajeVisible = guardada ? guardada.puntaje : puntaje;

  const enviar = () => {
    if (!puedeEnviar || puntaje === null) return;
    setEnviando(true);
    setSinConexion(false);
    calificarCompra(token, compra.numero, { puntaje, comentario: comentario.trim() || null }).then(
      () => {
        marcarCalificacionNueva();
        if (desde === 'detalle') router.back();
        else router.replace({ pathname: '/compras/[numero]', params: { numero: compra.numero } });
      },
      (error) => {
        setEnviando(false);
        // 409: ya calificada (o dejó de poder calificarse); se recarga para mostrar lo guardado.
        if (error instanceof ErrorApi && error.status === 409) void cargar();
        else if (error instanceof ErrorApi && error.codigo === 'COMPRA_NO_ENCONTRADA') setEstado({ tipo: 'noEncontrada' });
        else if (!(error instanceof ErrorApi && error.codigo === 'SESION_INVALIDA')) setSinConexion(true);
      },
    );
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo="Calificar experiencia" subtitulo={`${compra.evento.nombre} · ${fechaCorta(compra.evento.fechaHora)}`} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={[type.caption, { color: color.textMuted }]}>
          {`Compra ${numeroCompra(compra.numero)} · ${entradas(compra.tipoDeEntrada.nombre, compra.cantidad)}`}
        </Text>
        <View style={styles.encabezado}>
          <Text style={[type.h4, { color: color.text }]} accessibilityRole="header">
            ¿Cómo fue tu experiencia?
          </Text>
          <Text style={[type.bodySm, { color: color.textLabel }]}>
            {`Tu puntaje y tu comentario se publican en los eventos de ${compra.evento.organizador.nombre}, para que otros compradores sepan qué esperar.`}
          </Text>
        </View>

        <View style={styles.puntaje}>
          <Text style={[type.label, { color: color.textLabel }]}>Puntaje</Text>
          <SelectorEstrellas
            valor={puntajeVisible}
            onCambiar={compra.acciones.calificar ? setPuntaje : undefined}
            deshabilitado={!compra.acciones.calificar || enviando}
          />
          <Text style={[type.bodySm, { color: puntajeVisible ? color.accent300 : color.textMuted }]} accessibilityLiveRegion="polite">
            {palabraPuntaje(puntajeVisible)}
          </Text>
        </View>

        {guardada ? (
          <View style={styles.puntaje}>
            <Text style={[type.label, { color: color.textLabel }]}>Tu comentario</Text>
            <Text style={[type.bodySm, { color: color.textLabel }]}>{guardada.comentario ?? 'Sin comentario.'}</Text>
          </View>
        ) : compra.acciones.calificar ? (
          <TextField
            label="Comentario (opcional)"
            value={comentario}
            onChangeText={setComentario}
            placeholder="Qué te gustó, qué mejorarías, cómo fue el ingreso…"
            multiline
            maxLength={LARGO_MAXIMO}
            contador={contadorCaracteres(comentario.length, LARGO_MAXIMO)}
          />
        ) : null}

        {compra.motivoNoCalificable ? (
          <View style={styles.nota}>
            <Info size={iconSize.enLinea} color={color.textMuted} />
            <Text style={[type.caption, styles.textoNota]}>{NOTA_POR_MOTIVO[compra.motivoNoCalificable]}</Text>
          </View>
        ) : null}

        {sinConexion ? (
          <Text style={[type.bodySm, { color: color.text }]} accessibilityLiveRegion="polite">
            {SIN_CONEXION}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]}>
        <Button variante="cta" enviando={enviando} disabled={!puedeEnviar} onPress={enviar}>
          Enviar calificación
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, paddingBottom: space.s8, gap: space.gapSection },
  encabezado: { gap: space.s2 },
  puntaje: { gap: space.s3 },
  nota: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 },
  textoNota: { flex: 1, color: color.textMuted },
  pie: {
    paddingHorizontal: space.padScreenX,
    paddingTop: space.padCard,
    borderTopWidth: 1,
    borderTopColor: color.divider,
    backgroundColor: color.bg,
  },
});
