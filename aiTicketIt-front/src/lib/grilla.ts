// Grilla adaptable (research R14): 4 columnas desde 1200 px, 3 desde 900, 2 desde 600 y 1 por debajo.
export function columnasMisEventos(ancho: number): number {
  if (ancho >= 1200) return 4;
  if (ancho >= 900) return 3;
  if (ancho >= 600) return 2;
  return 1;
}

/** Ancho de cada celda para `columnas` celdas en `anchoDisponible`, con `gap` entre ellas. */
export function anchoDeCelda(anchoDisponible: number, columnas: number, gap: number): number {
  return Math.floor((anchoDisponible - gap * (columnas - 1)) / columnas);
}

/** Desde este ancho la vista previa de Crear/Editar evento va a la derecha (research R14). */
export const ANCHO_VISTA_PREVIA_AL_COSTADO = 1000;
