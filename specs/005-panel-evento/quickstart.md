# Quickstart: Panel del evento (organizadores)

Guía para validar la feature de punta a punta. Contratos en [contracts/](contracts/), datos y reglas en [data-model.md](data-model.md).

## Prerrequisitos

- Node.js (el mismo que las features anteriores) y dependencias instaladas en `aiTicketIt-back/` y `aiTicketIt-front/`.
- **Puertos de esta feature (research R11):** hay otra sesión usando 3000 y 8081, así que acá se usan el **3005** (backend) y el **8085** (front web).

## Levantar

```bash
# Backend en el 3005. Opcional: FECHA_SIMULADA fija "hoy" (research R9).
cd aiTicketIt-back
PORT=3005 npm start
# o, para probar Marcar utilizada en el día de Hamlet:
PORT=3005 FECHA_SIMULADA=2026-11-21T20:00:00-03:00 npm start

# Front web en el 8085, apuntando a ese backend
cd aiTicketIt-front
EXPO_PUBLIC_API_URL=http://localhost:3005 npx expo start --web --port 8085
```

Swagger: http://localhost:3005/docs (deben aparecer `GET /organizadores/eventos/{id}/ventas` y `POST /organizadores/eventos/{id}/ventas/{numero}/utilizacion`, con el tag "Ventas del evento").

Panel: http://localhost:8085/organizadores, con `produccion@latrama.com.ar` y la contraseña `Entradas2026`.

## Tests

```bash
cd aiTicketIt-back && npm test         # unitarios + integración (incluye seed.test.js)
cd aiTicketIt-front && npm run lint && npx tsc --noEmit
```

## Escenarios de validación

| # | Pasos | Resultado esperado | Req. |
|---|---|---|---|
| 1 | En Mis eventos, clic en **Hamlet en el Galpón** | Panel con cabecera, **Editar evento** y **Consultas del evento** deshabilitado (sin contador) | US1-1, FR-002 |
| 2 | Mirar **Disponibilidad** | General · $ 12.000: "Quedan 84", "66 / 150 vendidas". Platea · $ 18.000: "Quedan 12", "68 / 80 vendidas". VIP · $ 26.000: "Agotada", "20 / 20 vendidas", barra llena | US1-2, US1-3 |
| 3 | Mirar **Recaudado** | "$ 2.536.000" y "154 entradas vendidas · 60 compras activas" | US1-4, FR-006 |
| 4 | Mirar los chips | Todas 62 · Confirmadas 51 · Pendientes 9 · Utilizadas 0 · Canceladas 1 · Reembolsadas 1 | US2-3 |
| 5 | Mirar la tabla | 20 filas de la más reciente a la más antigua; aparece "#A-1042 · Sofía Gómez · Platea × 2 · Confirmada · Tarjeta de crédito · $ 36.000"; abajo **Ver más** | US2-1, US2-2, US2-7 |
| 6 | Tocar **Ver más** dos veces | 40 y después 60 filas; a la tercera, 62 y el botón desaparece | US2-7 |
| 7 | Chip **Utilizadas** | "No hay ventas con este estado."; los contadores no cambian | US2-4, US2-5 |
| 8 | Chip **Pendientes**, después **Todas** | 9 filas Pendiente de pago; al volver a Todas, otra vez 20 + **Ver más** | US2-4, US2-8 |
| 9 | Abrir **La gaviota** (Borrador) | Barra vacía, "Quedan 120", "0 / 120 vendidas", "$ 0", "0 entradas vendidas · 0 compras activas", "No hay ventas con este estado." | US1-5, US2-6 |
| 10 | Abrir **Edipo Rey** | Panel sin **Editar evento**; ventas Utilizadas y algunas Confirmadas con **Marcar utilizada** (el evento ya pasó) | US1-7, FR-012 |
| 11 | En Edipo Rey, **Marcar utilizada** en una Confirmada | La fila pasa a Utilizada sin recargar; Confirmadas baja 1, Utilizadas sube 1; las compras activas no cambian | US3-3, FR-013 |
| 12 | Abrir **Bodas de sangre** (5 dic) | Ninguna fila tiene **Marcar utilizada** | US3-2 |
| 13 | Con el backend en `FECHA_SIMULADA=2026-11-21T20:00:00-03:00`, abrir Hamlet | Las Confirmadas muestran **Marcar utilizada**. Con `2026-11-20T23:59:00-03:00`, no | US3-1, US3-2, R4 |
| 14 | En dos pestañas con el mismo panel, marcar la misma compra en ambas | La segunda muestra "La compra ya no está confirmada." y la tabla se refresca | US3-4, R5 |
| 15 | Con la sesión de La Trama, ir a `/organizadores/eventos/evt-2` (Club del Chiste) | "No encontramos el evento." + link a Mis eventos, sin datos | US4-1, FR-003 |
| 16 | Cerrar sesión y abrir `/organizadores/eventos/evt-1` | Ingreso de organizadores | US4-2 |
| 17 | Apagar el backend y tocar **Ver más** o **Marcar utilizada** | Aviso "No pudimos conectarnos. Probá de nuevo en un rato." y las filas quedan como estaban | Edge cases, FR-016 |

## Verificación por API (opcional)

```bash
TOKEN=$(curl -s -X POST localhost:3005/organizadores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"produccion@latrama.com.ar","contrasena":"Entradas2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s localhost:3005/organizadores/eventos/evt-1/ventas -H "Authorization: Bearer $TOKEN"                 # resumen + 20 ventas
curl -s "localhost:3005/organizadores/eventos/evt-1/ventas?estado=Pendiente%20de%20pago" -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3005/organizadores/eventos/evt-7/ventas/<numero-confirmada>/utilizacion -H "Authorization: Bearer $TOKEN"
curl -s localhost:3005/organizadores/eventos/evt-2/ventas -H "Authorization: Bearer $TOKEN"                 # 404 EVENTO_NO_ENCONTRADO
```
