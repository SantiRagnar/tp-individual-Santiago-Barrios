# Research: Mis eventos, crear y editar evento (organizadores)

Decisiones técnicas de la feature 002. Las de la feature 001 (tests, validación con zod, formato de errores, sesión, design system, etc.) siguen vigentes y no se repiten; ver [001 research.md](../001-login-email-password/research.md).

## R1. Estado Finalizado: derivado, no guardado (FR-007)

- **Decision**: el evento guarda solo `estado ∈ {Borrador, Publicado}`. El estado que se muestra se calcula al leer: un Publicado con `fechaHora <= ahora` se devuelve como **Finalizado**. Un Borrador sigue siendo Borrador aunque su fecha haya pasado (edge case de la spec).
- **Rationale**: no hace falta un proceso que corra cada tanto (la constitución pide justificar procesos nuevos), y el estado nunca queda desactualizado.
- **Alternatives considered**: un timer que actualiza los estados (agrega un proceso y estados viejos entre ejecuciones); recalcular al iniciar (queda desactualizado mientras el servicio corre).

## R2. Reloj inyectable para los tests

- **Decision**: `services/reloj.js` exporta `ahora()` (por defecto `new Date()`) y `fijarAhora(fecha | null)` solo para tests. `reiniciarEstado()` vuelve al reloj real. Los tests de integración fijan "hoy" en `2026-11-09T12:00:00-03:00`, la fecha de referencia de `pantallas.md`.
- **Rationale**: "Finalizado" y "la fecha tiene que ser futura" dependen del momento actual; sin reloj fijo, los tests del seed se romperían a medida que pasan los días.
- **Alternatives considered**: mockear `Date` globalmente (frágil); `node:test` `mock.timers` (afecta también a los timers de supertest).

## R3. Fecha y hora: ISO 8601 con zona horaria de Argentina

- **Decision**: `fechaHora` viaja y se guarda como string ISO 8601 con offset (`2026-11-21T21:00:00-03:00`). La validación de "futura" compara instantes. El front muestra la fecha en hora local con el formato del design system ("Sáb 21 nov · 21:00").
- **Rationale**: un formato sin ambigüedad, que zod valida con `z.iso.datetime({ offset: true })` y que `Date` interpreta igual en el back y en el front.
- **Alternatives considered**: timestamp numérico (ilegible en `/docs` y en el seed); fecha y hora separadas (dos campos para un solo concepto).

## R4. Validar en dos niveles: forma (zod) y reglas de publicación (servicio) (FR-011 a FR-015, FR-020)

- **Decision**:
  - `schemas/eventoSchema.js` (zod, middleware `validar`) valida solo la **forma**: tipos de dato, `categoria` dentro de la lista, `estado ∈ {Borrador, Publicado}`, `cupo` y `precio` enteros, largos máximos (nombre 120, descripción 2000, ubicación 200, nombre de tipo 60). Todo es opcional/nullable, porque un borrador no exige nada (FR-014).
  - `services/reglasEvento.js` valida las **reglas para publicar** (nombre, fecha, fecha futura, ubicación, al menos un tipo, reglas de cada tipo, unicidad de nombres) y las **reglas de ventas** (no quitar un tipo con ventas, cupo ≥ vendidas). Devuelve todos los errores juntos con los mensajes del design system y el servicio los lanza como `DatosInvalidos(campos)`.
- **Rationale**: las reglas de publicación dependen del reloj y del evento guardado (vendidas), así que son lógica de negocio y van en `services/` con tests unitarios (Principio II y III). Así un pedido directo a la API no puede saltearse la validación (FR-015).
- **Alternatives considered**: todo en zod con `superRefine` (mezcla reglas de negocio con la capa de schemas y necesita acceso al repositorio).

## R5. Nombres de campo con ruta completa en los errores

- **Decision**: los errores de tipos de entrada usan la ruta con puntos: `tiposDeEntrada.1.cupo`. Se ajusta `middlewares/validar.js` para unir `issue.path` con `.` en lugar de tomar solo `path[0]`; para los campos planos (ingreso) el resultado es el mismo. El error general "Agregá al menos un tipo de entrada" usa `campo: "tiposDeEntrada"`.
- **Rationale**: el front tiene que poner cada mensaje debajo de la tarjeta "Entrada N" correcta.
- **Alternatives considered**: devolver un objeto anidado (rompe el formato de errores de la feature 001).

## R6. Edición: reemplazo completo, con identidad de los tipos de entrada (FR-019, FR-020)

