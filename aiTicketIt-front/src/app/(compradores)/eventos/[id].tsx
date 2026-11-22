import { router, useLocalSearchParams } from 'expo-router';
import { CalendarBlank, Clock, MapPin, Ticket } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { listarResenas, obtenerEventoComprador, type EventoCompradorDetalle, type Resena } from '@/api/compradores';
import { ActionFooter } from '@/components/ds/ActionFooter';
import { AppBar } from '@/components/ds/AppBar';
import { BotonFavorito } from '@/components/ds/BotonFavorito';
import { Button } from '@/components/ds/Button';
import { Facts } from '@/components/ds/Facts';
import { ImagenDeEvento } from '@/components/ds/ImagenEvento';
import { Opiniones } from '@/components/ds/Opiniones';
import { Tag } from '@/components/ds/Tag';
import { fechaLarga, hora, plata, rangoDePrecios } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';
/** Fotos de eventos en 16:9 (design-system.md § Imágenes). */
const PROPORCION_IMAGEN = 16 / 9;

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'noDisponible' }
  | { tipo: 'error' }
  | {
      tipo: 'listo';
      evento: EventoCompradorDetalle;
      resenas: Resena[];
      siguiente: string | null;
      cargandoMas: boolean;
      errorMas: boolean;
    };

/** Compradores 04 · Detalle del evento (specs/003-explorar-detalle-evento/contracts/rutas-front.md). */
export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerEventoComprador(token, id).then(
      (evento) => {
        if (!vigente) return;
        const { resenas, siguiente } = evento.resenas;
        setEstado({ tipo: 'listo', evento, resenas, siguiente, cargandoMas: false, errorMas: false });
      },
      (error) => {
        if (!vigente) return;
        // Un 401 ya borró la sesión (pedir → SesionProvider) y el guard lleva al Ingreso.
        const noDisponible = error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO';
        setEstado({ tipo: noDisponible ? 'noDisponible' : 'error' });
      },
    );
    return () => {
      vigente = false;
    };
  }, [token, id, intento]);

  const reintentar = () => {
    setEstado({ tipo: 'cargando' });
    setIntento((i) => i + 1);
  };

  // "Ver más" (FR-024): agrega las 5 siguientes debajo, sin perder las ya mostradas.
  const verMas = useCallback(() => {
    if (estado.tipo !== 'listo' || estado.cargandoMas || !estado.siguiente) return;
    const { siguiente, evento } = estado;
    setEstado({ ...estado, cargandoMas: true, errorMas: false });
    listarResenas(token, evento.organizador.id, siguiente).then(
      (pagina) =>
        setEstado((e) =>
          e.tipo === 'listo'
            ? { ...e, resenas: [...e.resenas, ...pagina.resenas.filter((r) => !e.resenas.some((x) => x.numeroCompra === r.numeroCompra))], siguiente: pagina.siguiente, cargandoMas: false }
            : e,
        ),
      () => setEstado((e) => (e.tipo === 'listo' ? { ...e, cargandoMas: false, errorMas: true } : e)),
    );
  }, [estado, token]);

  if (estado.tipo === 'cargando') {
    return (
      <SafeAreaView style={styles.pantalla}>
        <AppBar />
        <ActivityIndicator style={styles.centrado} color={color.accent} accessibilityLabel="Cargando el evento" />
      </SafeAreaView>
    );
  }

  if (estado.tipo === 'noDisponible' || estado.tipo === 'error') {
    const noDisponible = estado.tipo === 'noDisponible';
    return (
      <SafeAreaView style={styles.pantalla}>
        <AppBar />
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text style={[type.body, { color: color.text }]}>
            {noDisponible ? 'Este evento no está disponible.' : SIN_CONEXION}
          </Text>
          {noDisponible ? (
            <Button variante="secondary" onPress={() => router.dismissTo('/explorar')}>
              Volver a Explorar
            </Button>
          ) : (
            <Button variante="secondary" onPress={reintentar}>
              Reintentar
            </Button>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const { evento } = estado;
  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo={evento.nombre} accion={<BotonFavorito eventoId={evento.id} segunServidor={evento.esFavorito} />} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={{ aspectRatio: PROPORCION_IMAGEN }}>
          <ImagenDeEvento imagenUrl={evento.imagenUrl} alto="100%" />
        </View>
        <View style={styles.cuerpo}>
          {evento.categoria ? <Tag variante="neutral">{evento.categoria}</Tag> : null}
          <Facts
            datos={[
              { Icono: CalendarBlank, texto: fechaLarga(evento.fechaHora) },
              { Icono: Clock, texto: hora(evento.fechaHora) },
              { Icono: MapPin, texto: evento.ubicacion },
              { Icono: Ticket, texto: rangoDePrecios(evento.precioDesde, evento.precioHasta) },
            ]}
          />
          {evento.descripcion ? <Text style={[type.body, { color: color.textLabel }]}>{evento.descripcion}</Text> : null}
          <Opiniones
            organizador={evento.organizador}
            resenas={estado.resenas}
            hayMas={estado.siguiente !== null}
            cargandoMas={estado.cargandoMas}
            onVerMas={verMas}
          />
          {estado.errorMas ? (
            <Text style={[type.bodySm, { color: color.text }]} accessibilityLiveRegion="polite">
              {SIN_CONEXION}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <ActionFooter etiqueta="Desde" valor={plata(evento.precioDesde)}>
        {evento.agotado ? (
          <Button variante="cta" disabled>
            Agotado
          </Button>
        ) : (
          // Sin acción hasta la feature de compra (FR-009).
          <Button variante="cta" onPress={() => {}}>
            Comprar
          </Button>
        )}
      </ActionFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingBottom: space.s8 },
  cuerpo: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, gap: space.s8 },
  centrado: { flex: 1 },
  aviso: { paddingHorizontal: space.padScreenX, paddingTop: space.s8, gap: space.s6, alignItems: 'flex-start' },
});
