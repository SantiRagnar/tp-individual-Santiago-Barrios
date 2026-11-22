# Quickstart: Calificaciones y opiniones (compradores)

Guía para validar la feature de punta a punta. Contratos en [contracts/](contracts/), reglas y datos en [data-model.md](data-model.md).

## Levantar

```bash
cd aiTicketIt-back && npm start                 # puerto 3000 (o PORT=…)
cd aiTicketIt-front && npx expo start --web     # o en el emulador / dispositivo con EXPO_PUBLIC_API_URL
```

- **Swagger** en http://localhost:3000/docs. Tienen que aparecer, con el tag "Calificaciones":
  - `POST /compradores/compras/{numero}/calificacion`;
  - `GET /compradores/calificaciones/pendiente`.
- **App de compradores**: `sofia.gomez@correo.com` / `Entradas2026`. Su compra **A-0871** (Tango en el Conventillo, Lumbre) está Utilizada sin calificar.
- El backend guarda todo en memoria: reiniciarlo vuelve al seed y permite repetir los escenarios.

## Tests

```bash
cd aiTicketIt-back && npm test
cd aiTicketIt-front && npm run lint && npx tsc --noEmit
```

## Escenarios de validación

| # | Pasos | Resultado esperado | Req. |
|---|---|---|---|
| 1 | Antes de calificar, abrir el Detalle de **Cartas a Julieta** (Lumbre) y anotar el puntaje y "N reseñas de eventos anteriores" | Datos de referencia para los escenarios 8 y 9 | — |
| 2 | Abrir **Explorar** | Arriba de la lista: "Tu entrada fue utilizada — ¿Cómo fue tu experiencia en Tango en el Conventillo?", 5 estrellas y **Calificar** deshabilitado | US3-1, FR-014 |
| 3 | Menú de perfil → **Mis compras** | A-0871 muestra "Calificá tu experiencia"; A-0655 muestra "Calificaste ★★★★☆" | FR-012 |
| 4 | Tocar "Calificá tu experiencia" en A-0871 | Calificar experiencia: "Tango en el Conventillo · Dom 18 oct", "Compra #A-0871 · General × 2", "Elegí de 1 a 5 estrellas", "0/500" y **Enviar calificación** deshabilitado | US1-1, US1-2 |
| 5 | Tocar la 4.ª estrella | 4 llenas, "Muy bueno" y botón habilitado; con un lector de pantalla se anuncia "4 estrellas", seleccionada | US1-3, FR-008 |
| 6 | Tocar la 5.ª estrella y escribir un comentario | "Excelente"; el contador sube; no deja pasar de 500 | US1-4 |
| 7 | **Enviar calificación** | Llega al Detalle de A-0871 con "Tu calificación" ★★★★★, el comentario y "Visible en los eventos de Lumbre"; Volver lleva a Mis compras, que muestra "Calificaste ★★★★★" | US1-5, US1-6, FR-010 |
| 8 | Abrir el Detalle de **Cartas a Julieta** | La primera reseña es "Sofía G." ★★★★★ · Tango en el Conventillo con el comentario; el contador es N+1 y el puntaje, el nuevo promedio | US2-1, US2-2 |
| 9 | Volver a **Explorar** y ordenar por **Puntaje** | La tarjeta de Cartas a Julieta muestra el puntaje nuevo; el orden lo refleja; ya no hay recordatorio | US2-4, US3-3 |
| 10 | Reiniciar el backend, entrar de nuevo, calificar desde el **recordatorio** con 3 estrellas y sin comentario | "Gracias, tu reseña ya es visible en los eventos del organizador."; en Cartas a Julieta la reseña dice ★★★☆☆ y "Sin comentario." | US3-2, FR-017 |
| 11 | Abrir el Detalle de A-1042 (Confirmada) | No hay ninguna acción de calificar | Edge cases |
| 12 | Con la API: `POST /compradores/compras/A-0871/calificacion` de nuevo | 409 `COMPRA_YA_CALIFICADA`; la calificación no cambia | FR-002 |
| 13 | Con la API: calificar A-1042 | 409 `CALIFICACION_NO_PERMITIDA` | FR-002 |
| 14 | Con la API: `{ "puntaje": 6 }`, `{ "puntaje": 4.5 }`, comentario de 501 caracteres | 400 `DATOS_INVALIDOS` | FR-003 |
| 15 | Con la API, con el token de otro comprador (`martin.perez@correo.com`): calificar A-0871 | 404 `COMPRA_NO_ENCONTRADA` | FR-001, SC-004 |
| 16 | Cortar el backend y tocar **Enviar calificación** | "No pudimos conectarnos. Probá de nuevo en un rato."; las estrellas y el comentario siguen | FR-019 |

### Ejemplos con curl

```bash
TOKEN=$(curl -s localhost:3000/compradores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"sofia.gomez@correo.com","contrasena":"Entradas2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -s localhost:3000/compradores/calificaciones/pendiente -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3000/compradores/compras/A-0871/calificacion -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"puntaje":5,"comentario":"Hermosa puesta."}'
```
