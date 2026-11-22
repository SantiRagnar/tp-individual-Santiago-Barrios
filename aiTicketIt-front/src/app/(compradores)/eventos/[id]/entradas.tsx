import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { obtenerEventoComprador, type EventoCompradorDetalle, type TipoDeEntradaComprador } from '@/api/compradores';
import { ActionFooter } from '@/components/ds/ActionFooter';
import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { QuantityStepper } from '@/components/ds/QuantityStepper';
import { RadioCard } from '@/components/ds/RadioCard';
import { fechaCorta, plata } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

/** Tope por compra (pantallas.md § Compra: min(lugares disponibles del tipo, 10)). */
const MAXIMO_POR_COMPRA = 10;

type Aviso = 'lugares' | 'precio';
type Estado = { tipo: 'cargando' } | { tipo: 'noDisponible' } | { tipo: 'error' } | { tipo: 'listo'; evento: EventoCompradorDetalle };

const maximoDe = (tipo: TipoDeEntradaComprador | undefined) => (tipo ? Math.min(tipo.disponibles, MAXIMO_POR_COMPRA) : 0);
const primeroConLugares = (evento: EventoCompradorDetalle) => evento.tiposDeEntrada.find((t) => t.disponibles > 0);

function textoDeAviso(aviso: Aviso, tipoNombre: string) {
  return aviso === 'lugares'
    ? `Ya no quedan suficientes entradas de ${tipoNombre}.`
    : `El precio de ${tipoNombre} cambió. Revisá tu compra.`;
}

/**
 * Compradores 05 · Elegir entradas (specs/004-compra-pago-mis-compras/contracts/rutas-front.md).
 * Pide el evento cada vez que toma foco: al volver de Pago con `aviso` (FR-028, FR-030) se ven los lugares y
 * precios actuales, y si el tipo elegido quedó Agotada o ya no existe se preselecciona el primero con lugares.
 */
export default function ElegirEntradas() {
  const { id, aviso, tipoNombre } = useLocalSearchParams<{ id: string; aviso?: Aviso; tipoNombre?: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [tipoId, setTipoId] = useState<string | null>(null);
  // Espejo de tipoId para leerlo al recargar el evento sin reiniciar el efecto de foco.
  const tipoIdActual = useRef<string | null>(null);
  const fijarTipo = useCallback((nuevo: string | null) => {
    tipoIdActual.current = nuevo;
    setTipoId(nuevo);
  }, []);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Pide el evento; `vigente` evita aplicar una respuesta que llega después de perder el foco.
  const cargar = useCallback(
    (vigente: () => boolean = () => true) =>
      obtenerEventoComprador(token, id).then(
        (evento) => {
          if (!vigente()) return;
          setEstado({ tipo: 'listo', evento });
          // Conserva el tipo elegido si sigue teniendo lugares; si no, el primero con lugares.
          const elegido =
            evento.tiposDeEntrada.find((t) => t.id === tipoIdActual.current && t.disponibles > 0) ?? primeroConLugares(evento);
          fijarTipo(elegido?.id ?? null);
          setCantidad((c) => Math.max(1, Math.min(c, maximoDe(elegido))));
        },
        (error) => {
          if (!vigente()) return;
          const noDisponible = error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO';
          setEstado({ tipo: noDisponible ? 'noDisponible' : 'error' });
        },
      ),
    [token, id, fijarTipo],
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      if (aviso && tipoNombre) {
        setMensaje(textoDeAviso(aviso, tipoNombre));
        router.setParams({ aviso: undefined, tipoNombre: undefined });
      }
      void cargar(() => vigente);
      return () => {
        vigente = false;
      };
    }, [cargar, aviso, tipoNombre]),
  );

  if (estado.tipo === 'cargando') return <PantallaCargando etiqueta="Cargando las entradas" />;
  if (estado.tipo === 'noDisponible') {
    return <PantallaDeAviso mensaje="Este evento no está disponible." accion="Volver a Explorar" onAccion={() => router.dismissTo('/explorar')} />;
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

  const { evento } = estado;
  const elegido = evento.tiposDeEntrada.find((t) => t.id === tipoId);
  const maximo = maximoDe(elegido);
  const sinCupo = !elegido || maximo < 1;

  const elegirTipo = (tipo: TipoDeEntradaComprador) => {
    fijarTipo(tipo.id);
    // Al cambiar de tipo, la cantidad se ajusta al nuevo máximo (FR-005).
    setCantidad((c) => Math.max(1, Math.min(c, maximoDe(tipo))));
  };

  const continuar = () => {
    if (!elegido || sinCupo) return;
    router.push({ pathname: '/eventos/[id]/pago', params: { id, tipo: elegido.id, cantidad: String(cantidad) } });
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo="Elegí tus entradas" subtitulo={`${evento.nombre} · ${fechaCorta(evento.fechaHora)}`} />
      <ScrollView contentContainerStyle={styles.contenido}>
        {mensaje ? (
          <Text style={[type.bodySm, styles.aviso]} accessibilityLiveRegion="polite">
            {mensaje}
          </Text>
        ) : null}
        <View style={styles.seccion} accessibilityRole="radiogroup" accessibilityLabel="Tipo de entrada">
          <Text style={[type.h5, { color: color.text }]}>Tipo de entrada</Text>
          {evento.tiposDeEntrada.map((tipo) => {
            const agotada = tipo.disponibles <= 0;
            return (
              <RadioCard
                key={tipo.id}
                titulo={tipo.nombre}
                secundario={agotada ? 'Agotada' : `Quedan ${tipo.disponibles}`}
                detalle={plata(tipo.precio)}
                elegida={tipo.id === tipoId}
                deshabilitada={agotada}
                onPress={() => elegirTipo(tipo)}
              />
            );
          })}
        </View>
        <View style={styles.seccion}>
          <Text style={[type.h5, { color: color.text }]}>Cantidad</Text>
          <QuantityStepper valor={cantidad} min={1} max={maximo} onCambiar={setCantidad} deshabilitado={sinCupo} />
        </View>
      </ScrollView>
      <ActionFooter etiqueta="Total" valor={plata(sinCupo ? 0 : elegido.precio * cantidad)}>
        <Button variante="cta" onPress={continuar} disabled={sinCupo}>
          Continuar al pago
        </Button>
      </ActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, paddingBottom: space.s8, gap: space.s8 },
  seccion: { gap: space.gapStack },
  aviso: { color: color.text, borderLeftWidth: 2, borderLeftColor: color.accent, paddingLeft: space.s4 },
});
