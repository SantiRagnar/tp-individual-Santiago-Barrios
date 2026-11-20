import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { Button } from '@/components/ds/Button';
import { FieldError, TextField } from '@/components/ds/TextField';
import { validarContrasena, validarEmail } from '@/lib/validacionIngreso';
import { color, space, type } from '@/theme/tokens';

// Textos de contracts/rutas-front.md y pantallas.md (Compradores 01 / Organizadores 01 · Ingreso).
const NOTA_DESHABILITADO = 'Revisá los campos marcados para ingresar.';
const MENSAJE_CREDENCIALES = 'El email o la contraseña no son correctos.';
const MENSAJE_RED = 'No pudimos conectarnos. Probá de nuevo en un rato.';

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi && error.codigo === 'CREDENCIALES_INVALIDAS') return MENSAJE_CREDENCIALES;
  return MENSAJE_RED;
}

type Props = {
  /** Hace el ingreso; si falla, lanza ErrorApi. */
  onIngresar: (email: string, contrasena: string) => Promise<void>;
  /** Controles de 36px (desktop). */
  compacto?: boolean;
};

/**
 * Formulario compartido por los dos Ingresos: valida mientras se escribe, muestra el error
 * solo en campos ya tocados, deshabilita "Ingresar" con una nota, envía una sola vez y con Enter.
 */
export function FormularioIngreso({ onIngresar, compacto = false }: Props) {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [tocados, setTocados] = useState({ email: false, contrasena: false });
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  // Evita dobles envíos aunque el estado todavía no se haya re-renderizado.
  const enCurso = useRef(false);

  const errorEmail = validarEmail(email);
  const errorContrasena = validarContrasena(contrasena);
  const hayErrores = Boolean(errorEmail || errorContrasena);
  const hayErroresVisibles = (tocados.email && errorEmail) || (tocados.contrasena && errorContrasena);

  async function enviar() {
    if (hayErrores || enCurso.current) {
      setTocados({ email: true, contrasena: true });
      return;
    }
    enCurso.current = true;
    setEnviando(true);
    setErrorGeneral(null);
    try {
      await onIngresar(email.trim(), contrasena);
    } catch (error) {
      setErrorGeneral(mensajeDeError(error));
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <View style={styles.formulario}>
      <TextField
        label="Email"
        value={email}
        onChangeText={(texto) => {
          setEmail(texto);
          setErrorGeneral(null);
        }}
        onBlur={() => setTocados((t) => ({ ...t, email: true }))}
        onSubmitEditing={enviar}
        error={tocados.email ? errorEmail : null}
        placeholder="nombre@correo.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        compacto={compacto}
      />
      <TextField
        label="Contraseña"
        value={contrasena}
        onChangeText={(texto) => {
          setContrasena(texto);
          setErrorGeneral(null);
        }}
        onBlur={() => setTocados((t) => ({ ...t, contrasena: true }))}
        onSubmitEditing={enviar}
        error={tocados.contrasena ? errorContrasena : null}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        compacto={compacto}
      />

      {errorGeneral ? <FieldError mensaje={errorGeneral} /> : null}

      <Button
        variante={compacto ? 'primary' : 'cta'}
        compacto={compacto}
        onPress={enviar}
        disabled={hayErrores}
        enviando={enviando}
        accessibilityHint={hayErroresVisibles ? NOTA_DESHABILITADO : undefined}>
        Ingresar
      </Button>
      {hayErroresVisibles ? <Text style={[type.caption, styles.nota]}>{NOTA_DESHABILITADO}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: space.gapSection, alignSelf: 'stretch' },
  nota: { color: color.textMuted },
});
