import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ConsultaResumen } from '@/api/consultas';
import { iniciales } from '@/components/ds/Avatar';
import { entradasDeCompra, horaDeMensaje, numeroCompra } from '@/lib/formato';
import { color, radius, shadow, space, tinte, type } from '@/theme/tokens';

export const ANCHO_LISTA_CONVERSACIONES = 380;
const AVATAR = 38;

/** Iniciales del comprador; si el nombre es un email (no tiene nombre cargado), la primera letra. */
function inicialesDe(nombre: string) {
  return nombre.includes('@') ? nombre[0]!.toUpperCase() : iniciales(nombre);
}

/** Punto de no leído (`dot-unread`, design-system.md § Tag). */
export function PuntoNoLeido() {
  return <View style={styles.punto} accessibilityLabel="Tenés mensajes sin leer" accessibilityRole="image" />;
}

/**
 * ConversationList de Organizadores 05 (design-system.md § ConversationList): una fila por consulta con avatar,
 * comprador, hora del último mensaje, compra, último mensaje y punto de no leído. La elegida lleva aria-current.
 */
export function ListaConversaciones({
  consultas,
  seleccionada,
  onElegir,
}: {
  consultas: ConsultaResumen[];
  seleccionada: string | null;
  onElegir: (numero: string) => void;
}) {
  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.contenido} accessibilityRole="list">
      {consultas.map((consulta) => {
        const elegida = consulta.numero === seleccionada;
        return (
          <Pressable
            key={consulta.numero}
            onPress={() => onElegir(consulta.numero)}
            accessibilityRole="button"
            aria-current={elegida ? 'true' : undefined}
            accessibilityState={{ selected: elegida }}
            style={({ hovered, pressed, focused }: { hovered?: boolean; pressed: boolean; focused?: boolean }) => [
              styles.fila,
              elegida && styles.elegida,
              !elegida && hovered && { backgroundColor: tinte.textoHover },
              pressed && { backgroundColor: tinte.textoPresionado },
              focused && Platform.OS === 'web' && styles.foco,
            ]}>
            <View style={styles.avatar}>
              <Text style={[type.label, { color: color.text }]}>{inicialesDe(consulta.comprador.nombre)}</Text>
            </View>
            <View style={styles.textos}>
              <View style={styles.renglon}>
                <Text style={[type.bodySm, styles.nombre]} numberOfLines={1}>
                  {consulta.comprador.nombre}
                </Text>
                {consulta.ultimoMensaje ? (
                  <Text style={[type.label, { color: color.textMuted }]}>{horaDeMensaje(consulta.ultimoMensaje.enviadoEn)}</Text>
                ) : null}
              </View>
              <Text style={[type.caption, { color: color.textMuted }]} numberOfLines={1}>
                {`Compra ${numeroCompra(consulta.numero)} · ${entradasDeCompra(consulta.tipoDeEntrada.nombre, consulta.cantidad)}`}
              </Text>
              <View style={styles.renglon}>
                <Text style={[type.caption, styles.ultimo]} numberOfLines={1}>
                  {consulta.ultimoMensaje?.texto ?? ''}
                </Text>
                {consulta.noLeida ? <PuntoNoLeido /> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lista: { width: ANCHO_LISTA_CONVERSACIONES, flexGrow: 0 },
  contenido: { gap: space.s1 },
  fila: { flexDirection: 'row', gap: space.s4, padding: space.s4, borderRadius: radius.md, alignItems: 'flex-start' },
  elegida: { backgroundColor: color.surface, boxShadow: shadow.sm },
  foco: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: color.accent, outlineOffset: 2 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.pill,
    backgroundColor: color.neutral800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1, gap: space.s1 },
  renglon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s3 },
  nombre: { color: color.text, fontFamily: type.h5.fontFamily, flexShrink: 1 },
  ultimo: { color: color.textLabel, flexShrink: 1 },
  punto: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: color.accent },
});