- **Decision**: `PUT /organizadores/eventos/{id}` recibe el evento completo. Cada tipo de entrada existente viaja con su `id`; los nuevos, sin `id`. El servicio:
  1. rechaza la edición de un evento Finalizado (409 `EVENTO_FINALIZADO`);
  2. rechaza `estado: "Borrador"` sobre un Publicado (409 `NO_SE_PUEDE_DESPUBLICAR`);
  3. si falta un tipo con `vendidas > 0` → 400 con `campo: "tiposDeEntrada"` y "Tiene ventas: no se puede quitar";
  4. si a un tipo con ventas se le pone un cupo menor → 400 "El cupo no puede ser menor a las vendidas (N)";
  5. conserva `vendidas` de cada tipo por `id` (el cliente nunca manda `vendidas`; si lo manda, se ignora);
  6. un `id` de tipo que no pertenece al evento → 400 `DATOS_INVALIDOS`.
- **Rationale**: el formulario siempre tiene el evento entero; un PUT completo es más simple que un PATCH y el `id` permite conservar las ventas.
- **Alternatives considered**: endpoints por tipo de entrada (muchas llamadas para un solo "Guardar"); PATCH parcial (más casos a validar).

## R7. Imagen del evento: subida aparte, en memoria (FR-009)

- **Decision**:
  - `POST /organizadores/imagenes` recibe el archivo crudo (`Content-Type: image/jpeg` o `image/png`) con `express.raw({ type: [...], limit: "5mb" })`, sin dependencias nuevas. Verifica los bytes iniciales (firma JPG `FF D8 FF` / PNG `89 50 4E 47`) además del Content-Type. Guarda `{ id (UUID), organizadorId, tipoMime, datos (Buffer) }` en `imagenesRepository` y responde `{ id, url }`.
  - `GET /imagenes/{id}` sirve los bytes con su Content-Type y `Cache-Control: public, max-age=31536000, immutable`. Es **público** (sin sesión) para que `<Image>` lo pueda cargar en web y nativo sin headers; el `id` es un UUID aleatorio, no adivinable.
  - El evento guarda `imagenId`. Al crear o editar, el servicio verifica que la imagen exista y sea del mismo organizador (si no, 400 en `imagenId`).
  - Errores: formato → 415 `IMAGEN_INVALIDA` "La imagen tiene que ser JPG o PNG"; tamaño → 413 `IMAGEN_MUY_GRANDE` "La imagen no puede pesar más de 5 MB".
- **Rationale**: la imagen se sube apenas se elige, así la vista previa puede usar la URL real y el JSON del evento sigue chico. `express.raw` ya viene con Express.
- **Alternatives considered**: `multer` + multipart (dependencia nueva sin necesidad); base64 dentro del JSON del evento (un 33% más pesado, sube el límite del body de todas las rutas y obliga a reenviar la imagen en cada guardado).
- **Consecuencia aceptada**: las imágenes subidas y nunca usadas quedan en memoria hasta reiniciar. Es aceptable para el TP (persistencia en memoria, se pierde al reiniciar).

## R8. Imágenes de ejemplo del seed

- **Decision**: 8 PNG de 1600×900 (uno por evento del seed) en `aiTicketIt-back/repository/imagenes-seed/`. Son imágenes generadas (degradés con los colores del design system), sin derechos de terceros. `reiniciarRepositorios()` las carga en `imagenesRepository` con ids fijos (`img-seed-hamlet`, …).
- **Rationale**: las tarjetas del seed muestran una imagen real y se sirven por el mismo endpoint que las subidas (un solo camino).
- **Alternatives considered**: URLs externas (dependen de internet y de terceros); eventos del seed sin imagen (no se ve cómo queda la tarjeta).

## R9. Material multimedia: solo nombres (FR-009)

- **Decision**: `materialMultimedia: [{ nombre, tipo: "foto" | "video" }]` dentro del evento. El front obtiene el nombre y el tipo del archivo que elige el organizador y no sube su contenido.
- **Rationale**: es lo que se aclaró en `/speckit-clarify` (Q2).

## R10. Elegir archivos en el front

