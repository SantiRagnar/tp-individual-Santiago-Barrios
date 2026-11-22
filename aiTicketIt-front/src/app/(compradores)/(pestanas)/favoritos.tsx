import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarFavoritos, type EventoCompradorResumen } from '@/api/compradores';
import { Button } from '@/components/ds/Button';
import { EstadoVacio } from '@/components/ds/EstadoVacio';
import { FavoritoCard } from '@/components/ds/FavoritoCard';
import { useFavoritos } from '@/favoritos/FavoritosProvider';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

const SIN_CONEXION = 'No pudimos conectarnos. Probá de nuevo en un rato.';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; eventos: EventoCompradorResumen[] };

/** Compradores 11 · Favoritos (specs/003-explorar-detalle-evento/contracts/rutas-front.md). */
export default function Favoritos() {
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const { esFavorito } = useFavoritos();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  /** Pide la lista; devuelve una función que descarta la respuesta si la pantalla ya no la espera. */
  const cargar = useCallback(() => {
    let vigente = true;
    listarFavoritos(token).then(
      (eventos) => vigente && setEstado({ tipo: 'listo', eventos }),
      () => vigente && setEstado((e) => (e.tipo === 'listo' ? e : { tipo: 'error' })),
    );
    return () => {
      vigente = false;
    };
  }, [token]);

  // Se recarga cada vez que la pestaña toma foco, para reflejar lo marcado en Explorar o el Detalle.
  useFocusEffect(cargar);

  const reintentar = () => {
    setEstado({ tipo: 'cargando' });
    cargar();
  };

  // Al quitar el corazón, la tarjeta se va de la lista al instante (FR-019).
  const visibles = estado.tipo === 'listo' ? estado.eventos.filter((e) => esFavorito(e.id, e.esFavorito)) : [];

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <FlatList
        data={visibles}
        keyExtractor={(evento) => evento.id}
        renderItem={({ item }) => (
          <FavoritoCard evento={item} onPress={() => router.push({ pathname: '/eventos/[id]', params: { id: item.id } })} />
        )}
        ListHeaderComponent={
          <Text style={[type.h4, styles.titulo]} accessibilityRole="header">
            Favoritos
          </Text>
        }
        ListEmptyComponent={
          estado.tipo === 'cargando' ? (
            <ActivityIndicator color={color.accent} accessibilityLabel="Cargando favoritos" />
          ) : estado.tipo === 'error' ? (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <Text style={[type.bodySm, { color: color.text }]}>{SIN_CONEXION}</Text>
              <Button variante="secondary" onPress={reintentar}>
                Reintentar
              </Button>
            </View>
          ) : (
            <EstadoVacio titulo="Todavía no guardaste eventos" texto="Tocá el corazón en un evento para encontrarlo acá." />
          )
        }
        ItemSeparatorComponent={Separador}
        contentContainerStyle={styles.contenido}
      />
    </SafeAreaView>
  );
}

function Separador() {
  return <View style={{ height: space.gapStack }} />;
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingBottom: space.s8 },
  titulo: { color: color.text, paddingTop: space.s6, paddingBottom: space.gapSection },
  error: { gap: space.s4, alignItems: 'flex-start' },
});
