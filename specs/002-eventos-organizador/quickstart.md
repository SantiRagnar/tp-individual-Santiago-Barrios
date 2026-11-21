# Quickstart: validar Mis eventos, crear y editar evento

Guía para comprobar la feature de punta a punta. Contratos: [eventos.openapi.yaml](contracts/eventos.openapi.yaml) y [rutas-front.md](contracts/rutas-front.md). Datos y seed: [data-model.md](data-model.md).

Cuentas: las de la feature 001, todas con la contraseña de desarrollo `Entradas2026` (`produccion@latrama.com.ar`, `hola@clubdelchiste.com.ar`, `contacto@lumbre.com.ar`).

## 1. Backend

```bash
cd aiTicketIt-back
npm test          # todos en verde, incluidos los de la feature 001
npm start
```

Con el backend levantado:

```bash
TOKEN=$(curl -s -X POST localhost:3000/organizadores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"produccion@latrama.com.ar","contrasena":"Entradas2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
AUTH="Authorization: Bearer $TOKEN"

# Mis eventos → 200 con 4 eventos de La Trama (evt-1, evt-3, evt-7, evt-8); Hamlet: vendidas 154, cupo 250
curl -s localhost:3000/organizadores/eventos -H "$AUTH"

# Evento ajeno (Risas a Domicilio, de Club del Chiste) → 404 EVENTO_NO_ENCONTRADO
curl -s localhost:3000/organizadores/eventos/evt-2 -H "$AUTH"

# Publicar sin datos → 400 con nombre, fechaHora, ubicacion y tiposDeEntrada
curl -s -X POST localhost:3000/organizadores/eventos -H "$AUTH" -H 'Content-Type: application/json' -d '{"estado":"Publicado"}'

# Guardar borrador vacío → 201 con estado Borrador
curl -s -X POST localhost:3000/organizadores/eventos -H "$AUTH" -H 'Content-Type: application/json' -d '{"estado":"Borrador"}'

# Subir imagen → 201 {id, url}; un .txt → 415 IMAGEN_INVALIDA
curl -s -X POST localhost:3000/organizadores/imagenes -H "$AUTH" -H 'Content-Type: image/png' --data-binary @alguna.png

# Editar Edipo Rey (Finalizado) → 409 EVENTO_FINALIZADO
```

`/docs` muestra los grupos "Eventos del organizador" e "Imágenes" con los mismos endpoints, ejemplos y errores que el contrato.

## 2. Front

```bash
cd aiTicketIt-front
npx expo install expo-image-picker @react-native-community/datetimepicker
npm run lint && npx tsc --noEmit
npx expo start    # w para web
```

Entrar a `/organizadores` con `produccion@latrama.com.ar`.

## 3. Escenarios de aceptación

| # | Pasos | Resultado esperado |
|---|---|---|
| 1 | Ingresar como La Trama | Mis eventos: "4 eventos"; Hamlet "154 de 250 entradas vendidas" (Publicado); Edipo Rey Finalizado; La gaviota Borrador; tile **Nuevo evento** al final (US1) |
| 2 | Ingresar como Club del Chiste | Solo Risas a Domicilio e Impro Express (SC-004) |
| 3 | **Crear evento** → no tocar nada; después tocar **Publicar evento** | Al abrir: **Publicar evento** deshabilitado, sin nota ni errores; vista previa con "Nombre del evento", "Fecha a definir", "Ubicación", "Capacidad total: 0 lugares". Al tocarlo: no se envía nada, aparecen los errores de nombre, fecha, ubicación y "Agregá al menos un tipo de entrada", con la nota "Revisá los campos marcados para publicar." (FR-013) |
| 4 | Escribir nombre, ubicación, fecha pasada | "La fecha tiene que ser futura" (US2-5) |
| 5 | Fecha futura, agregar "Platea" y "platea" | "Ya hay una entrada con este nombre" en la segunda (US2-7) |
| 6 | Cupo 0 / precio −1 / precio 0 | "El cupo tiene que ser 1 o más" / "El precio no puede ser negativo" / válido (US2-8) |
| 7 | Subir un PNG; subir un PDF | El PNG se ve en la dropzone y en la vista previa; el PDF muestra "La imagen tiene que ser JPG o PNG" y se conserva la imagen anterior |
| 8 | Agregar `trailer.mp4` en material multimedia | Tag con ícono de video, se puede quitar |
| 9 | Completar todo y **Publicar evento** | Va al Detalle mínimo; en Mis eventos aparece Publicado con "0 de N entradas vendidas" (US2-1) |
| 10 | **Crear evento**, solo nombre, **Guardar borrador** | Vuelve a Mis eventos; el evento aparece como Borrador con "Fecha a definir" (US3) |
| 11 | Abrir La gaviota → **Editar evento** → **Publicar evento** | Pasa a Publicado (US3-4) |
| 12 | Bodas de sangre → **Editar evento** | Título "Editar evento", datos cargados, sin **Guardar borrador**, Platea con "30 vendidas" y quitar deshabilitado (US4) |
| 13 | Bajar el cupo de Platea a 20 | "El cupo no puede ser menor a las vendidas (30)" y **Guardar cambios** deshabilitado |
| 14 | Cambiar el precio de Platea, agregar "VIP" y **Guardar cambios** | Vuelve al Detalle; en Mis eventos las vendidas siguen siendo 110 y el cupo suma el VIP (US4-2, SC-006) |
| 15 | Abrir Edipo Rey | Detalle sin **Editar evento** (US4-5) |
| 16 | Abrir `/organizadores/eventos/evt-2` como La Trama | "No encontramos el evento." (US4-6) |
| 17 | Ventana de 390 px de ancho | Mis eventos en 1 columna; en Crear evento la vista previa queda debajo; sin scroll horizontal |
| 18 | Apagar el backend y **Publicar evento** | "No pudimos conectarnos. Probá de nuevo en un rato."; el formulario conserva todo |

## 4. Resultado de la validación (2026-11-21)

Backend: 172 tests en verde (incluidos los de la feature 001). Front: `npm run lint` y `npx tsc --noEmit` sin errores. Recorrido en Chrome (web) a 960 px, con las variantes de 390 px y 1280 px medidas en un iframe de ese ancho.

| Escenarios | Resultado |
|---|---|
| 1–7, 9–18 | Como se espera |
| 4 | Validado con la regla compartida (tests de `reglasEvento` y de integración); en pantalla se probó junto con el 5 y el 6 |
| 7 | Probado arrastrando un PNG y un PDF a la dropzone web |
| 8 | **Pendiente a mano**: usa el selector de archivos del sistema, que no se puede automatizar |

Diferencias encontradas y corregidas durante la validación:

- Los errores de campo aparecen mientras se escribe, no solo al salir del campo ("Validar mientras se escribe", design-system.md). Escribir cuenta como tocar el campo (FR-013).
- En web, un componente `.web.tsx` no puede importar desde su propio nombre sin extensión (resuelve a sí mismo): lo compartido va en un archivo aparte (`campoFechaHoraComun.ts`, `dropzoneComun.tsx`).
- Con imagen cargada, "Cambiar imagen" va fuera del botón de la dropzone (no se anidan botones).
- Al reiniciar el backend las sesiones se pierden (están en memoria) y el panel vuelve al Ingreso: es el comportamiento esperado de la feature 001.
