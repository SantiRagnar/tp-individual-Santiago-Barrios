import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { color, radius, shadow, space, type } from '@/theme/tokens';

type Props = {
  visible: boolean;
  /** Pregunta: "¿Cancelar la compra?" */
  titulo: string;
  /** Qué pasa con la plata y que no se puede deshacer. */
  cuerpo: string;
  volver: string;
  confirmar: string;
  enviando?: boolean;
  onVolver: () => void;
  onConfirmar: () => void;
};

/**
 * Confirmación de una acción irreversible (design-system.md § Dialog): modal sobre `color-scrim` con
 * `shadow-lg`; acciones a la derecha, volver en secundario y la confirmación en primario con el mismo verbo.
 */
export function Dialog({ visible, titulo, cuerpo, volver, confirmar, enviando = false, onVolver, onConfirmar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onVolver}>
      <View style={styles.contenedor}>
        <Pressable style={StyleSheet.absoluteFill} onPress={enviando ? undefined : onVolver} accessible={false} />
        <View style={styles.dialogo} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={[type.h5, { color: color.text }]} accessibilityRole="header">
            {titulo}
          </Text>
          <Text style={[type.bodySm, { color: color.textLabel }]}>{cuerpo}</Text>
          <View style={styles.acciones}>
            <Button variante="secondary" onPress={onVolver} disabled={enviando}>
              {volver}
            </Button>
            <Button variante="primary" onPress={onConfirmar} enviando={enviando}>
              {confirmar}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const ANCHO_MAXIMO = 360;

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.padScreenX, backgroundColor: color.scrim },
  dialogo: {
    width: '100%',
    maxWidth: ANCHO_MAXIMO,
    gap: space.s4,
    padding: space.s8,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    boxShadow: shadow.lg,
  },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: space.s3, marginTop: space.s3 },
});
