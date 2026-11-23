// Formatos del design system (contracts/rutas-front.md § "Formatos").

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** 1200 → "1.200" (punto de miles, sin decimales). */
export function miles(n: number): string {
  const signo = n < 0 ? '-' : '';
  return signo + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 18000 → "$ 18.000"; 0 → "$ 0". */
export function plata(n: number): string {
  return `$ ${miles(n)}`;
}

/** ISO → "Sáb 21 nov · 21:00" en hora local; null → "Fecha a definir". */
export function fechaCorta(iso: string | null): string {
  if (!iso) return 'Fecha a definir';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'Fecha a definir';
  const hora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]} · ${hora}`;
}

/** "N de M entradas vendidas", con miles con punto. */
export function entradasVendidas(vendidas: number, cupo: number): string {
  return `${miles(vendidas)} de ${miles(cupo)} entradas vendidas`;
}

/** Date → ISO 8601 con el offset local ("2026-11-21T21:00:00-03:00", research R3). */
export function isoConOffset(fecha: Date): string {
  const dos = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const offset = -fecha.getTimezoneOffset();
  const signo = offset >= 0 ? '+' : '-';
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00` +
    `${signo}${dos(offset / 60)}:${dos(offset % 60)}`
  );
}

// Feature 003 (specs/003-explorar-detalle-evento/contracts/rutas-front.md § Formatos, research R16).

const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** ISO → "Sábado 21 de noviembre" en hora local. */
export function fechaLarga(iso: string): string {
  const fecha = new Date(iso);
  return `${DIAS_LARGOS[fecha.getDay()]} ${fecha.getDate()} de ${MESES_LARGOS[fecha.getMonth()]}`;
}

/** ISO → "21:00 h" en hora local. */
export function hora(iso: string): string {
  const fecha = new Date(iso);
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')} h`;
}

/** "$ 12.000 a $ 26.000", o un solo precio si son iguales. */
export function rangoDePrecios(desde: number, hasta: number): string {
  return desde === hasta ? plata(desde) : `${plata(desde)} a ${plata(hasta)}`;
}

/** 4.5 → "4.5"; 4 → "4.0" (un decimal con punto, como en el diseño). */
export function puntaje(valor: number): string {
  return valor.toFixed(1);
}

const PALABRAS_PUNTAJE = ['Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/** 1 → "Malo" … 5 → "Excelente"; sin elegir → "Elegí de 1 a 5 estrellas" (pantallas.md § Calificaciones). */
export function palabraPuntaje(puntaje: number | null): string {
  return puntaje && puntaje >= 1 && puntaje <= 5 ? PALABRAS_PUNTAJE[puntaje - 1] : 'Elegí de 1 a 5 estrellas';
}

/** 37 → "37/500" (contador del comentario de una calificación). */
export function contadorCaracteres(usados: number, maximo = 500): string {
  return `${usados}/${maximo}`;
}

/** 4 → "★★★★☆". */
export function estrellas(valor: number): string {
  const llenas = Math.max(0, Math.min(5, Math.round(valor)));
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

/** "5 eventos" / "1 evento" / "0 eventos". */
export function contadorEventos(n: number): string {
  return n === 1 ? '1 evento' : `${miles(n)} eventos`;
}

/** "4 reseñas de eventos anteriores" / "1 reseña de eventos anteriores". */
export function contadorResenas(n: number): string {
  return n === 1 ? '1 reseña de eventos anteriores' : `${miles(n)} reseñas de eventos anteriores`;
}

// Feature 004 (specs/004-compra-pago-mis-compras/research.md R13).

/** 13 → "Faltan 13 días"; 1 → "Falta 1 día". Con `paraElEvento`: "Faltan 13 días para el evento." */
export function cuentaRegresiva(dias: number, { paraElEvento = false }: { paraElEvento?: boolean } = {}): string {
  const texto = dias === 1 ? 'Falta 1 día' : `Faltan ${miles(dias)} días`;
  return paraElEvento ? `${texto} para el evento.` : texto;
}

/** ("Platea", 2) → "Platea × 2". */
export function entradas(tipo: string, cantidad: number): string {
  return `${tipo} × ${cantidad}`;
}

/** "A-1042" → "#A-1042". */
export function numeroCompra(numero: string): string {
  return `#${numero}`;
}

/** ISO → "Sábado 21 de noviembre · 21:00 h" en hora local. */
export function fechaYHoraLarga(iso: string): string {
  return `${fechaLarga(iso)} · ${hora(iso)}`;
}

// Panel del evento (feature 005, contracts/rutas-front.md § Organizadores 04).

/** 1 → "1 entrada vendida"; 154 → "154 entradas vendidas". */
export function textoEntradasVendidas(n: number): string {
  return n === 1 ? '1 entrada vendida' : `${miles(n)} entradas vendidas`;
}

/** 1 → "1 compra activa"; 60 → "60 compras activas". */
export function textoComprasActivas(n: number): string {
  return n === 1 ? '1 compra activa' : `${miles(n)} compras activas`;
}

/** ("Platea", 2) → "Platea × 2"; sin nombre → "Sin nombre × 2". */
export function entradasDeCompra(nombre: string | null, cantidad: number): string {
  return `${nombre || 'Sin nombre'} × ${cantidad}`;
}

// Feature 007 (specs/007-consultas-chat/research.md R11).

/** Hora de un mensaje: "21:04" si es de hoy; "Sáb 21 nov · 21:04" si es de otro día. */
export function horaDeMensaje(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  const mismoDia =
    fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth() && fecha.getDate() === ahora.getDate();
  return mismoDia ? `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}` : fechaCorta(iso);
}
