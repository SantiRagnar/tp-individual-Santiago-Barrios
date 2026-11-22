# Quickstart: validar Explorar, Detalle del evento y Favoritos

Guía para comprobar la feature de punta a punta. Contratos: [compradores.openapi.yaml](contracts/compradores.openapi.yaml) y [rutas-front.md](contracts/rutas-front.md). Datos y seed: [data-model.md](data-model.md#seed).

Cuenta: `sofia.gomez@correo.com` con la contraseña de desarrollo `Entradas2026`. Los resultados de abajo suponen "hoy" = 2026-11-09 (así corren los tests). Con el reloj real, los eventos cuya fecha ya pasó no aparecen.

## 1. Backend

```bash
cd aiTicketIt-back
npm test          # todos en verde, incluidos los de las features 001 y 002
npm start
```

Con el backend levantado:

```bash
TOKEN=$(curl -s -X POST localhost:3000/compradores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"sofia.gomez@correo.com","contrasena":"Entradas2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
AUTH="Authorization: Bearer $TOKEN"

# Explorar → total 5: evt-2, evt-1, evt-4, evt-3, evt-5 (por fecha); siguiente null
curl -s "localhost:3000/compradores/eventos" -H "$AUTH"

# Búsqueda sin tildes → solo Hamlet en el Galpón (evt-1)
curl -s "localhost:3000/compradores/eventos?busqueda=galpon" -H "$AUTH"

# Comedia por precio → Impro Express ($ 8.000) y Risas a Domicilio ($ 9.000)
curl -s "localhost:3000/compradores/eventos?categoria=Comedia&orden=precio" -H "$AUTH"

# Por puntaje → La Trama 4.5 (evt-1, evt-3), Lumbre 4.0 (evt-4), Club del Chiste 3.7 (evt-2, evt-5)
curl -s "localhost:3000/compradores/eventos?orden=puntaje" -H "$AUTH"

# Orden inválido → 400 DATOS_INVALIDOS
curl -s "localhost:3000/compradores/eventos?orden=nombre" -H "$AUTH"

# Detalle de Hamlet → precioDesde 12000, precioHasta 26000, agotado false (VIP con 0 disponibles),
# organizador La Trama 4.5 con 4 reseñas; resenas: 4 (la más reciente primero: Diego R.) y siguiente null
curl -s localhost:3000/compradores/eventos/evt-1 -H "$AUTH"

# Borrador (La gaviota) y Finalizado (Edipo Rey) → 404 EVENTO_NO_ENCONTRADO
curl -s localhost:3000/compradores/eventos/evt-8 -H "$AUTH"
curl -s localhost:3000/compradores/eventos/evt-7 -H "$AUTH"

# Favoritos: marcar Bodas de sangre (dos veces: idempotente) → 204; listar → [evt-3]; quitar → 204
curl -s -o /dev/null -w "%{http_code}\n" -X PUT localhost:3000/compradores/favoritos/evt-3 -H "$AUTH"
curl -s -o /dev/null -w "%{http_code}\n" -X PUT localhost:3000/compradores/favoritos/evt-3 -H "$AUTH"
curl -s localhost:3000/compradores/favoritos -H "$AUTH"
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE localhost:3000/compradores/favoritos/evt-3 -H "$AUTH"

# Marcar un Borrador → 404
curl -s -X PUT localhost:3000/compradores/favoritos/evt-8 -H "$AUTH"

# Sin sesión, o con token de organizador → 401 SESION_INVALIDA
curl -s localhost:3000/compradores/eventos
```

La paginación (más de 10 eventos y más de 5 reseñas) la cubren los tests de integración, que cargan eventos y compras calificadas extra con los repositorios. Swagger en <http://localhost:3000/docs> muestra los tags "Eventos para compradores" y "Favoritos".

## 2. Front

```bash
cd aiTicketIt-front
npx expo start    # una vez, para regenerar .expo/types con las rutas nuevas
npm run lint
npx tsc --noEmit
```

Abrir en web (ventana de 390 px de ancho) o en un teléfono con `EXPO_PUBLIC_API_URL` apuntando a la IP de la máquina, e ingresar como Sofía.

## 3. Escenarios de aceptación

| # | Pasos | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Ingresar | Explorar con "Hola, Sofía", "¿Qué querés ver?", "5 eventos" (con "hoy" = 2026-11-09) y BottomNav con Explorar activa | US1, FR-003, FR-011 |
| 2 | Mirar la tarjeta de Hamlet | Tag Teatro, "Sáb 21 nov · 21:00", Galpón de Guevara, "Desde $ 12.000", "4.5 · Compañía La Trama", **Comprar** | US1-3, FR-008 |
| 3 | Escribir "galpon" | Solo Hamlet; "1 evento" | US2-1 |
| 4 | Chip Comedia + orden Precio | Impro Express y después Risas a Domicilio; "2 eventos" | US2-2..4 |
| 5 | Buscar "xyz" | "No encontramos eventos — Probá con otra búsqueda o categoría.", "0 eventos" | US2-7, FR-010 |
| 6 | Tocar **Comprar** en una tarjeta | No pasa nada (no navega) | FR-009 |
| 7 | Tocar la tarjeta de Hamlet | Detalle: "Sábado 21 de noviembre", "21:00 h", sala, "$ 12.000 a $ 26.000", descripción, opiniones 4.5 con 4 reseñas, footer "Desde $ 12.000" + **Comprar** | US3, FR-012..014 |
| 8 | Volver | Explorar con la misma búsqueda, chip, orden y scroll | FR-015 |
| 9 | Abrir Impro Express | Precio "$ 8.000" (sin rango); opiniones de Club del Chiste 3.7 | US3-2 |
| 10 | Corazón en Bodas de sangre (Explorar), ir a Favoritos | Aparece Bodas de sangre; corazón lleno en las tres pantallas | US5-1, US5-3, FR-019 |
| 11 | Quitar el corazón desde Favoritos | Desaparece; estado vacío "Todavía no guardaste eventos…"; en Explorar el corazón está vacío | US5-2, US5-4, FR-022 |
| 12 | Marcar un favorito, cerrar sesión e ingresar de nuevo | El favorito sigue | US5-5, FR-020 |
| 13 | Apagar el backend y tocar un corazón | El corazón vuelve atrás y aparece "No pudimos conectarnos. Probá de nuevo en un rato." | Edge cases, R13 |
| 14 | Abrir `/eventos/evt-8` (Borrador) | "Este evento no está disponible." + **Volver a Explorar** | FR-016 |
| 15 | Con un organizador con más de 5 reseñas (ver nota) tocar **Ver más** | Se agregan 5 más abajo; el botón desaparece al mostrar todas | US3-5, FR-024 |
| 16 | Con más de 10 eventos visibles (ver nota) llegar al final de Explorar | Indicador de carga y 10 eventos más debajo; el contador muestra el total | US2-5, FR-025 |

**Nota sobre 15 y 16**: el seed tiene 5 eventos visibles y como máximo 4 reseñas por organizador. Para probarlo a mano, crear como organizador 6 eventos publicados más (feature 002). Para las reseñas, los tests de integración cubren el caso con 12 reseñas; a mano se puede bajar temporalmente el tamaño de página en `services/` para verlo.

## 4. Resultado de la validación (2026-11-22)

- **Backend**: `npm test` → 291 tests en verde (incluidas las features 001 y 002 y el test de escala de SC-007: con 1.000 eventos y 1.000 reseñas, cada pedido tarda menos de 200 ms y nunca trae más de 10 eventos o 5 reseñas).
- **Front**: `npm run lint` y `npx tsc --noEmit` sin errores.
- **Recorrido en web** (backend en el puerto 3100 y Expo web en el 8095, con el reloj real del 2026-11-22): con la fecha real, Hamlet y Risas a Domicilio ya pasaron, así que Explorar muestra 3 eventos (Cartas a Julieta, Bodas de sangre, Impro Express) en lugar de 5. Se verificaron los escenarios 1 (con 3 eventos), 7 (Detalle de Bodas de sangre con facts, 4 reseñas de La Trama y puntaje 4.5), 8 (Volver), 10 y 11 (corazón en Explorar → Favoritos → quitar → estado vacío), 14 (evento no disponible + Volver a Explorar) y la búsqueda "KONEX" (encuentra Cartas a Julieta sin distinguir mayúsculas). Los escenarios 2–5, 9, 15 y 16 dependen de la fecha de referencia o de más datos y quedan cubiertos por los tests de integración.
- **Observación fuera de esta feature**: la consola web muestra el aviso de React "does not recognize the `accessibilityElementsHidden` prop", que viene de `BrandMark.tsx` y `DividerText.tsx` (pantalla de Ingreso, feature 001).
