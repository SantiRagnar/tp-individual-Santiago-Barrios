import { router, useLocalSearchParams } from 'expo-router';
import { Bank, CreditCard, Info, Wallet, type IconProps } from 'phosphor-react-native';
import { useEffect, useState, type ComponentType } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorApi } from '@/api/cliente';
import { obtenerEventoComprador, type EventoCompradorDetalle } from '@/api/compradores';
import { comprar, MEDIOS_DE_PAGO, type MedioDePago } from '@/api/compras';
import { AppBar } from '@/components/ds/AppBar';
import { Button } from '@/components/ds/Button';
import { PantallaCargando, PantallaDeAviso, SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { RadioCard } from '@/components/ds/RadioCard';
import { ResumenCompra } from '@/components/ds/ResumenCompra';
import { plata } from '@/lib/formato';
import { useSesion } from '@/sesion/SesionProvider';
import { color, iconSize, space, type } from '@/theme/tokens';

/** Ícono de cada medio de pago (design-system.md § RadioCard: credit-card, wallet, bank). */
const ICONO_POR_MEDIO: Record<MedioDePago, ComponentType<IconProps>> = {
  'Tarjeta de crédito': CreditCard,
  'Tarjeta de débito': CreditCard,
  'Mercado Pago': Wallet,
  Transferencia: Bank,
};

type Estado = { tipo: 'cargando' } | { tipo: 'noDisponible' } | { tipo: 'error' } | { tipo: 'listo'; evento: EventoCompradorDetalle };

/**
 * Compradores 06 · Pago (simulado) (specs/004-compra-pago-mis-compras/contracts/rutas-front.md).
 * Pide el evento y arma el Resumen con el precio vigente: ese es el `precioUnitario` que se envía (research R3).
 * Pagar no pide datos de tarjeta ni contacta a nadie (FR-008).
 */
export default function Pago() {
  const { id, tipo: tipoId, cantidad: cantidadTexto } = useLocalSearchParams<{ id: string; tipo: string; cantidad: string }>();
  const cantidad = Number(cantidadTexto);
  const { comprador } = useSesion();
  const token = comprador?.token ?? '';
  const { bottom } = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);
  const [medio, setMedio] = useState<MedioDePago | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    let vigente = true;
    obtenerEventoComprador(token, id).then(
      (evento) => vigente && setEstado({ tipo: 'listo', evento }),
      (error) => {
        if (!vigente) return;
        const noDisponible = error instanceof ErrorApi && error.codigo === 'EVENTO_NO_ENCONTRADO';
        setEstado({ tipo: noDisponible ? 'noDisponible' : 'error' });
      },
    );
    return () => {
      vigente = false;
    };
  }, [token, id, intento]);

  const volverAElegir = (aviso: 'lugares' | 'precio', tipoNombre: string) =>
    router.dismissTo({ pathname: '/eventos/[id]/entradas', params: { id, aviso, tipoNombre } });

  // Si al cargar el tipo ya no existe o no alcanzan los lugares, se avisa sin esperar al pago.
  const tipo = estado.tipo === 'listo' ? estado.evento.tiposDeEntrada.find((t) => t.id === tipoId) : undefined;
  useEffect(() => {
    if (estado.tipo !== 'listo') return;
    if (!tipo) volverAElegir('precio', 'la entrada');
    else if (tipo.disponibles < cantidad) volverAElegir('lugares', tipo.nombre);
    // Solo al terminar de cargar el evento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.tipo]);

  if (estado.tipo === 'cargando') return <PantallaCargando etiqueta="Cargando el pago" />;
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
          setIntento((i) => i + 1);
        }}
      />
    );
  }
  if (!tipo) return <PantallaCargando etiqueta="Volviendo a elegir entradas" />;

  const { evento } = estado;
  const total = tipo.precio * cantidad;

  const pagar = () => {
    if (!medio || enviando) return;
    setEnviando(true);
    setSinConexion(false);
    comprar(token, { eventoId: evento.id, tipoDeEntradaId: tipo.id, cantidad, medioDePago: medio, precioUnitario: tipo.precio }).then(
      (compra) => {
        // Saca Pago y Elegir entradas: queda arriba la pantalla donde se tocó Comprar, así Volver desde la
        // confirmación nunca vuelve al flujo de compra (FR-011, research R10).
        router.dismiss(2);
        router.push({ pathname: '/compras/[numero]/confirmada', params: { numero: compra.numero } });
      },
      (error) => {
        setEnviando(false);
        const codigo = error instanceof ErrorApi ? error.codigo : 'RED';
        if (codigo === 'LUGARES_INSUFICIENTES') volverAElegir('lugares', tipo.nombre);
        else if (codigo === 'PRECIO_CAMBIADO') volverAElegir('precio', tipo.nombre);
        else if (codigo === 'EVENTO_NO_ENCONTRADO') setEstado({ tipo: 'noDisponible' });
        // Un 401 ya borró la sesión y el guard lleva al Ingreso; lo demás se trata como falta de conexión.
        else setSinConexion(true);
      },
    );
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <AppBar titulo="Pago" />
      <ScrollView contentContainerStyle={styles.contenido}>
        <ResumenCompra
          evento={evento.nombre}
          fechaHora={evento.fechaHora}
          sala={evento.ubicacion}
          tipo={tipo.nombre}
          cantidad={cantidad}
          total={total}
        />
        <View style={styles.seccion} accessibilityRole="radiogroup" accessibilityLabel="Medio de pago">
          <Text style={[type.h5, { color: color.text }]}>Medio de pago</Text>
          {MEDIOS_DE_PAGO.map((opcion) => {
            const Icono = ICONO_POR_MEDIO[opcion];
            return (
              <RadioCard
                key={opcion}
                titulo={opcion}
                icono={<Icono size={iconSize.barra} color={color.textLabel} />}
                elegida={medio === opcion}
                onPress={() => setMedio(opcion)}
              />
            );
          })}
        </View>
        <View style={styles.nota}>
          <Info size={iconSize.enLinea} color={color.textMuted} />
          <Text style={[type.caption, { color: color.textMuted }]}>Pago simulado: no se realiza ningún cobro.</Text>
        </View>
        {sinConexion ? (
          <Text style={[type.bodySm, { color: color.text }]} accessibilityLiveRegion="polite">
            {SIN_CONEXION}
          </Text>
        ) : null}
      </ScrollView>
      <View style={[styles.pie, { paddingBottom: Math.max(bottom, space.padFooterBottom) }]}>
        <Button variante="cta" onPress={pagar} disabled={!medio} enviando={enviando}>
          {`Pagar ${plata(total)}`}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.bg },
  contenido: { paddingHorizontal: space.padScreenX, paddingTop: space.gapSection, paddingBottom: space.s8, gap: space.s8 },
  seccion: { gap: space.gapStack },
  nota: { flexDirection: 'row', alignItems: 'center', gap: space.s2 },
  pie: {
    paddingHorizontal: space.padScreenX,
    paddingTop: space.padCard,
    borderTopWidth: 1,
    borderTopColor: color.divider,
    backgroundColor: color.bg,
  },
});
