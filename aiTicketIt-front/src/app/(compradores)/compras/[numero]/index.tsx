import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Info } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { cancelarCompra, completarPago, obtenerCompra, type Compra, type MotivoNoCancelable } from '@/api/compras';
import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { DetailList } from '@/components/ds/DetailList';
import { Dialog } from '@/components/ds/Dialog';
import { ImagenDeEvento } from '@/components/ds/ImagenEvento';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { TagCompra } from '@/components/ds/Tag';
import { cuentaRegresiva, entradas, estrellas, fechaYHoraLarga, numeroCompra, plata } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, iconSize, radius, shadow, space, type } from '@/theme/tokens';

/** Fotos de eventos en 16:9 (design-system.md § Imágenes). */
const PROPORCION_IMAGEN = 16 / 9;

/** Nota de por qué no se puede cancelar (FR-020, pantallas.md § Compra). */
const NOTA_POR_MOTIVO: Record<MotivoNoCancelable, string> = {
  UTILIZADA: 'No se puede cancelar: la entrada ya fue utilizada.',
  EVENTO_REALIZADO: 'No se puede cancelar: el evento ya se realizó.',
  REEMBOLSADA: 'Compra cancelada. El reembolso ya fue acreditado.',
  CANCELADA: 'Compra cancelada.',
};

type Estado = { tipo: 'cargando' } | { tipo: 'noEncontrada' } | { tipo: 'error' } | { tipo: 'listo'; compra: Compra };
type Accion = 'pagando' | 'cancelando' | null;

/**
 * Compradores 09 · Detalle de compra (specs/004-compra-pago-mis-compras/contracts/rutas-front.md).
 * Las acciones posibles las decide el servicio (research R7): acá solo se muestran.
 */
