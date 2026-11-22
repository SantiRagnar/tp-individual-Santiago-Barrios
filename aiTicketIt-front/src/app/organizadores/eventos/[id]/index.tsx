import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { obtenerEvento, type Evento } from '@/api/eventos';
import { listarVentas, marcarUtilizada, type EstadoCompra, type ResumenDeVentas, type Venta } from '@/api/ventas';
import { Button } from '@/components/ds/Button';
import { FilaDeChips } from '@/components/ds/Chip';
import { DesktopNav } from '@/components/ds/DesktopNav';
import { DisponibilidadTipo } from '@/components/ds/DisponibilidadTipo';
import { StatCard } from '@/components/ds/StatCard';
import { TablaVentas } from '@/components/ds/TablaVentas';
import { TagEstado } from '@/components/ds/Tag';
import { Volver } from '@/components/ds/Volver';
import { useListaPaginada } from '@/hooks/useListaPaginada';
import { fechaCorta, plata, textoComprasActivas, textoEntradasVendidas } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'no-encontrado' }
  | { tipo: 'error' }
  | { tipo: 'listo'; evento: Evento };

const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';

/** Chips de Ventas: etiqueta del diseño → estado exacto de la API (contracts/rutas-front.md § Organizadores 04). */
const CHIPS: { etiqueta: string; estado: EstadoCompra }[] = [
  { etiqueta: 'Confirmadas', estado: 'Confirmada' },
  { etiqueta: 'Pendientes', estado: 'Pendiente de pago' },
  { etiqueta: 'Utilizadas', estado: 'Utilizada' },
  { etiqueta: 'Canceladas', estado: 'Cancelada' },
  { etiqueta: 'Reembolsadas', estado: 'Reembolsada' },
];
const ESTADOS_CHIP = CHIPS.map((c) => c.estado);

type FilaVenta = Venta & { id: string };

/**
 * Organizadores 04 · Detalle del evento (disponibilidad y ventas). Feature 005: completa la versión
 * mínima de la 002 (specs/005-panel-evento/contracts/rutas-front.md).
 */
