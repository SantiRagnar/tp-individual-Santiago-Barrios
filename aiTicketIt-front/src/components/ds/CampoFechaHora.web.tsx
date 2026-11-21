import { useState, type CSSProperties } from 'react';
import { Text, View } from 'react-native';

import { LABEL_FECHA_HORA, type CampoFechaHoraProps } from '@/components/ds/campoFechaHoraComun';
import { cssCampo, estilosCampo } from '@/components/ds/estilosCampo';
import { FieldError } from '@/components/ds/TextField';
import { isoConOffset } from '@/lib/formato';

const dos = (n: number) => String(n).padStart(2, '0');

/** ISO → "2026-11-21T21:00" en hora local (el formato de datetime-local). */
function aValorLocal(iso: string | null): string {
  if (!iso) return '';
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return '';
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}T${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

/** Fecha y hora del evento en web: el <input type="datetime-local"> del navegador (research R11). */
export function CampoFechaHora({ value, onChange, onBlur, error }: CampoFechaHoraProps) {
  const [enfocado, setEnfocado] = useState(false);
  const estilo = {
    ...cssCampo.control,
    ...(error ? cssCampo.invalido : {}),
    ...(enfocado ? cssCampo.enfocado : {}),
  } as CSSProperties;

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>{LABEL_FECHA_HORA}</Text>
      <input
        type="datetime-local"
        aria-label={LABEL_FECHA_HORA}
        aria-invalid={Boolean(error)}
        value={aValorLocal(value)}
        onChange={(e) => {
          // El valor del input está en hora local: new Date() lo interpreta así.
          if (e.target.value) onChange(isoConOffset(new Date(e.target.value)));
        }}
        onFocus={() => setEnfocado(true)}
        onBlur={() => {
          setEnfocado(false);
          onBlur?.();
        }}
        style={estilo}
      />
      {error ? <FieldError mensaje={error} /> : null}
    </View>
  );
}
