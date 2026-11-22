/**
 * Reloj inyectable (research R2). En producción es el reloj real; los tests fijan "hoy"
 * con fijarAhora() para que Finalizado y "la fecha tiene que ser futura" no dependan del día.
 */
let fijado = null;

export function ahora() {
  return fijado ? new Date(fijado) : new Date();
}

/** Solo para tests. `null` vuelve al reloj real. */
export function fijarAhora(fecha) {
  fijado = fecha ? new Date(fecha).getTime() : null;
}

/**
 * Fija "hoy" desde la variable de entorno FECHA_SIMULADA (feature 004, research R15), para validar a mano
 * con las fechas del seed. Sin valor no hace nada y devuelve null; con un ISO válido fija el reloj y
 * devuelve el ISO; con un valor inválido lanza sin tocar el reloj.
 */
export function fijarAhoraDesdeEntorno(valor) {
  if (valor === undefined || valor === null || valor.trim() === "") return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error(`FECHA_SIMULADA no es una fecha válida: "${valor}". Usá ISO 8601, p. ej. 2026-11-09T12:00:00-03:00.`);
  }
  fijarAhora(fecha);
  return fecha.toISOString();
}
