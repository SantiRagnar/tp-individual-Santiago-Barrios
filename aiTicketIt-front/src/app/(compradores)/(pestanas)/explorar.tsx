import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarEventos, type CriterioExplorar, type Orden } from '@/api/compradores';
import { obtenerPendienteDeCalificar, type Compra } from '@/api/compras';
import { CATEGORIAS, type Categoria } from '@/api/eventos';
import { Avatar } from '@/components/ds/Avatar';
import { BottomSheet } from '@/components/ds/BottomSheet';
import { BotonFavorito } from '@/components/ds/BotonFavorito';
import { Button } from '@/components/ds/Button';
import { CampoBusqueda } from '@/components/ds/CampoBusqueda';
import { FilaDeChips } from '@/components/ds/Chip';
import { MenuPerfil } from '@/components/ds/MenuPerfil';
import { RecordatorioCalificacion } from '@/components/ds/RecordatorioCalificacion';
import { EstadoVacio } from '@/components/ds/EstadoVacio';
import { EventCard, EventCardEsqueleto } from '@/components/ds/EventCard';
import { SegmentedControl } from '@/components/ds/SegmentedControl';
import { useListaPaginada } from '@/hooks/useListaPaginada';
import { versionCalificaciones } from '@/lib/calificacionesRecientes';
import { contadorEventos } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, size, space, type } from '@/theme/tokens';

const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';
const ESQUELETOS = 3;
/** Espera después de la última tecla antes de buscar (research R12). */
const ESPERA_BUSQUEDA_MS = 300;

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: 'fecha', etiqueta: 'Fecha' },
  { valor: 'precio', etiqueta: 'Precio' },
  { valor: 'puntaje', etiqueta: 'Puntaje' },
];

