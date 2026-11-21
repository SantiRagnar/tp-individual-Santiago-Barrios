// Compartido por CampoFechaHora.tsx y CampoFechaHora.web.tsx. Va aparte porque, en web,
// '@/components/ds/CampoFechaHora' resuelve al propio archivo .web (importación circular).

export type CampoFechaHoraProps = {
  /** ISO 8601 con offset, o null. */
  value: string | null;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  error?: string | null;
};

export const LABEL_FECHA_HORA = 'Fecha y hora de realización';
