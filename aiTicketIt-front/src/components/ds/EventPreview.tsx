import { CalendarBlank, MapPin } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { ImagenDeEvento } from '@/components/ds/EventManageCard';
import { Tag } from '@/components/ds/Tag';
import { fechaCorta, miles, plata } from '@/lib/formato';
import { aNumero, type FormEvento } from '@/lib/validacionEvento';
import { color, iconSize, radius, shadow, space, type } from '@/theme/tokens';

/** Alto de la imagen de la EventCard de Compradores (design-system.md § Imágenes). */
const ALTO_IMAGEN = 150;

const lugares = (n: number) => (n === 1 ? '1 lugar' : `${miles(n)} lugares`);
const entero = (texto: string) => {
  const n = aNumero(texto);
  return n !== null && Number.isFinite(n) ? Math.trunc(n) : 0;
};

/**
 * Vista previa de Crear/Editar evento (FR-017, FR-018): el evento como lo verá el comprador.
 * Los campos vacíos se ven con su nombre genérico, nunca en blanco.
 */
export function EventPreview({ form }: { form: FormEvento }) {
  const capacidad = form.tiposDeEntrada.reduce((total, t) => total + Math.max(0, entero(t.cupo)), 0);

  return (
    <View style={styles.columna} accessibilityLabel="Vista previa">
      <Text style={[type.kicker, { color: color.textMuted }]}>Vista previa · así lo verá el comprador</Text>
      <View style={styles.tarjeta}>
        <View>
          <ImagenDeEvento imagenUrl={form.imagenUrl} alto={ALTO_IMAGEN} />
          {form.categoria ? (
            <View style={styles.categoria}>
              <Tag variante="neutral">{form.categoria}</Tag>
            </View>
          ) : null}
        </View>
        <View style={styles.cuerpo}>
          <Text style={[type.cardTitle, { color: color.text }]}>{form.nombre.trim() || 'Nombre del evento'}</Text>
          <View style={styles.dato}>
            <CalendarBlank size={iconSize.enLinea} color={color.textMuted} />
            <Text style={[type.caption, { color: color.textMuted }]}>{fechaCorta(form.fechaHora)}</Text>
          </View>
          <View style={styles.dato}>
            <MapPin size={iconSize.enLinea} color={color.textMuted} />
            <Text style={[type.caption, { color: color.textMuted }]}>{form.ubicacion.trim() || 'Ubicación'}</Text>
          </View>
          <Text style={[type.bodySm, { color: color.textLabel }]}>
            {form.descripcion.trim() || 'Descripción del evento'}
          </Text>
          {form.tiposDeEntrada.length > 0 ? (
            <View style={styles.tipos}>
              {form.tiposDeEntrada.map((t) => (
                <Text key={t.clave} style={[type.caption, { color: color.text }]}>
                  {t.nombre.trim() || 'Sin nombre'} · {lugares(entero(t.cupo))} — {plata(entero(t.precio))}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={styles.pie}>
            {/* Inerte: solo muestra cómo se verá. */}
            <View pointerEvents="none" aria-hidden>
              <Button compacto>Comprar</Button>
            </View>
          </View>
        </View>
      </View>
      <Text style={[type.bodySm, { color: color.textLabel }]}>Capacidad total: {lugares(capacidad)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { gap: space.s4 },
  tarjeta: { backgroundColor: color.surface, borderRadius: radius.md, boxShadow: shadow.sm, overflow: 'hidden' },
  categoria: { position: 'absolute', top: space.s3, left: space.s3 },
  cuerpo: { padding: space.padCard, gap: space.s3 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: space.s1 * 2 },
  tipos: { gap: space.s1 },
  pie: { flexDirection: 'row', justifyContent: 'flex-end' },
});
