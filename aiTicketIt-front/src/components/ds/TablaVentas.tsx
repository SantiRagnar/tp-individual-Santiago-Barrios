import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Venta } from '@/api/ventas';
import { Button } from '@/components/ds/Button';
import { TagCompra } from '@/components/ds/Tag';
import { entradasDeCompra, numeroCompra, plata } from '@/lib/formato';
import { color, size, space, type } from '@/theme/tokens';

type Columna = { titulo: string; ancho: number; derecha?: boolean };

// Anchos fijos para que encabezado y filas queden alineados; en pantallas angostas la tabla scrollea.
const COLUMNAS: Columna[] = [
  { titulo: 'Número', ancho: 90 },
  { titulo: 'Comprador', ancho: 180 },
  { titulo: 'Entradas', ancho: 160 },
  { titulo: 'Estado', ancho: 150 },
  { titulo: 'Medio de pago', ancho: 150 },
  { titulo: 'Monto', ancho: 110, derecha: true },
  { titulo: 'Acciones', ancho: 160, derecha: true },
];

/**
 * DataTable de ventas (design-system.md § DataTable; specs/005-panel-evento/contracts/rutas-front.md).
 * Encabezado en mayúsculas 11px muted, filas type-body-sm, número y monto tabulares, monto y acciones
 * a la derecha. "Marcar utilizada" solo aparece si la API lo habilita (acciones.marcarUtilizada).
 */
export function TablaVentas({
  ventas,
  onMarcarUtilizada,
  numeroEnCurso,
}: {
  ventas: Venta[];
  onMarcarUtilizada: (numero: string) => void;
  numeroEnCurso: string | null;
}) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.contenedor}>
      <View accessibilityRole={Platform.OS === 'web' ? ('table' as never) : undefined}>
        <View style={[styles.fila, styles.encabezado]}>
          {COLUMNAS.map((c) => (
            <Text key={c.titulo} style={[styles.celda, type.meta, styles.titulo, { width: c.ancho }, c.derecha && styles.derecha]}>
              {c.titulo}
            </Text>
          ))}
        </View>
        {ventas.map((venta) => (
          <View key={venta.numero} style={[styles.fila, styles.separador]}>
            <Text style={[styles.celda, type.bodySm, styles.texto, styles.tabular, { width: COLUMNAS[0].ancho }]}>
              {numeroCompra(venta.numero)}
            </Text>
            <Text style={[styles.celda, type.bodySm, styles.texto, { width: COLUMNAS[1].ancho }]} numberOfLines={1}>
              {venta.comprador.nombre}
            </Text>
            <Text style={[styles.celda, type.bodySm, styles.texto, { width: COLUMNAS[2].ancho }]} numberOfLines={1}>
              {entradasDeCompra(venta.tipoDeEntrada.nombre, venta.cantidad)}
            </Text>
            <View style={[styles.celda, { width: COLUMNAS[3].ancho }]}>
              <TagCompra estado={venta.estado} />
            </View>
            <Text style={[styles.celda, type.bodySm, styles.texto, { width: COLUMNAS[4].ancho }]}>{venta.medioDePago}</Text>
            <Text style={[styles.celda, type.bodySm, styles.texto, styles.tabular, styles.derecha, { width: COLUMNAS[5].ancho }]}>
              {plata(venta.monto)}
            </Text>
            <View style={[styles.celda, styles.acciones, { width: COLUMNAS[6].ancho }]}>
              {venta.acciones.marcarUtilizada ? (
                <Button
                  variante="secondary"
                  compacto
                  enviando={numeroEnCurso === venta.numero}
                  disabled={numeroEnCurso !== null && numeroEnCurso !== venta.numero}
                  onPress={() => onMarcarUtilizada(venta.numero)}>
                  Marcar utilizada
                </Button>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexGrow: 1 },
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: size.touchTarget },
  encabezado: { minHeight: size.controlHeight },
  separador: { borderTopWidth: 1, borderTopColor: color.divider },
  celda: { paddingHorizontal: space.s3, justifyContent: 'center' },
  titulo: { color: color.textMuted, textTransform: 'uppercase' },
  texto: { color: color.text },
  tabular: { fontVariant: ['tabular-nums'] },
  derecha: { textAlign: 'right' },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end' },
});
