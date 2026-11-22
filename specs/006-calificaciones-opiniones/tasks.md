---

description: "Task list for feature 006 · Calificaciones y opiniones"
---

# Tasks: Calificaciones y opiniones (compradores)

**Input**: Design documents from `specs/006-calificaciones-opiniones/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: obligatorios en el backend (constitución, Principio II: TDD). Cada bloque "Tests primero" se escribe antes que su implementación y tiene que **fallar** (rojo) antes de implementar. El front no tiene tests automáticos: se valida con `npm run lint`, `npx tsc --noEmit` y el [quickstart](quickstart.md).

**Organization**: tareas agrupadas por historia de usuario (US1 a US3 de la spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia a la que pertenece (US1, US2, US3).
- Rutas relativas a la raíz del repo: `aiTicketIt-back/` y `aiTicketIt-front/src/`.
- Convenciones de tests: cada test arranca con `reiniciarEstado()` (`tests/helpers/estado.js`). Se usan `tokenDeComprador`, `MARTIN`, `HOY` y `fijarAhora` (`tests/helpers/sesion.js`), `crearEventoConCupo` (`tests/helpers/compras.js`) y `crearComprasCalificadas` (`tests/helpers/compradores.js`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dejar documentado en el diseño lo que agregaron la spec y la clarificación (Principio I) antes de implementar.

- [X] T001 Actualizar `Diseño de AI Ticket It/pantallas.md` (research R11):
  - En "Reglas de negocio · Calificaciones": se puede calificar en cuanto la compra está Utilizada, sin esperar a que termine el evento y sin plazo.
  - En "Compradores 12 · Calificar experiencia":
    - las notas "Esta compra ya fue calificada." y "Solo podés calificar una entrada utilizada.";
    - el mensaje sin conexión;
    - la navegación al enviar: desde el Detalle, vuelve a él; desde Mis compras, reemplaza por el Detalle (research R9).
  - En "Compradores 02": el recordatorio muestra la compra del evento más reciente y se vuelve a pedir al entrar a Explorar.
  - En "Compradores 08 y 09": quitar las notas "Feature 004: … sin acción" de calificar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: reglas, validación, escritura en el repositorio, DTO y piezas del front que usan las tres historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase.

### Tests primero (deben fallar)

- [X] T002 [P] Crear `aiTicketIt-back/tests/unit/reglasCalificacion.test.js` para `motivoNoCalificable` y `puedeCalificar` (data-model.md § Valores derivados):
  - Utilizada sin calificar → `null` / `true`.
  - Utilizada calificada → `"YA_CALIFICADA"`.
  - Pendiente de pago, Confirmada, Cancelada y Reembolsada → `"NO_UTILIZADA"`.
  - Una compra calificada en otro estado (caso defensivo) → `"YA_CALIFICADA"`, porque se verifica primero.
  - La regla no depende de la fecha.
- [X] T003 [P] Crear `aiTicketIt-back/tests/unit/calificacionSchema.test.js` para las reglas de `data-model.md` § Calificación `puntaje` y `comentario` y § Validaciones de entrada:
  - `puntaje` acepta 1 y 5; rechaza 0, 6, 4.5, `"5"` y ausente, con el mensaje "Elegí de 1 a 5 estrellas".
  - `comentario`: ausente → `null`; `null` → `null`; `"   "` → `null`; `"  hola  "` → `"hola"`.
  - Un comentario de 500 caracteres con espacios alrededor se acepta; uno de 501 después de recortar se rechaza.
  - Un campo extra se rechaza.
- [X] T004 [P] Ampliar `aiTicketIt-back/tests/unit/comprasRepository.test.js` con `calificar(numero, calificacion, { organizadorId })` (research R2):
  - Asigna `compra.calificacion`.
  - `resumenDeCalificaciones` suma el puntaje y +1 a la cantidad.
  - `listarCalificadas` la devuelve primera cuando su `calificadaEn` es la más reciente, y en su lugar cuando no lo es.
  - Lanza un error si la compra ya estaba calificada o no existe, sin tocar el índice.
  - Después de `reiniciar()` el índice vuelve al seed.
- [X] T005 [P] Ampliar `aiTicketIt-back/tests/unit/compraDto.test.js` con data-model.md § Vista Compra `acciones.calificar` y `motivoNoCalificable`: Utilizada sin calificar → `true` / `null`; calificada → `false` / `"YA_CALIFICADA"`; Confirmada → `false` / `"NO_UTILIZADA"`.

### Implementación

- [X] T006 [P] Agregar `CompraYaCalificada` (409 `COMPRA_YA_CALIFICADA`) y `CalificacionNoPermitida` (409 `CALIFICACION_NO_PERMITIDA`) en `aiTicketIt-back/errors/ErrorDeDominio.js`, con los mensajes de data-model.md § Errores nuevos.
- [X] T007 [P] Crear `aiTicketIt-back/services/reglasCalificacion.js` con las funciones puras `motivoNoCalificable(compra)` y `puedeCalificar(compra)`, sin reloj (data-model.md § Valores derivados). Hace pasar T002.
- [X] T008 [P] Crear `aiTicketIt-back/schemas/calificacionSchema.js` (zod `strictObject`) según data-model.md § Validaciones de entrada para `Calificacion.puntaje` y `Calificacion.comentario`. El recorte y la conversión de vacío a `null` se hacen en el schema. Hace pasar T003.
- [X] T009 Agregar `calificar(numero, calificacion, { organizadorId })` en `aiTicketIt-back/repository/comprasRepository.js` (research R2). Crea `new Calificacion(...)` con data-model.md § Calificación `puntaje`, `comentario` y `calificadaEn`, la inserta con `insertarOrdenada(indice.calificadas, compra, claveDe)` y actualiza `suma` y `cantidad`. No vuelve a indexar por evento ni por comprador. Hace pasar T004.
- [X] T010 Agregar `acciones.calificar` y `motivoNoCalificable` en `aiTicketIt-back/dto/compraDto.js` usando `reglasCalificacion` (data-model.md § Vista Compra). Hace pasar T005. Depende de T007.
- [X] T011 [P] En `aiTicketIt-front/src/api/compras.ts`, agregar al tipo `Compra` `acciones.calificar: boolean` y `motivoNoCalificable: 'YA_CALIFICADA' | 'NO_UTILIZADA' | null`, y la función `calificarCompra(token, numero, { puntaje, comentario })` → `POST /compradores/compras/{numero}/calificacion` ([contracts/rutas-front.md](contracts/rutas-front.md) § Cambios en `src/api/compras.ts`).
- [X] T012 [P] Agregar en `aiTicketIt-front/src/lib/formato.ts`:
  - `palabraPuntaje(n: number | null)`: 1 Malo, 2 Regular, 3 Bueno, 4 Muy bueno, 5 Excelente; sin elegir, "Elegí de 1 a 5 estrellas".
  - `contadorCaracteres(n)`: "N/500".
- [X] T013 [P] Crear `aiTicketIt-front/src/components/ds/SelectorEstrellas.tsx` (research R10, design-system § Rating):
  - 5 `Pressable` con `accessibilityRole="button"`, `accessibilityLabel` "N estrellas" y `accessibilityState.selected` en la elegida.
  - Llenas hasta la elegida, en `color.accent300`.
  - Props `valor`, `onCambiar`, `tamano` (36 para la pantalla, más chico para el recordatorio) y `deshabilitado`.
  - Solo tokens.

**Checkpoint**: `npm test` pasa con los tests nuevos de esta fase. `npx tsc --noEmit` pasa.

---

## Phase 3: User Story 1 - El comprador califica su experiencia desde su compra (Priority: P1) 🎯 MVP

**Goal**: calificar una compra Utilizada desde Mis compras o desde el Detalle de compra, en Compradores 12, una sola vez.

**Independent Test**: con `sofia.gomez@correo.com`: Mis compras → "Calificá tu experiencia" en A-0871 → 5 estrellas + comentario → **Enviar calificación**. Tiene que verse "Tu calificación" en el Detalle y "Calificaste ★★★★★" en Mis compras (quickstart, escenarios 3–7).

### Tests primero (deben fallar)

- [X] T014 [P] [US1] Ampliar `aiTicketIt-back/tests/unit/comprasService.test.js` con `calificar(compradorId, numero, { puntaje, comentario })`:
  - Ajena o inexistente → `CompraNoEncontrada`.
  - Ya calificada → `CompraYaCalificada`, y se conserva la calificación original.
  - No Utilizada → `CalificacionNoPermitida`.
  - Éxito: `calificadaEn` es `ahora()` (con `fijarAhora`), y el resumen del organizador del evento cambia.
  - Una Utilizada de un evento futuro también se puede calificar (Clarifications).
- [X] T015 [P] [US1] Crear `aiTicketIt-back/tests/integration/calificarCompra.test.js` (US1, contrato `POST /compradores/compras/{numero}/calificacion`):
  - 201 con `compra.calificacion` (puntaje, comentario recortado o `null`), `acciones.calificar: false` y `motivoNoCalificable: "YA_CALIFICADA"`.
  - `GET /compradores/compras/A-0871` y `GET /compradores/compras` reflejan la calificación.
  - 409 `COMPRA_YA_CALIFICADA` al repetir y 409 `CALIFICACION_NO_PERMITIDA` para A-1042, A-1037 y A-0790.
  - 404 `COMPRA_NO_ENCONTRADA` con el token de `MARTIN` y con un número inexistente.
  - 400 `DATOS_INVALIDOS` con `campos` para puntaje 0, 6 y 4.5, comentario de 501 caracteres y campo extra.
  - 401 sin token.
- [X] T016 [P] [US1] Ampliar `aiTicketIt-back/tests/integration/concurrencia.test.js` (research R6, SC-003): 20 `POST …/A-0871/calificacion` simultáneos con distintos puntajes. Tiene que haber exactamente un 201 y 19 respuestas 409 `COMPRA_YA_CALIFICADA`; la cantidad de reseñas de Lumbre sube exactamente 1, y la calificación guardada es la del único 201.

### Implementación

- [X] T017 [US1] Agregar `calificar(compradorId, numero, { puntaje, comentario })` en `aiTicketIt-back/services/comprasService.js`:
  - **SINCRÓNICA**, sin `await` entre verificar y escribir. Documentarlo junto al invariante existente.
  - Pasos: `compraDe` → `motivoNoCalificable` (`YA_CALIFICADA` → `CompraYaCalificada`, `NO_UTILIZADA` → `CalificacionNoPermitida`) → `comprasRepository.calificar(numero, { puntaje, comentario, calificadaEn: ahora().toISOString() }, { organizadorId: evento.organizadorId })`.
  - Devuelve `conContexto`.

  Hace pasar T014. Depende de T006, T007 y T009.
- [X] T018 [US1] Agregar `calificar(req, res)` en `aiTicketIt-back/controllers/comprasController.js` → 201 `{ compra }`, sin `async`.
- [X] T019 [US1] En `aiTicketIt-back/routes/compras.js`:
  - Agregar `router.post("/:numero/calificacion", validar(calificacionSchema), controller.calificar)`.
  - Copiar a `@openapi`, desde [contracts/calificaciones.openapi.yaml](contracts/calificaciones.openapi.yaml), el path, `NuevaCalificacion` y los dos campos nuevos de `Compra` (`acciones.calificar`, `motivoNoCalificable`) con el tag "Calificaciones".

  Hace pasar T015 y T016.
- [X] T020 [P] [US1] Crear `aiTicketIt-front/src/app/(compradores)/compras/[numero]/calificar.tsx` (Compradores 12, [contracts/rutas-front.md](contracts/rutas-front.md) § Compradores 12):
  - Carga la compra con `obtenerCompra`.
  - Muestra AppBar con el subtítulo "{evento} · {fecha corta}", la línea "Compra #… · {tipo} × {cantidad}", el título y el texto con el organizador.
  - `SelectorEstrellas` de tamaño 36 + `palabraPuntaje`.
  - `TextField` multiline con `maxLength` 500 y `contadorCaracteres`.
  - Nota según `motivoNoCalificable`.
  - **Enviar calificación**, deshabilitado sin estrellas, mientras envía o si `!acciones.calificar`.
  - Estados de carga, sin conexión y 404 (`PantallaDeAviso` "No encontramos esta compra.").
  - Con 409 `COMPRA_YA_CALIFICADA`, muestra la nota y recarga.
  - Al enviar con éxito: si `desde === 'detalle'`, `router.back()`; si no, `router.replace` a `/compras/[numero]` (research R9).
- [X] T021 [P] [US1] En `aiTicketIt-front/src/components/ds/PurchaseCard.tsx`, agregar la prop `onCalificar`: "Calificá tu experiencia" pasa a ser un `Pressable` propio, con su `accessibilityLabel`, visible solo si `compra.acciones.calificar`. Actualizar el comentario que decía "sin acción (FR-029)".
- [X] T022 [US1] En `aiTicketIt-front/src/app/(compradores)/mis-compras.tsx`, pasar a cada PurchaseCard `onCalificar` → `router.push({ pathname: '/compras/[numero]/calificar', params: { numero } })`. Depende de T021.
- [X] T023 [P] [US1] En `aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx`:
  - La tarjeta "Tu entrada fue utilizada…" se muestra cuando `compra.acciones.calificar`.
  - **Calificar experiencia** hace `router.push({ pathname: '/compras/[numero]/calificar', params: { numero, desde: 'detalle' } })`.
  - Quitar el comentario "Sin acción hasta la feature de calificaciones".
- [X] T024 [US1] Correr `npx expo start` una vez para regenerar `.expo/types` con la ruta nueva (typedRoutes). Después, `npx tsc --noEmit` y `npm run lint` en `aiTicketIt-front/`.

**Checkpoint**: la US1 funciona sola (quickstart, escenarios 3–7 y 11–16).

---

## Phase 4: User Story 2 - La calificación se publica como reseña del organizador (Priority: P1)

**Goal**: la calificación nueva se ve como reseña del organizador, con su puntaje y su contador, en el Detalle del evento, en las tarjetas de Explorar y en el orden por Puntaje.

**Independent Test**: después de calificar A-0871 con 5★, el Detalle de "Cartas a Julieta" muestra "Sofía G." ★★★★★ · Tango en el Conventillo primera, con el contador +1 y el promedio nuevo. Explorar refleja el puntaje (quickstart, escenarios 1, 8 y 9).

### Tests primero (deben fallar o confirmar el comportamiento)

- [X] T025 [P] [US2] Crear `aiTicketIt-back/tests/integration/resenaPublicada.test.js` (US2):
  - Calificar A-0871 con 5★ y comentario. Después, `GET /compradores/eventos/{id de Cartas a Julieta}` devuelve la reseña primera (autor "Sofía G.", puntaje 5, evento "Tango en el Conventillo", comentario), `cantidadResenas` +1 y el puntaje igual al promedio calculado a mano con un decimal.
  - `GET /compradores/organizadores/{Lumbre}/resenas` la devuelve primera.
  - Sin comentario, la reseña tiene `comentario: null`.
  - Un organizador sin reseñas (evento de `crearEventoConCupo` con un organizador sin calificaciones, más una compra Utilizada creada en el test) pasa de puntaje `null` a tener puntaje y reseña.
  - `GET /compradores/eventos?orden=puntaje` cambia de orden cuando la calificación nueva sube el promedio de un organizador por encima de otro.

  Usar `fijarAhora` para que `calificadaEn` sea posterior a las reseñas del seed.

### Implementación

- [X] T026 [US2] Si T025 falla, corregir lo que lea calificaciones sin pasar por `comprasRepository.resumenDeCalificaciones` y `listarCalificadas`, en `aiTicketIt-back/services/explorarService.js`, `aiTicketIt-back/services/resenasService.js` o `aiTicketIt-back/dto/eventoCompradorDto.js`. Lo esperado es que pase sin cambios, porque esos servicios leen el índice en cada request (research R1, R8).
- [X] T027 [P] [US2] Crear `aiTicketIt-front/src/lib/calificacionesRecientes.ts`: un contador en memoria (`marcarCalificacionNueva()`, `versionCalificaciones()`) para que Explorar sepa si hubo calificaciones desde su última carga. Llamar a `marcarCalificacionNueva()` después de cada `calificarCompra` exitoso: en T020 y, en la US3, en T034.
- [X] T028 [US2] En `aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx`, en `useFocusEffect`, si `versionCalificaciones()` cambió desde la última carga, recargar la lista con el criterio actual para que puntajes y orden reflejen la calificación (SC-002). Si no cambió, no recargar, para no perder el scroll. Depende de T027.

**Checkpoint**: US1 y US2 funcionan juntas (quickstart, escenarios 1 y 7–9).

---

## Phase 5: User Story 3 - El comprador califica desde el recordatorio de Explorar (Priority: P2)

**Goal**: el recordatorio en Explorar con la compra Utilizada sin calificar del evento más reciente, para calificar sin salir de Explorar.

**Independent Test**: con A-0871 sin calificar, Explorar muestra el recordatorio. Calificar con 3★ muestra "Gracias, tu reseña ya es visible en los eventos del organizador." y, al volver a entrar, el recordatorio ya no está (quickstart, escenarios 2 y 10).

### Tests primero (deben fallar)

- [X] T029 [P] [US3] Ampliar `aiTicketIt-back/tests/unit/comprasService.test.js` con `pendienteDeCalificar(compradorId)` (data-model.md § Compra pendiente de calificar):
  - Sofía → A-0871.
  - Sin pendientes → `null`.
  - Con dos Utilizadas sin calificar de eventos distintos → la del evento con `fechaHora` más reciente.
  - A igual fecha → número mayor.
  - Ignora las calificadas, las de otros estados y las de otros compradores.
- [X] T030 [P] [US3] Crear `aiTicketIt-back/tests/integration/recordatorioCalificacion.test.js` (US3, contrato `GET /compradores/calificaciones/pendiente`):
  - 200 `{ compra }` con A-0871 para Sofía.
  - `{ compra: null }` para un comprador sin pendientes.
  - Después de calificar A-0871 → `null`.
  - Con dos pendientes, después de calificar la primera devuelve la otra (US3-4).
  - 401 sin token.

### Implementación

- [X] T031 [US3] Agregar `pendienteDeCalificar(compradorId)` en `aiTicketIt-back/services/comprasService.js`: filtra `listarPorComprador` con `puedeCalificar`, ordena por `evento.fechaHora` desc y `numero` desc, y devuelve `conContexto` de la primera o `null`. Hace pasar T029.
- [X] T032 [US3] Agregar `pendienteDeCalificar(req, res)` en `aiTicketIt-back/controllers/comprasController.js` → 200 `{ compra: dto | null }`.
- [X] T033 [US3] Crear `aiTicketIt-back/routes/calificaciones.js` con `crearRouterCalificaciones()`: `requiereSesion("comprador")`, `GET /pendiente` y `@openapi` copiado de [contracts/calificaciones.openapi.yaml](contracts/calificaciones.openapi.yaml). Montarlo en `aiTicketIt-back/app.js` como `app.use("/compradores/calificaciones", crearRouterCalificaciones())`. Hace pasar T030.
- [X] T034 [P] [US3] Crear `aiTicketIt-front/src/components/ds/RecordatorioCalificacion.tsx` ([contracts/rutas-front.md](contracts/rutas-front.md) § Compradores 02):
  - Tarjeta `surface` con "Tu entrada fue utilizada" y "¿Cómo fue tu experiencia en {evento}?".
  - `SelectorEstrellas` chico.
  - `TextField` multiline "Contanos qué te pareció (opcional)" con `maxLength` 500.
  - **Calificar**, deshabilitado sin estrellas o mientras envía.
  - Al enviar con éxito, confirmación en línea con `check-circle` y "Gracias, tu reseña ya es visible en los eventos del organizador.", y llama a `marcarCalificacionNueva()`.
  - Sin conexión, muestra el texto de siempre y conserva lo elegido.
  - Con 409, llama a `onDesactualizado()`.
- [X] T035 [P] [US3] Agregar `obtenerPendienteDeCalificar(token)` → `GET /compradores/calificaciones/pendiente` en `aiTicketIt-front/src/api/compras.ts`.
- [X] T036 [US3] En `aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx`:
  - Pedir el pendiente en `useFocusEffect` y mostrar `RecordatorioCalificacion` en el `ListHeaderComponent`, arriba del contador.
  - Si la request falla, no mostrar nada (FR-016).
  - Después de la confirmación, mantenerla hasta el próximo foco (FR-015).

  Depende de T028, T034 y T035.

**Checkpoint**: las tres historias funcionan (quickstart completo).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T037 [P] Ampliar `aiTicketIt-back/tests/integration/docs.test.js`: `/docs.json` incluye `POST /compradores/compras/{numero}/calificacion` y `GET /compradores/calificaciones/pendiente` con el tag "Calificaciones", y el schema `Compra` incluye `motivoNoCalificable`.
- [X] T038 [P] Actualizar `CLAUDE.md` con un párrafo "Endpoints de calificaciones (feature 006)":
  - Los dos endpoints y sus errores.
  - Regla: Utilizada, una vez, sin plazo.
  - `comprasRepository.calificar` actualiza el índice por organizador.
  - `calificar` es sincrónica.
  - `acciones.calificar` y `motivoNoCalificable` en el DTO.
  - En la estructura del front: la ruta `compras/[numero]/calificar` (`desde=detalle`), `SelectorEstrellas`, `RecordatorioCalificacion` y `lib/calificacionesRecientes.ts`.
- [X] T039 Correr `npm test` en `aiTicketIt-back/`: todos los tests, incluidos los de las features 001 a 005, pasan.
- [X] T040 Correr `npm run lint` y `npx tsc --noEmit` en `aiTicketIt-front/`, sin errores.
- [ ] T041 Recorrer [quickstart.md](quickstart.md) (escenarios 1–16) en web a 390 × 844 y verificar textos, tokens y estados deshabilitado, sin conexión y 404 contra `pantallas.md` y `design-system.md` § Rating.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: después del Setup. Bloquea todas las historias.
- **US1 (Phase 3)**: después de Foundational.
- **US2 (Phase 4)**: los tests (T025) necesitan el endpoint de calificar (T019). El front (T027–T028) se puede hacer en paralelo con la US1.
- **US3 (Phase 5)**: el backend (T029–T033) solo depende de Foundational y de T017 (usa el mismo `calificar` en el test de "pasa a la siguiente"). El front depende de T028 (Explorar ya con `useFocusEffect`).
- **Polish (Phase 6)**: al final.

### Within Each User Story

- Tests primero, en rojo; después servicio → controller → ruta + `@openapi`; después el front.
- `comprasService.js` y `comprasController.js` los tocan US1 y US3: hacer esas tareas en orden (T017 antes que T031, T018 antes que T032).

### Parallel Opportunities

- **Phase 2**: T002–T005 (tests) en paralelo. Después, T006, T007, T008, T011, T012 y T013 en paralelo; T009 y T010 cuando estén sus dependencias.
- **US1**: T014, T015 y T016 en paralelo. T020, T021 y T023 (front) en paralelo con el backend.
- **US3**: T029 y T030 en paralelo; T034 y T035 en paralelo.

---

## Parallel Example: User Story 1

```text
# Tests (rojo), en paralelo:
T014 tests/unit/comprasService.test.js (+ calificar)
T015 tests/integration/calificarCompra.test.js
T016 tests/integration/concurrencia.test.js (+ calificaciones simultáneas)

# Front, en paralelo con el backend:
T020 app/(compradores)/compras/[numero]/calificar.tsx
T021 components/ds/PurchaseCard.tsx
T023 app/(compradores)/compras/[numero]/index.tsx
```

## Parallel Example: User Story 3

```text
T029 tests/unit/comprasService.test.js (+ pendienteDeCalificar)   |  T030 tests/integration/recordatorioCalificacion.test.js
T034 components/ds/RecordatorioCalificacion.tsx                  |  T035 api/compras.ts (+ obtenerPendienteDeCalificar)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 + Phase 2.
2. Phase 3 (US1): un comprador ya puede calificar y la calificación queda guardada, con concurrencia cubierta.
3. Validar con el quickstart (escenarios 3–7 y 11–16).

### Incremental Delivery

1. **US1**: calificar desde Mis compras y desde el Detalle.
2. **US2**: la reseña se ve en los eventos del organizador y en Explorar. Probablemente es solo un test, porque el índice ya alimenta esas pantallas.
3. **US3**: el recordatorio en Explorar.
4. **Polish**: docs, CLAUDE.md y el recorrido completo.
