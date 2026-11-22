import { StyleSheet, Text, View } from 'react-native';

import type { OrganizadorResumen, Resena } from '@/api/compradores';
import { Button } from '@/components/ds/Button';
import { contadorResenas, estrellas, puntaje } from '@/lib/formato';
import { color, radius, space, type } from '@/theme/tokens';

type Props = {
  organizador: OrganizadorResumen;
  resenas: Resena[];
  /** Muestra "Ver más" si hay más reseñas por cargar. */
  hayMas: boolean;
  cargandoMas: boolean;
  onVerMas: () => void;
};

/**
 * Opiniones sobre el organizador (design-system.md § Rating "para mostrar"). La reseña es del
 * organizador, no del evento: se listan las de todos sus eventos, de a 5 con "Ver más" (FR-024).
 * El puntaje va en 32px (type-h2; design-system.md § Tipografía, type-stat).
 */
export function Opiniones({ organizador, resenas, hayMas, cargandoMas, onVerMas }: Props) {
  const sinResenas = organizador.puntaje === null;
  return (
    <View style={styles.seccion}>
      <Text style={[type.h5, { color: color.text }]} accessibilityRole="header">
        Opiniones sobre el organizador
      </Text>
      <View style={styles.resumen}>
        {!sinResenas ? (
          <Text style={[type.h2, { color: color.text }]} accessibilityLabel={`Puntaje ${puntaje(organizador.puntaje!)} de 5`}>
            {puntaje(organizador.puntaje!)}
          </Text>
        ) : null}
        <View style={styles.flexible}>
          <Text style={[type.body, { color: color.text }]}>{organizador.nombre}</Text>
          <Text style={[type.caption, { color: color.textMuted }]}>
            {sinResenas ? 'Todavía no tiene reseñas.' : contadorResenas(organizador.cantidadResenas)}
          </Text>
        </View>
      </View>

      {resenas.map((resena) => (
        <View key={resena.numeroCompra} style={styles.resena}>
          <View style={styles.encabezadoResena}>
            <Text style={[type.bodySm, { color: color.text }]}>{resena.autor}</Text>
            <Text style={[type.bodySm, { color: color.accent }]} accessibilityLabel={`${resena.puntaje} de 5 estrellas`}>
              {estrellas(resena.puntaje)}
            </Text>
          </View>
          <Text style={[type.label, { color: color.textLabel }]}>{resena.evento.nombre}</Text>
          <Text style={[type.caption, { color: color.textMuted }]}>{resena.comentario ?? 'Sin comentario.'}</Text>
        </View>
      ))}

      {hayMas ? (
        <Button variante="secondary" enviando={cargandoMas} onPress={onVerMas}>
          Ver más
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: space.gapSection },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: space.s6 },
  flexible: { flex: 1, gap: space.s1 },
  resena: {
    gap: space.s1,
    padding: space.padCard,
    borderRadius: radius.md,
    backgroundColor: color.surface,
  },
  encabezadoResena: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.s3 },
});
