import { useState, type CSSProperties } from 'react';
import { Text, View } from 'react-native';

import { cssCampo, estilosCampo } from '@/components/ds/estilosCampo';
import type { SelectProps } from '@/components/ds/Select';

/** Select del design system en web: el <select> del navegador con el estilo de Field (research R12). */
export function Select<T extends string>({ label, value, opciones, placeholder, onChange }: SelectProps<T>) {
  const [enfocado, setEnfocado] = useState(false);
  const estilo = { ...cssCampo.control, ...(enfocado ? cssCampo.enfocado : {}) } as CSSProperties;

  return (
    <View style={estilosCampo.campo}>
      <Text style={estilosCampo.label}>{label}</Text>
      <select
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        style={estilo}>
        <option value="">{placeholder}</option>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {opcion}
          </option>
        ))}
      </select>
    </View>
  );
}
