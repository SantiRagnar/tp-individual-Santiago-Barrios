import { CheckCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorApi } from '@/api/cliente';
import { calificarCompra, type Compra } from '@/api/compras';
import { Button } from '@/components/ds/Button';
import { SIN_CONEXION } from '@/components/ds/PantallaDeAviso';
import { SelectorEstrellas } from '@/components/ds/SelectorEstrellas';
import { TextField } from '@/components/ds/TextField';
import { marcarCalificacionNueva } from '@/lib/calificacionesRecientes';
import { color, iconSize, radius, shadow, space, type } from '@/theme/tokens';

const LARGO_MAXIMO = 500;

type Props = {
  token: string;
  /** Compra Utilizada sin calificar que devolvió GET /compradores/calificaciones/pendiente. */
  compra: Compra;
  /** La compra ya no se puede calificar (409): Explorar vuelve a pedir el pendiente. */
  onDesactualizado: () => void;
  /** Se guardó la calificación: Explorar recarga la lista para mostrar el puntaje nuevo. */
  onCalificada?: () => void;
};

/**
 * Recordatorio de calificación de Explorar (pantallas.md § Compradores 02, design-system § Rating; feature 006).
 * Califica con las mismas reglas que Calificar experiencia; al enviar se reemplaza por la confirmación en línea.
 */
export function RecordatorioCalificacion({ token, compra, onDesactualizado, onCalificada }: Props) {
  const [puntaje, setPuntaje] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  if (enviada) {
    return (
      <View style={[styles.tarjeta, styles.confirmacion]} accessibilityLiveRegion="polite">
        <CheckCircle size={iconSize.barra} color={color.accent} weight="fill" />
        <Text style={[type.bodySm, styles.textoConfirmacion]}>Gracias, tu reseña ya es visible en los eventos del organizador.</Text>
      </View>
    );
  }

  const enviar = () => {
    if (puntaje === null || enviando) return;
    setEnviando(true);
    setSinConexion(false);
    calificarCompra(token, compra.numero, { puntaje, comentario: comentario.trim() || null }).then(
      () => {
        marcarCalificacionNueva();
        setEnviando(false);
        setEnviada(true);
        onCalificada?.();
      },
      (error) => {
        setEnviando(false);
        if (error instanceof ErrorApi && (error.status === 409 || error.status === 404)) onDesactualizado();
        else if (!(error instanceof ErrorApi && error.codigo === 'SESION_INVALIDA')) setSinConexion(true);
      },
    );
  };

  return (
    <View style={styles.tarjeta}>
      <View style={styles.textos}>
        <Text style={[type.caption, { color: color.textLabel }]}>Tu entrada fue utilizada</Text>
        <Text style={[type.h5, { color: color.text }]}>{`¿Cómo fue tu experiencia en ${compra.evento.nombre}?`}</Text>
      </View>
      <SelectorEstrellas valor={puntaje} onCambiar={setPuntaje} tamano="sm" deshabilitado={enviando} />
      <TextField
        label="Comentario"
        accessibilityLabel="Comentario (opcional)"
        value={comentario}
        onChangeText={setComentario}
        placeholder="Contanos qué te pareció (opcional)"
        multiline
        compacto
        maxLength={LARGO_MAXIMO}
      />
      {sinConexion ? (
        <Text style={[type.bodySm, { color: color.text }]} accessibilityLiveRegion="polite">
          {SIN_CONEXION}
        </Text>
      ) : null}
      <Button variante="primary" enviando={enviando} disabled={puntaje === null || enviando} onPress={enviar}>
        Calificar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { gap: space.s4, padding: space.padCard, borderRadius: radius.md, backgroundColor: color.surface, boxShadow: shadow.sm },
  textos: { gap: space.s1 },
  confirmacion: { flexDirection: 'row', alignItems: 'center' },
  textoConfirmacion: { flex: 1, color: color.text },
});