- **Decision**: **expo-image-picker** para la imagen (`mediaTypes: ['images']`) y para el material multimedia (`['images', 'videos']`), en web y nativo; del resultado se usan `uri`, `mimeType`, `fileName` y `fileSize`. La imagen se sube con `fetch(uri)` → `blob` → `POST /organizadores/imagenes`. En web, la dropzone además acepta arrastrar un archivo, con un componente `.web.tsx` que usa los eventos `dragover`/`drop` del DOM.
- **Rationale**: un solo paquete del SDK de Expo para las dos plataformas. El front valida formato y tamaño antes de subir, y el back lo vuelve a validar.
- **Alternatives considered**: expo-document-picker (no filtra por imagen/video igual de bien y no da `mimeType` confiable en todas las plataformas); un `<input type="file">` a mano (solo web).

## R11. Campo de fecha y hora en el front

- **Decision**: en web (el panel es desktop) se usa el `<input type="datetime-local">` del navegador, con un componente `CampoFechaHora.web.tsx`. En nativo, **@react-native-community/datetimepicker** (fecha y después hora) en `CampoFechaHora.tsx`. El valor se convierte a ISO con el offset local.
- **Rationale**: el control nativo de cada plataforma es accesible y no hay que construir un calendario.
- **Alternatives considered**: una librería de calendario propia de JS (más peso y estilos que no siguen los tokens); dos TextField con máscara (propenso a errores).

## R12. Categoría como select

- **Decision**: un componente `Select` del design system. En web usa el `<select>` del navegador con el estilo de Field; en nativo abre un BottomSheet/modal con las opciones. Opciones: Teatro, Comedia, Drama, Amor. El valor es nullable en borrador; para publicar no es obligatorio (la spec no lo exige), y en la vista previa, si falta, no se muestra el Tag de categoría.
- **Rationale**: el diseño lo define como select y son solo 4 opciones.

## R13. Validación compartida en el front

- **Decision**: `src/lib/validacionEvento.ts` replica las reglas y los mensajes de `reglasEvento.js` (igual que `validacionIngreso.ts` en la feature 001), para mostrar los errores mientras se escribe y la nota de **Publicar evento**. Los errores que devuelve el back (`campos`) se muestran en el mismo lugar, para los casos que el front no puede saber (p. ej. fecha que pasó mientras el formulario estaba abierto).
- **Rationale**: respuesta inmediata en la pantalla sin dejar de validar en el servidor (FR-015).

## R14. Grilla adaptable

- **Decision**: la cantidad de columnas sale de `useWindowDimensions()`: 4 columnas desde 1200 px de ancho, 3 desde 900, 2 desde 600 y 1 por debajo. En Crear/Editar evento, la vista previa (400 px) va a la derecha desde 1000 px y debajo del formulario en pantallas más angostas.
- **Rationale**: el diseño es desktop, pero el panel tiene que poder usarse sin scroll horizontal (supuesto de la spec, igual que el Ingreso de la feature 001).

## R15. Orden de Mis eventos (FR-006)

- **Decision**: el servicio ordena: primero los no Finalizados con fecha (más próxima primero), después los no Finalizados sin fecha (por fecha de creación), y al final los Finalizados (más reciente primero).
- **Rationale**: lo próximo es lo más accionable para el organizador.

## R16. Acceso a eventos ajenos (FR-022)

- **Decision**: todas las rutas de eventos del organizador filtran por `req.sesion.usuario.id`. Un evento que existe pero es de otro organizador responde **404 `EVENTO_NO_ENCONTRADO`**, igual que uno inexistente.
- **Rationale**: no revela qué ids existen (mismo criterio que FR-011 de la feature 001).

## R17. Ids y montos

- **Decision**: eventos `evt-N` y tipos de entrada `tip-N`, con contadores en el repositorio que se reinician con el seed (el seed usa ids fijos `evt-1`…`evt-8`). Precios y cupos son enteros en pesos (sin centavos), como el diseño ("$ 18.000").
- **Rationale**: ids legibles en tests y en `/docs`; el diseño no usa centavos.

## R18. Datos de ejemplo de eventos (FR-024)

- **Decision**: el seed carga los 8 eventos de `pantallas.md`. Donde la tabla no trae cupo o vendidas se completan con valores coherentes: Risas a Domicilio (General 120/95, Mesa preferencial 30/22), Cartas a Julieta (General 100/40, Pareja 40/12), Impro Express (General 80/10), Tango en el Conventillo (General 90/90). Las descripciones son textos de ejemplo cortos. La gaviota no tiene categoría (Borrador).
- **Rationale**: los valores tienen que ser consistentes con las compras de ejemplo que lleguen en otras features (p. ej. A-0790 Cartas Pareja × 1).