export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizador } = useSesion();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const token = organizador?.token;

  const cargar = useCallback(async () => {
    if (!token || !id) return;
    try {
      setEstado({ tipo: 'listo', evento: await obtenerEvento(token, id) });
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO') setEstado({ tipo: 'no-encontrado' });
      else setEstado({ tipo: 'error' });
    }
  }, [token, id]);

  // Recarga al recibir foco (p. ej. al volver de Editar evento). `version` reinicia también las ventas.
  const [version, setVersion] = useState(0);
  useFocusEffect(
    useCallback(() => {
      void cargar();
      setVersion((v) => v + 1);
    }, [cargar]),
  );

  if (!organizador) return null;

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/organizadores/mis-eventos'));

  return (
    <View style={styles.pantalla}>
      <DesktopNav compania={organizador.organizador.nombre} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <Volver onPress={volver} />
        {estado.tipo === 'cargando' ? <ActivityIndicator color={color.accent} style={styles.cargando} /> : null}

        {estado.tipo === 'no-encontrado' ? <NoEncontrado /> : null}

        {estado.tipo === 'error' ? (
          <View style={styles.bloque} accessibilityLiveRegion="polite">
            <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
            <Button variante="secondary" compacto onPress={() => void cargar()}>
              Reintentar
            </Button>
          </View>
        ) : null}

        {estado.tipo === 'listo' && token ? (
          <>
            <Cabecera evento={estado.evento} />
            <Panel
              key={`${estado.evento.id}-${version}`}
              evento={estado.evento}
              token={token}
              alNoEncontrar={() => setEstado({ tipo: 'no-encontrado' })}
              alRecargarEvento={() => void cargar()}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function NoEncontrado() {
  return (
    <View style={styles.bloque} accessibilityLiveRegion="polite">
      <Text style={[type.body, { color: color.text }]}>No encontramos el evento.</Text>
      <Link href="/organizadores/mis-eventos">
        <Text style={[type.bodySm, { color: color.accent }]}>Ir a Mis eventos</Text>
      </Link>
    </View>
  );
}

function Cabecera({ evento }: { evento: Evento }) {
  return (
    <View style={styles.pageHead}>
      <View style={styles.titulo}>
        <Text style={[type.h3, { color: color.text }]} accessibilityRole="header">
          {evento.nombre ?? 'Nombre del evento'}
        </Text>
        <View style={styles.subtitulo}>
          <Text style={[type.bodySm, { color: color.textMuted }]}>
            {fechaCorta(evento.fechaHora)} · {evento.ubicacion ?? 'Ubicación'}
          </Text>
          <TagEstado estado={evento.estado} />
        </View>
      </View>
      <View style={styles.acciones}>
        {evento.estado === 'Finalizado' ? null : (
          <Button
            variante="secondary"
            compacto
            onPress={() => router.push({ pathname: '/organizadores/eventos/[id]/editar', params: { id: evento.id } })}>
            Editar evento
          </Button>
        )}
        {/* Sin contador: las consultas llegan con su propia feature (FR-002). */}
        <Button variante="secondary" compacto disabled>
          Consultas del evento
        </Button>
      </View>
    </View>
  );
}

/** Disponibilidad, Recaudado y Ventas. El resumen llega con cada página de ventas (research R1). */
function Panel({
  evento,
  token,
  alNoEncontrar,
  alRecargarEvento,
}: {
  evento: Evento;
  token: string;
  alNoEncontrar: () => void;
  alRecargarEvento: () => void;
}) {
  const [filtro, setFiltro] = useState<EstadoCompra | null>(null);
  const [resumen, setResumen] = useState<ResumenDeVentas | null>(null);
  const [numeroEnCurso, setNumeroEnCurso] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const pedirPagina = useCallback(
    async (cursor: string | null, signal: AbortSignal) => {
      try {
        const pagina = await listarVentas(token, evento.id, { estado: filtro, cursor, signal });
        setResumen(pagina.resumen);
        const items: FilaVenta[] = pagina.ventas.map((v) => ({ ...v, id: v.numero }));
        return { items, total: pagina.resumen.porEstado.Todas, siguiente: pagina.siguiente };
      } catch (error) {
        if (error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO') alNoEncontrar();
        throw error;
      }
    },
    [token, evento.id, filtro, alNoEncontrar],
  );
  const lista = useListaPaginada<FilaVenta>(pedirPagina, filtro ?? 'Todas');

  const cambiarFiltro = (nuevo: EstadoCompra | null) => {
    setAviso(null);
    setFiltro(nuevo);
  };

  const marcar = async (numero: string) => {
    setNumeroEnCurso(numero);
    setAviso(null);
    try {
      const respuesta = await marcarUtilizada(token, evento.id, numero);
      setResumen(respuesta.resumen);
      if (filtro === 'Confirmada') lista.quitar(numero);
      else lista.actualizar(numero, () => ({ ...respuesta.venta, id: numero }));
    } catch (error) {
      if (error instanceof ErrorApi && (error.codigo === 'COMPRA_NO_CONFIRMADA' || error.codigo === 'EVENTO_NO_COMENZO')) {
        setAviso(error.message);
        lista.recargar();
      } else if (error instanceof ErrorApi && (error.codigo === 'COMPRA_NO_ENCONTRADA' || error.codigo === 'EVENTO_NO_ENCONTRADO')) {
        alRecargarEvento();
      } else {
        setAviso(SIN_CONEXION);
      }
    } finally {
      setNumeroEnCurso(null);
    }
  };

  const errorInicial = lista.error === 'inicial';

  return (
    <View style={styles.panel}>
      <View style={styles.filaSuperior}>
        <View style={styles.disponibilidad}>
          <Text style={[type.h5, { color: color.text }]} accessibilityRole="header">
            Disponibilidad por tipo de entrada
          </Text>
          {evento.tiposDeEntrada.map((tipo) => (
            <DisponibilidadTipo key={tipo.id} tipo={tipo} />
          ))}
        </View>
        <View style={styles.recaudado}>
          {resumen ? (
            <StatCard
              kicker="Recaudado"
              cifra={plata(resumen.recaudado)}
              aclaracion={`${textoEntradasVendidas(resumen.entradasVendidas)} · ${textoComprasActivas(resumen.comprasActivas)}`}
            />
          ) : errorInicial ? null : (
            <ActivityIndicator color={color.accent} style={styles.cargando} />
          )}
        </View>
      </View>

      <View style={styles.ventas}>
        <Text style={[type.h5, { color: color.text }]} accessibilityRole="header">
          Ventas
        </Text>
        {resumen ? (
          <FilaDeChips
            opciones={ESTADOS_CHIP}
            valor={filtro}
            onCambiar={cambiarFiltro}
            etiquetaTodos={`Todas ${resumen.porEstado.Todas}`}
            etiquetaDe={(e) => `${CHIPS.find((c) => c.estado === e)?.etiqueta} ${resumen.porEstado[e]}`}
            chico
          />
        ) : null}

        {aviso ? (
          <Text style={[type.bodySm, { color: color.accent300 }]} accessibilityLiveRegion="polite">
            {aviso}
          </Text>
        ) : null}

        {errorInicial ? (
          <View style={styles.bloque} accessibilityLiveRegion="polite">
            <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
            <Button variante="secondary" compacto onPress={lista.reintentar}>
              Reintentar
            </Button>
          </View>
        ) : lista.cargando ? (
          <ActivityIndicator color={color.accent} style={styles.cargando} />
        ) : lista.items.length === 0 ? (
          <Text style={[type.bodySm, { color: color.textMuted }]}>No hay ventas con este estado.</Text>
        ) : (
          <>
            <TablaVentas ventas={lista.items} onMarcarUtilizada={(n) => void marcar(n)} numeroEnCurso={numeroEnCurso} />
            {lista.error === 'siguiente' ? (
              <View style={styles.bloque} accessibilityLiveRegion="polite">
                <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
                <Button variante="secondary" compacto onPress={lista.reintentar}>
                  Reintentar
                </Button>
              </View>
            ) : lista.hayMas ? (
              <View style={styles.verMas}>
                <Button variante="secondary" compacto enviando={lista.cargandoMas} onPress={lista.cargarMas}>
                  Ver más
                </Button>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { padding: space.padPageDesktop, gap: space.s6 },
  cargando: { alignSelf: 'flex-start' },
  bloque: { gap: space.s4, alignItems: 'flex-start' },
  pageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.s6,
    flexWrap: 'wrap',
  },
  titulo: { gap: space.s2, flexShrink: 1 },
  subtitulo: { flexDirection: 'row', alignItems: 'center', gap: space.s3, flexWrap: 'wrap' },
  acciones: { flexDirection: 'row', gap: space.s3, flexWrap: 'wrap' },
  panel: { gap: space.s8 },
  // Dos columnas que se apilan en pantallas chicas (flexWrap + minWidth).
  filaSuperior: { flexDirection: 'row', flexWrap: 'wrap', gap: space.gapGrid, alignItems: 'flex-start' },
  disponibilidad: { flexGrow: 2, flexBasis: 420, minWidth: 280, gap: space.gapSection },
  recaudado: { flexGrow: 1, flexBasis: 260, minWidth: 240 },
  ventas: { gap: space.gapSection },
  verMas: { alignItems: 'flex-start' },
});
