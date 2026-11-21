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
