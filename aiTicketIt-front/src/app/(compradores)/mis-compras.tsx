import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listarCompras, type Compra } from '@/api/compras';
import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { EstadoVacio } from '@/components/ds/EstadoVacio';
import { SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { PurchaseCard } from '@/components/ds/PurchaseCard';
import { useAvisosDeConsultas } from '@/consultas/AvisosDeConsultasProvider';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; compras: Compra[] };

/**
 * Compradores 08 · Mis compras (specs/004-compra-pago-mis-compras/contracts/rutas-front.md). Pide las compras
 * cada vez que la pantalla toma foco, así refleja pagos y cancelaciones recientes (FR-017).
 */
export default function MisCompras() {
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  const cargar = useCallback(
    (vigente: () => boolean = () => true) =>
      listarCompras(token).then(
        (compras) => vigente() && setEstado({ tipo: 'listo', compras }),
        // Un 401 ya borró la sesión y el guard lleva al Ingreso; lo demás es falta de conexión.
        () => vigente() && setEstado((e) => (e.tipo === 'listo' ? e : { tipo: 'error' })),
      ),
    [token],
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

  // Una respuesta nueva del organizador recarga la lista, así aparece el punto (feature 007, FR-023).
  const { version } = useAvisosDeConsultas();
  const versionVista = useRef(version);
  useEffect(() => {
    if (versionVista.current === version) return;
    versionVista.current = version;
    void cargar();
  }, [version, cargar]);

  const abrir = (numero: string) => router.push({ pathname: '/compras/[numero]', params: { numero } });

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo="Mis compras" />
      {estado.tipo === 'cargando' ? (
        <ActivityIndicator style={styles.centrado} color={color.accent} accessibilityLabel="Cargando tus compras" />
      ) : estado.tipo === 'error' ? (
        <View style={styles.aviso} accessibilityLiveRegion="polite">
          <Text style={[type.body, { color: color.text }]}>{SIN_CONEXION}</Text>
          <Button
            variante="secondary"
            onPress={() => {
              setEstado({ tipo: 'cargando' });
              void cargar();
            }}>
            Reintentar
          </Button>
        </View>
      ) : (
        <FlatList
          data={estado.compras}
          keyExtractor={(compra) => compra.numero}
          renderItem={({ item }) => <PurchaseCard compra={item} onPress={() => abrir(item.numero)} />}
          ItemSeparatorComponent={Separador}
          contentContainerStyle={styles.contenido}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <EstadoVacio titulo="Todavía no compraste entradas" texto="Cuando compres, vas a encontrarlas acá." />
              <Button variante="secondary" onPress={() => router.dismissTo('/explorar')}>
                Explorar eventos
              </Button>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  centrado: { flex: 1 },
  contenido: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, paddingBottom: space.s8 },
  separador: { height: space.gapStack },
  vacio: { alignItems: 'center', gap: space.s4 },
  aviso: { paddingHorizontal: space.padScreenX, paddingTop: space.s8, gap: space.s6, alignItems: 'flex-start' },
});