/** Compradores 02 · Explorar (specs/003-explorar-detalle-evento/contracts/rutas-front.md). */
export default function Explorar() {
  const { comprador, cerrarSesion } = useSesion();
  const token = comprador?.token ?? '';
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [orden, setOrden] = useState<Orden>('fecha');

  // Busca recién cuando se deja de escribir; la respuesta de un texto viejo se descarta (useListaPaginada).
  useEffect(() => {
    const espera = setTimeout(() => setBusqueda(texto.trim()), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  const criterio = useMemo<CriterioExplorar>(() => ({ busqueda, categoria, orden }), [busqueda, categoria, orden]);
  const pedirPagina = useCallback(
    async (cursor: string | null, signal: AbortSignal) => {
      const pagina = await listarEventos(token, criterio, cursor, signal);
      return { items: pagina.eventos, total: pagina.total, siguiente: pagina.siguiente };
    },
    [token, criterio],
  );
  const lista = useListaPaginada(pedirPagina, JSON.stringify(criterio));

  // Feature 006 (SC-002): si se guardó una calificación desde la última carga (acá o en Calificar experiencia),
  // al volver a Explorar se recarga la lista para mostrar el puntaje y el orden nuevos. Si no, se conserva.
  const versionVista = useRef(versionCalificaciones());
  const { refrescar } = lista;

  // Recordatorio de calificación (feature 006, FR-014 a FR-016): se pide cada vez que se entra a Explorar.
  // Si falla, no se muestra. Después de calificar, la confirmación queda hasta el próximo foco.
  const [pendiente, setPendiente] = useState<Compra | null>(null);
  const pedirPendiente = useCallback(
    (vigente: () => boolean = () => true) =>
      obtenerPendienteDeCalificar(token).then(
        (compra) => vigente() && setPendiente(compra),
        () => vigente() && setPendiente(null),
      ),
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      void pedirPendiente(() => vigente);
      if (versionVista.current !== versionCalificaciones()) {
        versionVista.current = versionCalificaciones();
        refrescar();
      }
      return () => {
        vigente = false;
      };
    }, [pedirPendiente, refrescar]),
  );

  if (!comprador) return null;
  const { nombre, apellido } = comprador.comprador;
  const abrir = (id: string) => router.push({ pathname: '/eventos/[id]', params: { id } });

  const encabezado = (
    <View style={styles.encabezado}>
      <View style={styles.saludo}>
        <View style={styles.textos}>
          <Text style={[type.h4, { color: color.text }]} accessibilityRole="header">
            Hola, {nombre}
          </Text>
          <Text style={[type.body, { color: color.textLabel }]}>¿Qué querés ver?</Text>
        </View>
        {/* El Avatar abre el Menú de perfil (Compradores 03, feature 004). */}
        <Pressable onPress={() => setMenuAbierto(true)} accessibilityRole="button" accessibilityLabel="Abrir menú de perfil" hitSlop={4}>
          <Avatar nombre={`${nombre} ${apellido}`} tamano={size.avatarMd} />
        </Pressable>
      </View>
      <CampoBusqueda value={texto} onChangeText={setTexto} placeholder="Buscar evento, sala u organizador" />
      <FilaDeChips opciones={CATEGORIAS} valor={categoria} onCambiar={setCategoria} />
      <SegmentedControl etiqueta="Ordenar por" opciones={ORDENES} valor={orden} onCambiar={setOrden} />
      {pendiente ? (
        <RecordatorioCalificacion key={pendiente.numero} token={token} compra={pendiente} onDesactualizado={() => void pedirPendiente()}
          onCalificada={() => {
            versionVista.current = versionCalificaciones();
            refrescar();
          }}
        />
      ) : null}
      {!lista.cargando && lista.error !== 'inicial' ? (
        <Text style={[type.caption, { color: color.textMuted }]} accessibilityLiveRegion="polite">
          {contadorEventos(lista.total)}
        </Text>
      ) : null}
      {lista.error === 'inicial' ? <AvisoSinConexion onReintentar={lista.reintentar} /> : null}
    </View>
  );

  const vacio = lista.cargando ? (
    <View style={styles.lista}>
      {Array.from({ length: ESQUELETOS }, (_, i) => (
        <EventCardEsqueleto key={i} />
      ))}
    </View>
  ) : lista.error === 'inicial' ? undefined : (
    <EstadoVacio titulo="No encontramos eventos" texto="Probá con otra búsqueda o categoría." />
  );

  const pie = lista.cargandoMas ? (
    <ActivityIndicator style={styles.pie} color={color.accent} accessibilityLabel="Cargando más eventos" />
  ) : lista.error === 'siguiente' ? (
    <View style={styles.pie}>
      <AvisoSinConexion onReintentar={lista.reintentar} />
    </View>
  ) : undefined;

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <FlatList
        data={lista.items}
        keyExtractor={(evento) => evento.id}
        renderItem={({ item }) => (
          <EventCard
            evento={item}
            onPress={() => abrir(item.id)}
            onComprar={() => router.push({ pathname: '/eventos/[id]/entradas', params: { id: item.id } })}
            accionSuperior={<BotonFavorito eventoId={item.id} segunServidor={item.esFavorito} fondo />}
          />
        )}
        ListHeaderComponent={encabezado}
        ListEmptyComponent={vacio}
        ListFooterComponent={pie}
        ItemSeparatorComponent={Separador}
        onEndReached={lista.cargarMas}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenido}
      />
      <BottomSheet visible={menuAbierto} onCerrar={() => setMenuAbierto(false)}>
        <MenuPerfil
          nombreCompleto={`${nombre} ${apellido}`}
          onMisCompras={() => {
            setMenuAbierto(false);
            router.push('/mis-compras');
          }}
          onFavoritos={() => {
            setMenuAbierto(false);
            router.navigate('/favoritos');
          }}
          onCerrarSesion={() => {
            setMenuAbierto(false);
            void cerrarSesion('comprador');
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

function AvisoSinConexion({ onReintentar }: { onReintentar: () => void }) {
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
      <Button variante="secondary" onPress={onReintentar}>
        Reintentar
      </Button>
    </View>
  );
}

function Separador() {
  return <View style={{ height: space.gapStack }} />;
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingBottom: space.s8 },
  encabezado: { paddingTop: space.s6, paddingBottom: space.gapSection, gap: space.gapSection },
  saludo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s4 },
  textos: { flex: 1, gap: space.s1 },
  lista: { gap: space.gapStack },
  pie: { paddingVertical: space.gapSection },
  error: { gap: space.s4, alignItems: 'flex-start' },
});
