import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { obtenerCompra, type Compra } from '@/api/compras';
import { Button } from '@/components/ds/Button';
import { MarcaDeExito } from '@/components/ds/MarcaDeExito';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { Tag } from '@/components/ds/Tag';
import { cuentaRegresiva, entradas, numeroCompra } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, space, type } from '@/theme/tokens';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; compra: Compra };

/**
 * Compradores 07 · Compra confirmada (specs/004-compra-pago-mis-compras/contracts/rutas-front.md).
 * Debajo en la pila está la pantalla donde se tocó Comprar (Pago y Elegir entradas ya salieron): Volver va ahí.
 */
export default function CompraConfirmada() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const { bottom } = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerCompra(token, numero).then(
      (compra) => vigente && setEstado({ tipo: 'listo', compra }),
      () => vigente && setEstado({ tipo: 'error' }),
    );
    return () => {
      vigente = false;
    };
  }, [token, numero, intento]);

  if (estado.tipo === 'cargando') return <PantallaCargando etiqueta="Cargando tu compra" />;
  if (estado.tipo === 'error') {
    return (
      <PantallaDeAviso
        mensaje={SIN_CONEXION}
        accion="Reintentar"
        onAccion={() => {
          setEstado({ tipo: 'cargando' });
          setIntento((i) => i + 1);
        }}
      />
    );
  }

  const { compra } = estado;
  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <MarcaDeExito />
        <Text style={[type.h3, styles.centro]} accessibilityRole="header">
          ¡Compra confirmada!
        </Text>
        <Text style={[type.body, styles.centro, { color: color.textLabel }]}>
          {`${compra.evento.nombre} · ${entradas(compra.tipoDeEntrada.nombre, compra.cantidad)}`}
        </Text>
        {/* Tag se alinea al inicio por defecto; acá va centrado como el resto de la pantalla de éxito. */}
        <View style={styles.tagCentrado}>
          <Tag variante="accent">{`Compra ${numeroCompra(compra.numero)}`}</Tag>
        </View>
        {compra.diasParaEvento !== null ? (
          <Text style={[type.body, styles.centro, { color: color.accent300 }]}>
            {cuentaRegresiva(compra.diasParaEvento, { paraElEvento: true })}
          </Text>
        ) : null}
        <Text style={[type.bodySm, styles.centro, { color: color.textMuted }]}>Vas a encontrar tus entradas en Mis compras.</Text>
      </ScrollView>
      <View style={[styles.acciones, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]}>
        <Button variante="secondary" onPress={() => router.replace({ pathname: '/compras/[numero]', params: { numero: compra.numero } })}>
          Ver mi compra
        </Button>
        <Button variante="ghost" onPress={() => router.dismissTo('/explorar')}>
          Volver a explorar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.gapSection,
    paddingHorizontal: space.padScreenX,
    paddingVertical: space.s8,
  },
  centro: { color: color.text, textAlign: 'center' },
  tagCentrado: { alignSelf: 'center' },
  acciones: { gap: space.gapStack, paddingHorizontal: space.padScreenX },
});
