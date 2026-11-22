import { PaperPlaneRight } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEvent,
  View,
} from 'react-native';

import { Button } from '@/components/ds/Button';
import { FieldError } from '@/components/ds/TextField';
import { color, iconSize, opacidadDeshabilitado, radius, size, space, type } from '@/theme/tokens';

export const LARGO_MAXIMO_MENSAJE = 1000;
const DESDE_CONTADOR = 900;

type Props = {
  variante: 'mobile' | 'desktop';
  placeholder: string;
  /** Envía el texto ya recortado. `true` = se envió (vacía el compositor); `false` = conserva el texto. */
  onEnviar: (texto: string) => Promise<boolean>;
  /** Error a mostrar arriba del compositor (p. ej. sin conexión). */
  error?: string | null;
};

/**
 * Compositor del chat (design-system.md § Chat). Mobile: input redondeado de 44px + botón circular.
 * Desktop: input + "Enviar". Enter envía; en web, Shift+Enter agrega un salto de línea. Máx. 1000
 * caracteres, con contador "N/1000" desde 900. Deshabilitado con el texto vacío o mientras envía.
 */
export function CompositorChat({ variante, placeholder, onEnviar, error }: Props) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const recortado = texto.trim();
  const puedeEnviar = recortado.length > 0 && !enviando;

  const enviar = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    try {
      if (await onEnviar(recortado)) setTexto('');
    } finally {
      setEnviando(false);
    }
  };

  // Web: Enter envía y Shift+Enter agrega un salto de línea.
  const alPresionarTecla = (evento: TextInputKeyPressEvent) => {
    const nativo = evento.nativeEvent as { key: string; shiftKey?: boolean };
    if (Platform.OS === 'web' && nativo.key === 'Enter' && !nativo.shiftKey) {
      (evento as unknown as { preventDefault?: () => void }).preventDefault?.();
      enviar();
    }
  };

  const esMobile = variante === 'mobile';

  return (
    <View style={styles.contenedor}>
      {error ? <FieldError mensaje={error} /> : null}
      <View style={styles.fila}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder={placeholder}
          placeholderTextColor={color.textMuted}
          maxLength={LARGO_MAXIMO_MENSAJE}
          multiline={Platform.OS === 'web' || !esMobile}
          // En nativo (mobile) el input es de una línea y la tecla "Enviar" del teclado envía.
          returnKeyType="send"
          submitBehavior={Platform.OS === 'web' ? undefined : 'submit'}
          onSubmitEditing={Platform.OS === 'web' ? undefined : enviar}
          onKeyPress={alPresionarTecla}
          accessibilityLabel={placeholder}
          style={[type.bodySm, styles.input, esMobile ? styles.inputMobile : styles.inputDesktop]}
        />
        {esMobile ? (
          <Pressable
            onPress={enviar}
            disabled={!puedeEnviar}
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            accessibilityState={{ disabled: !puedeEnviar, busy: enviando }}
            style={[styles.botonCircular, !puedeEnviar && { opacity: opacidadDeshabilitado }]}>
            {enviando ? (
              <ActivityIndicator size="small" color={color.accent} />
            ) : (
              <PaperPlaneRight size={iconSize.barra} color={color.accent} weight="fill" />
            )}
          </Pressable>
        ) : (
          <Button onPress={enviar} disabled={recortado.length === 0} enviando={enviando} compacto>
            Enviar
          </Button>
        )}
      </View>
      {texto.length >= DESDE_CONTADOR ? (
        <Text style={[type.caption, styles.contador]}>{`${texto.length}/${LARGO_MAXIMO_MENSAJE}`}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: space.s2, paddingHorizontal: space.padScreenX, paddingVertical: space.s3, borderTopWidth: 1, borderTopColor: color.divider },
  fila: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s3 },
  input: {
    flex: 1,
    color: color.text,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.divider,
    paddingHorizontal: space.padCard,
  },
  inputMobile: { minHeight: size.touchTarget, maxHeight: 120, borderRadius: radius.pill, paddingVertical: space.s4 },
  inputDesktop: { minHeight: size.controlHeight, maxHeight: 160, borderRadius: radius.md, paddingVertical: space.s3 },
  botonCircular: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: { color: color.textMuted, alignSelf: 'flex-end' },
});
