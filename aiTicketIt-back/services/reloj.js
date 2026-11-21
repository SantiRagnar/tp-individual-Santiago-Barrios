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