export default function DetalleCompra() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const { bottom } = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [accion, setAccion] = useState<Accion>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  const cargar = useCallback(
    (vigente: () => boolean = () => true) =>
      obtenerCompra(token, numero).then(
        (compra) => vigente() && setEstado({ tipo: 'listo', compra }),
        (error) => {
          if (!vigente()) return;
          const noEncontrada = error instanceof ErrorApi && error.codigo === 'COMPRA_NO_ENCONTRADA';
          setEstado((e) => (noEncontrada ? { tipo: 'noEncontrada' } : e.tipo === 'listo' ? e : { tipo: 'error' }));
        },
      ),
    [token, numero],
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void cargar(() => vigente);
      return () => {
        vigente = false;
      };
    }, [cargar]),
  );

  /** Completar pago o cancelar: muestra la compra que devuelve la API; un 409 vuelve a pedir la compra. */
  const ejecutar = (tipo: Exclude<Accion, null>, llamada: () => Promise<Compra>) => {
    setAccion(tipo);
    setSinConexion(false);
    llamada().then(
      (compra) => {
        setAccion(null);
        setDialogoAbierto(false);
        setEstado({ tipo: 'listo', compra });
      },
      (error) => {
        setAccion(null);
        setDialogoAbierto(false);
        if (error instanceof ErrorApi && error.status === 409) void cargar();
        else if (!(error instanceof ErrorApi && error.codigo === 'SESION_INVALIDA')) setSinConexion(true);
      },
    );
  };

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
  const organizador = compra.evento.organizador.nombre;
  const cuerpoCancelar =
    compra.estado === 'Confirmada'
      ? `Se reintegrarán ${plata(compra.monto)} a tu ${compra.medioDePago}. Esta acción no se puede deshacer.`
      : 'La compra se cancelará y se liberarán las entradas reservadas.';

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo={compra.evento.nombre} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[styles.imagen, { aspectRatio: PROPORCION_IMAGEN }]}>
          <ImagenDeEvento imagenUrl={compra.evento.imagenUrl} alto="100%" />
        </View>
        <View style={styles.estado}>
          <TagCompra estado={compra.estado} grande />
          {compra.diasParaEvento !== null ? (
            <Text style={[type.bodySm, { color: color.accent300 }]}>{cuentaRegresiva(compra.diasParaEvento)}</Text>
          ) : null}
        </View>

        <DetailList
          detalles={[
            { termino: 'Fecha', valor: fechaYHoraLarga(compra.evento.fechaHora) },
            { termino: 'Lugar', valor: compra.evento.ubicacion },
            { termino: 'Entradas', valor: entradas(compra.tipoDeEntrada.nombre, compra.cantidad) },
            { termino: 'Total', valor: plata(compra.monto), numerico: true },
            { termino: 'Pago', valor: compra.medioDePago },
            { termino: 'Compra', valor: numeroCompra(compra.numero), numerico: true },
          ]}
        />

        {compra.calificacion ? (
          <View style={styles.tarjeta}>
            <Text style={[type.h5, { color: color.text }]}>Tu calificación</Text>
            <Text style={[type.body, { color: color.accent300 }]} accessibilityLabel={`${compra.calificacion.puntaje} de 5 estrellas`}>
              {estrellas(compra.calificacion.puntaje)}
            </Text>
            <Text style={[type.bodySm, { color: color.textLabel }]}>{compra.calificacion.comentario ?? 'Sin comentario.'}</Text>
            <Text style={[type.caption, { color: color.textMuted }]}>{`Visible en los eventos de ${organizador}`}</Text>
          </View>
        ) : null}
        {compra.acciones.calificar ? (
          <View style={styles.tarjeta}>
            <Text style={[type.h5, { color: color.text }]}>Tu entrada fue utilizada</Text>
            <Text style={[type.bodySm, { color: color.textLabel }]}>
              {`Contales a otros compradores cómo fue tu experiencia con ${organizador}.`}
            </Text>
            {/* Feature 006: al enviar, Calificar experiencia vuelve acá (desde=detalle, research R9). */}
            <Button
              variante="primary"
              onPress={() => router.push({ pathname: '/compras/[numero]/calificar', params: { numero: compra.numero, desde: 'detalle' } })}>
              Calificar experiencia
            </Button>
          </View>
        ) : null}

        {compra.acciones.completarPago ? (
          <Button
            variante="primary"
            enviando={accion === 'pagando'}
            disabled={accion !== null}
            onPress={() => ejecutar('pagando', () => completarPago(token, compra.numero))}>
            Completar pago
          </Button>
        ) : null}

        {compra.motivoNoCancelable ? (
          <View style={styles.nota}>
            <Info size={iconSize.enLinea} color={color.textMuted} />
            <Text style={[type.caption, styles.textoNota]}>{NOTA_POR_MOTIVO[compra.motivoNoCancelable]}</Text>
          </View>
        ) : null}

        {sinConexion ? (
          <Text style={[type.bodySm, { color: color.text }]} accessibilityLiveRegion="polite">
            {SIN_CONEXION}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.pie, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]}>
        {/* Sin acción hasta la feature de consultas (FR-029). */}
        <Button variante="secondary" onPress={() => {}}>
          Tengo una consulta
        </Button>
        {compra.acciones.cancelar ? (
          <Button variante="ghost" disabled={accion !== null} onPress={() => setDialogoAbierto(true)}>
            Cancelar compra
          </Button>
        ) : null}
      </View>

      <Dialog
        visible={dialogoAbierto}
        titulo="¿Cancelar la compra?"
        cuerpo={cuerpoCancelar}
        volver="Volver"
        confirmar="Cancelar compra"
        enviando={accion === 'cancelando'}
        onVolver={() => setDialogoAbierto(false)}
        onConfirmar={() => ejecutar('cancelando', () => cancelarCompra(token, compra.numero))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, paddingBottom: space.s8, gap: space.gapSection },
  imagen: { borderRadius: radius.md, overflow: 'hidden' },
  estado: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s4 },
  tarjeta: { gap: space.s3, padding: space.padCard, borderRadius: radius.md, backgroundColor: color.surface, boxShadow: shadow.sm },
  nota: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s2 },
  textoNota: { flex: 1, color: color.textMuted },
  pie: {
    gap: space.gapStack,
    paddingHorizontal: space.padScreenX,
    paddingTop: space.padCard,
    borderTopWidth: 1,
    borderTopColor: color.divider,
    backgroundColor: color.bg,
  },
});
