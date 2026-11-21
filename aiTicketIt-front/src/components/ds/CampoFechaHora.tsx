import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarBlank } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ds/Button';
import { LABEL_FECHA_HORA, type CampoFechaHoraProps } from '@/components/ds/campoFechaHoraComun';
import { estilosCampo } from '@/components/ds/estilosCampo';
import { FieldError } from '@/components/ds/TextField';
import { fechaCorta, isoConOffset } from '@/lib/formato';
import { color, iconSize, radius, shadow, space } from '@/theme/tokens';


/** Fecha y hora del evento en nativo (research R11): primero la fecha y después la hora. */
export function CampoFechaHora({ value, onChange, onBlur, error }: CampoFechaHoraProps) {
  const [abiertoIos, setAbiertoIos] = useState(false);
  const [borrador, setBorrador] = useState<Date>(value ? new Date(value) : new Date());
  const inicial = value ? new Date(value) : new Date();

  function abrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: inicial,
        mode: 'date',
        onChange: (evento: DateTimePickerEvent, fecha?: Date) => {
          if (evento.type !== 'set' || !fecha) return onBlur?.();
          DateTimePickerAndroid.open({
            value: fecha,
            mode: 'time',
            is24Hour: true,
            onChange: (eventoHora: DateTimePickerEvent, conHora?: Date) => {
              if (eventoHora.type === 'set' && conHora) onChange(isoConOffset(conHora));
              onBlur?.();
            },
          });
        },
      });
    } else {
      setBorrador(inicial);
      setAbiertoIos(true);
    }
  }

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>{LABEL_FECHA_HORA}</Text>
      <Pressable
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`${LABEL_FECHA_HORA}: ${fechaCorta(value)}`}
        aria-invalid={Boolean(error)}
        style={[estilosCampo.control, styles.fila, error ? estilosCampo.controlInvalido : null]}>
        <Text style={value ? estilosCampo.valor : estilosCampo.placeholder}>{fechaCorta(value)}</Text>
        <CalendarBlank size={iconSize.enLinea} color={color.textMuted} />
      </Pressable>
      {error ? <FieldError mensaje={error} /> : null}

      <Modal visible={abiertoIos} transparent animationType="slide" onRequestClose={() => setAbiertoIos(false)}>
        <View style={styles.scrim} />
        <View style={styles.hoja}>
          <DateTimePicker
            value={borrador}
            mode="datetime"
            display="inline"
            themeVariant="dark"
            accentColor={color.accent}
            onChange={(_: DateTimePickerEvent, fecha?: Date) => fecha && setBorrador(fecha)}
          />
          <Button
            variante="cta"
            onPress={() => {
              onChange(isoConOffset(borrador));
              setAbiertoIos(false);
              onBlur?.();
            }}>
            Listo
          </Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scrim: { flex: 1, backgroundColor: color.scrim },
  hoja: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    boxShadow: shadow.lg,
    padding: space.padScreenX,
    paddingBottom: space.padFooterBottom,
    gap: space.s6,
  },
});
