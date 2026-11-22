---
description: "Lista de tareas de la feature 004: Compra, pago simulado y Mis compras (compradores)"
---

# Tasks: Compra, pago simulado y Mis compras (compradores)

**Input**: documentos de diseño en `specs/004-compra-pago-mis-compras/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/compras.openapi.yaml](contracts/compras.openapi.yaml), [contracts/rutas-front.md](contracts/rutas-front.md), [quickstart.md](quickstart.md)

**Tests**:
- Son obligatorios en el backend por la constitución (Principio II, TDD). Cada bloque "tests primero" se escribe y se ve fallar antes de su implementación.
- Todos los tests arrancan con `reiniciarEstado()`. Los que dependen de "hoy" llaman además a `fijarAhora(HOY)` (2026-11-09T12:00-03:00, `tests/helpers/sesion.js`).
- Los tokens se obtienen con `tokenDeComprador(email)` y `tokenDeOrganizador(email)`.
- El front no tiene tests automáticos. Se valida con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Organization**: las tareas se agrupan por historia de usuario para poder implementarlas y probarlas por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia a la que pertenece (US1–US5).
- Las rutas son relativas a la raíz del repo: `aiTicketIt-back/` y `aiTicketIt-front/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: textos de diseño que faltan y la fecha simulada para la validación manual

- [X] T001 [P] Documentar en "Diseño de AI Ticket It/pantallas.md" los textos nuevos, antes de cualquier tarea de front (constitución, Principio I; research R12). Usar los textos exactos de contracts/rutas-front.md:
  - **Compradores 05**: los avisos "Ya no quedan suficientes entradas de {tipo}." y "El precio de {tipo} cambió. Revisá tu compra." al volver de Pago; estados de carga, error con **Reintentar** y evento no disponible.
  - **Compradores 06**: **Pagar $ X** deshabilitado sin medio de pago y mientras se procesa; error de conexión.
  - **Compradores 08**: AppBar con Volver; estado vacío "Todavía no compraste entradas — Cuando compres, vas a encontrarlas acá." + **Explorar eventos** (secundario); se recarga al volver a la pantalla.
  - **Compradores 09**: "No encontramos esta compra." + **Volver a Mis compras**; Dialog con **Volver** / **Cancelar compra**.
  - **Compradores 03, 08 y 09**: **Datos personales**, "Calificá tu experiencia", **Calificar experiencia** y **Tengo una consulta** se ven pero no tienen acción hasta su feature (FR-029).
  - **Fuera del diseño**: marcar como resuelto "Cómo se confirma una compra Pendiente": con **Completar pago** simulado.

  Además, en "Diseño de AI Ticket It/design-system.md", documentar los dos componentes nuevos antes de implementarlos (constitución, Principio I, "primero se actualiza el diseño"):
  - **ResumenCompra**: tarjeta Resumen de Compradores 06 (evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}", total tabular; `pad-card`, `shadow-sm`).
  - **MarcaDeExito**: `check-circle` grande en acento de Compradores 07, en § Feedback.

  Si el artifact "Diseño de sistema de dos apps" no se actualiza en esta feature, dejarlo anotado en la cabecera de `pantallas.md` (fuente y versión).
- [X] T002 [P] Tests unitarios de `fijarAhoraDesdeEntorno(valor)` en aiTicketIt-back/tests/unit/reloj.test.js (research R15). Escribirlos primero y verlos fallar (constitución, Principio II). Cubrir:
  - Con `undefined` o `""`: no fija nada (`ahora()` sigue el reloj real) y devuelve `null`.
  - Con `"2026-11-09T12:00:00-03:00"`: `ahora()` devuelve esa fecha y la función devuelve el ISO fijado.
  - Con `"mañana"` o `"2026-13-40"`: lanza un `Error` con un mensaje que nombra `FECHA_SIMULADA` y no cambia el reloj.
  - Termina con `fijarAhora(null)`.
- [X] T003 Agregar `fijarAhoraDesdeEntorno(valor)` a aiTicketIt-back/services/reloj.js (hace pasar T002). En aiTicketIt-back/index.js, antes de `listen`, llamarla con `process.env.FECHA_SIMULADA`:
  - Si devuelve una fecha, loguear "Fecha simulada: {iso}".
  - Si lanza, loguear el mensaje y terminar con `process.exit(1)`.

  `index.js` no lleva más lógica que esa llamada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo de compra ampliado, seed, reglas de compra, DTO, errores, router base con el detalle de compra (lo usan la confirmación, el Detalle, Completar pago y Cancelar) y la base del front

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

### Backend: tests primero

- [X] T004 [P] Tests unitarios de `reglasCompra` en aiTicketIt-back/tests/unit/reglasCompra.test.js (research R7, data-model.md § Transiciones y § Valores derivados):
  - `puedeCompletarPago`: `true` solo para una compra `Pendiente de pago` con evento futuro (data-model.md Compra.estado).
  - `motivoNoCancelable`:
    - `null` para Pendiente o Confirmada con evento futuro.
    - `UTILIZADA`, `REEMBOLSADA` y `CANCELADA` según el estado.
    - `EVENTO_REALIZADO` para Pendiente o Confirmada con `fechaHora ≤ ahora`.
    - Una Utilizada de un evento pasado da `UTILIZADA` (prioridad).
  - `estadoTrasCancelar`: Confirmada → `Reembolsada`, Pendiente de pago → `Cancelada`.
  - `diasParaEvento`:
    - Hamlet desde `HOY` → 13; 25 horas antes → 2; 1 hora antes → 1.
    - Evento pasado o compra no Confirmada → `null`.
- [X] T005 [P] Tests unitarios de `comprasRepository` en aiTicketIt-back/tests/unit/comprasRepository.test.js (se suman a los existentes; research R8):
  - `siguienteNumero()` devuelve `A-1043` y después `A-1044` (data-model.md Compra.numero). Con un contador en 9999, el siguiente es `A-10000`.
  - `reiniciar()` reinicia el contador.
  - `listarPorComprador("cmp-1")` devuelve A-1042, A-1037, A-0871, A-0790, A-0655 en ese orden (`[creadaEn desc, numero desc]`, data-model.md Compra.creadaEn) y un comprador sin compras devuelve `[]`.
  - Guardar una compra nueva la agrega al índice del comprador.
  - Las compras del seed tienen `tipoDeEntradaNombre` y `precioUnitario` completados (A-1042 → "Platea", 18000; data-model.md Compra.tipoDeEntradaNombre, Compra.precioUnitario).
  - Los resúmenes de calificaciones de la feature 003 no cambian.
- [X] T006 [P] Tests unitarios de `compraDto` en aiTicketIt-back/tests/unit/compraDto.test.js (contracts/compras.openapi.yaml § Compra):
  - Arma `evento { id, nombre, fechaHora, ubicacion, imagenUrl, organizador { id, nombre } }` con los datos actuales del evento.
  - `tipoDeEntrada { id, nombre, precioUnitario }` sale de la copia de la compra, aunque el tipo se haya renombrado o borrado del evento (research R6).
  - `diasParaEvento`, `acciones { completarPago, cancelar }` y `motivoNoCancelable` salen de `reglasCompra` con el `ahora` recibido.
  - `calificacion` es `null` o `{ puntaje, comentario, calificadaEn }` (data-model.md Compra.calificacion).
  - `imagenUrl` es `null` si el evento no tiene imagen.
- [X] T007 [P] Tests de integración de `GET /compradores/compras/:numero` en aiTicketIt-back/tests/integration/detalleCompra.test.js (base; US3 suma más casos):
  - 200 con `{ compra }` para A-1042 de Sofía.
  - 401 sin token y con token de organizador.
  - 404 `COMPRA_NO_ENCONTRADA` para `A-9999` y para A-0612 (de Martín) pedida por Sofía (SC-004).

### Backend: implementación

- [X] T008 [P] Agregar a aiTicketIt-back/errors/ErrorDeDominio.js las clases `PrecioCambiado` (409 `PRECIO_CAMBIADO`), `LugaresInsuficientes` (409 `LUGARES_INSUFICIENTES`), `CompraNoEncontrada` (404 `COMPRA_NO_ENCONTRADA`, "No encontramos esta compra."), `PagoNoPermitido` (409 `PAGO_NO_PERMITIDO`) y `CancelacionNoPermitida` (409 `CANCELACION_NO_PERMITIDA`). Usar los mensajes de contracts/compras.openapi.yaml (research R4).
- [X] T009 [P] En aiTicketIt-back/models/Compra.js, agregar `tipoDeEntradaNombre` y `precioUnitario` al constructor (data-model.md Compra.tipoDeEntradaNombre, Compra.precioUnitario) y actualizar el comentario de cabecera (ya no es "versión mínima").
- [X] T010 Agregar a `comprasSeed` en aiTicketIt-back/repository/seed.js las compras de Sofía A-1042, A-1037, A-0871 y A-0790, con un helper `compra(...)` sin calificación. Copiar exactamente la tabla de data-model.md § Seed: Compra.estado, Compra.medioDePago, Compra.cantidad, Compra.monto y Compra.creadaEn. No tocar `vendidas` (research R5, R9) y actualizar el comentario de cabecera de `comprasSeed`.
- [X] T011 Ampliar aiTicketIt-back/repository/comprasRepository.js (research R8, data-model.md § Operaciones nuevas del repositorio):
  - Índice `Map<compradorId, Set<numero>>`, actualizado en `guardar` (data-model.md Compra.compradorId).
  - `listarPorComprador(compradorId)`, ordenado por `[creadaEn desc, numero desc]`.
  - `siguienteNumero()`: contador desde el mayor número del seed, formato `A-` + al menos 4 dígitos (data-model.md Compra.numero).
  - En `reiniciar()`, completar `tipoDeEntradaNombre` y `precioUnitario = monto / cantidad` de las compras del seed a partir de `eventosSeed`, y reiniciar el contador y el índice.

  Hace pasar T005.
- [X] T012 [P] Crear aiTicketIt-back/services/reglasCompra.js con funciones puras `puedeCompletarPago`, `motivoNoCancelable`, `estadoTrasCancelar` y `diasParaEvento`, todas con firma `(compra, evento, ahora)` (research R7, data-model.md § Valores derivados). Hace pasar T004.
- [X] T013 Crear aiTicketIt-back/dto/compraDto.js con `aCompraDto(compra, evento, organizador, ahora)` según contracts/compras.openapi.yaml § Compra (`imagenUrl` como en `eventoCompradorDto`). `calificacion` se arma desde data-model.md Compra.calificacion (`null` o `{ puntaje, comentario, calificadaEn }`), y `tipoDeEntrada` desde Compra.tipoDeEntradaNombre y Compra.precioUnitario. Hace pasar T006.
- [X] T014 Crear aiTicketIt-back/services/comprasService.js con `obtener(compradorId, numero)`:
  - Devuelve `{ compra, evento, organizador, ahora }`.
  - Lanza `CompraNoEncontrada` si no existe o si `compra.compradorId !== compradorId` (data-model.md Compra.compradorId, SC-004).
  - Dejar al inicio del archivo el comentario de invariante de research R2: "comprar, completarPago y cancelar son sincrónicas: no agregar await entre la verificación y la escritura".
- [X] T015 Crear aiTicketIt-back/controllers/comprasController.js (`obtener` → `{ compra: aCompraDto(...) }`) y aiTicketIt-back/routes/compras.js:
  - `crearRouterCompras()` con `requiereSesion("comprador")` y `GET /:numero`.
  - Bloque `@openapi` con el tag Compras, el path `/compradores/compras/{numero}` y los componentes `MedioDePago`, `EstadoCompra`, `Compra` y la respuesta `CompraNoEncontrada` de contracts/compras.openapi.yaml.

  Montar el router en aiTicketIt-back/app.js como `app.use("/compradores/compras", crearRouterCompras())`. Hace pasar T007.
- [X] T016 [P] Crear aiTicketIt-back/tests/helpers/compras.js:
  - `crearEventoConCupo({ cupo, precio, fecha, organizadorId })`: un evento Publicado visible con un solo tipo, que devuelve `{ eventoId, tipoId }`.
  - `cuerpoDeCompra(overrides)`: un body válido de `POST /compradores/compras`.

  Reutiliza `eventosRepository` como `tests/helpers/compradores.js`. Además, actualizar `crearComprasCalificadas` en aiTicketIt-back/tests/helpers/compradores.js para que sus compras tengan `tipoDeEntradaNombre` y `precioUnitario` (nombre y precio del tipo del evento; data-model.md Compra.tipoDeEntradaNombre, Compra.precioUnitario). Si no, el DTO devolvería `tipoDeEntrada.nombre` `undefined` y no cumpliría el contrato. Correr los tests de la feature 003 que usan ese helper.

### Front: base compartida

- [X] T017 [P] Crear aiTicketIt-front/src/api/compras.ts:
  - Tipos `MedioDePago`, `EstadoCompra`, `Compra` (contracts/compras.openapi.yaml § Compra) y `NuevaCompra`, y la constante `MEDIOS_DE_PAGO` en el orden del diseño.
  - Funciones `comprar`, `listarCompras`, `obtenerCompra`, `completarPago` y `cancelarCompra`, que llaman a `pedir()` con `token` y `tipo: 'comprador'`.
- [X] T018 [P] Agregar a aiTicketIt-front/src/lib/formato.ts (research R13):
  - `cuentaRegresiva(dias, { paraElEvento })`: "Faltan N días" / "Falta 1 día", con el sufijo " para el evento." si se pide.
  - `entradas(tipo, cantidad)` → "Platea × 2".
  - `numeroCompra(numero)` → "#A-1042".
  - `fechaYHoraLarga(iso)` → "Sábado 21 de noviembre · 21:00 h".
- [X] T019 [P] Agregar `TagCompra` a aiTicketIt-front/src/components/ds/Tag.tsx:
  - Mapeo fijo de design-system.md § Tag: Pendiente de pago → outline + `clock`, Confirmada → accent + `check-circle`, Utilizada → neutral + `ticket`, Cancelada → neutral + `x-circle`, Reembolsada → neutral + `arrow-counter-clockwise` (íconos de `phosphor-react-native`).
  - Variante `grande` (`tag-lg`, 12px) para el Detalle de compra.
- [X] T020 Mover aiTicketIt-front/src/app/(compradores)/eventos/[id].tsx a aiTicketIt-front/src/app/(compradores)/eventos/[id]/index.tsx, sin cambiar su contenido (plan, re-check punto 2). En aiTicketIt-front/src/app/(compradores)/_layout.tsx, registrar dentro del `Stack.Protected guard={!!comprador}` las pantallas `eventos/[id]/index`, `eventos/[id]/entradas`, `eventos/[id]/pago`, `compras/[numero]/index`, `compras/[numero]/confirmada` y `mis-compras` (contracts/rutas-front.md § Rutas). Correr `npx expo start` una vez para regenerar `.expo/types`.

**Checkpoint**: `npm test` en verde (incluidas las features 001–003) y `GET /compradores/compras/A-1042` responde. El front compila con las rutas registradas.

---

## Phase 3: User Story 1 - El comprador compra entradas para un evento (Priority: P1) 🎯 MVP

**Goal**: desde **Comprar**, elegir tipo y cantidad, elegir un medio de pago, tocar **Pagar $ X** (simulado) y ver "¡Compra confirmada!". La compra queda Confirmada y descuenta los lugares, sin sobreventa ni cambios de precio.

**Independent Test**: con "hoy" = 2026-11-09, comprar Platea × 2 de Hamlet con Tarjeta de crédito. Debe verse la confirmación con "#A-1043" y "Faltan 13 días para el evento.", y la Platea tiene que pasar de "Quedan 12" a "Quedan 10" (quickstart pasos 6–10).

### Tests for User Story 1 ⚠️

> Escribirlos primero y verlos fallar.

- [X] T021 [P] [US1] Tests unitarios de `compraSchema` en aiTicketIt-back/tests/unit/compraSchema.test.js (data-model.md § Validaciones de entrada). Cubrir:
  - Un body válido pasa.
  - Faltan `eventoId` o `tipoDeEntradaId` (data-model.md Compra.eventoId, Compra.tipoDeEntradaId).
  - `cantidad` 0, 11, 1.5 o texto (data-model.md Compra.cantidad).
  - `medioDePago` fuera de los 4 (data-model.md Compra.medioDePago).
  - `precioUnitario` negativo o no entero (data-model.md Compra.precioUnitario).
  - Campos extra rechazados.
  - Cada caso con el mensaje de la tabla.
- [X] T022 [P] [US1] Tests unitarios de `comprasService.comprar` en aiTicketIt-back/tests/unit/comprasService.test.js (research R2–R6). Cubrir:
  - Crea una compra Confirmada con `numero` nuevo, `monto = precioUnitario × cantidad`, `creadaEn = ahora()`, copia de `tipoDeEntradaNombre` y `precioUnitario` y el `compradorId` de la sesión (data-model.md Compra.numero, Compra.monto, Compra.estado, Compra.creadaEn).
  - Suma `cantidad` a las vendidas del tipo (data-model.md TipoDeEntrada.vendidas).
  - Evento inexistente, Borrador o Finalizado → `EventoNoEncontrado`.
  - Tipo inexistente o precio distinto → `PrecioCambiado`, sin tocar vendidas.
  - `cantidad > cupo − vendidas` → `LugaresInsuficientes`, sin tocar vendidas.
  - El orden de verificación es visibilidad → precio → lugares.
  - `comprar(...)` no devuelve una `Promise` (invariante de R2).
  - Un mismo comprador puede comprar dos veces el mismo tipo (FR-005).
- [X] T023 [P] [US1] Tests de integración de `POST /compradores/compras` en aiTicketIt-back/tests/integration/comprar.test.js (contracts/compras.openapi.yaml). Cubrir:
  - 201 con la compra del ejemplo del contrato: A-1043, `diasParaEvento` 13, `acciones.cancelar` `true`.
  - Después, `GET /compradores/eventos/evt-1` muestra la Platea con `disponibles` 10, y `GET /organizadores/eventos/evt-1` (token de La Trama) muestra la Platea con `vendidas` 70 (FR-026, lado organizador).
  - 400 `DATOS_INVALIDOS` con `campos` (cantidad 11, medio inválido).
  - 401 sin token y con token de organizador.
  - 404 para `evt-8` (Borrador) y `evt-7` (Finalizado).
  - 409 `PRECIO_CAMBIADO` con `precioUnitario` viejo, después de que La Trama edita el precio con `PUT /organizadores/eventos/evt-1`.
  - 409 `PRECIO_CAMBIADO` con un tipo inexistente.
  - 409 `LUGARES_INSUFICIENTES` para VIP (`tip-3`).
  - Un evento agotado por completo responde 409 en cualquier tipo.
  - Un 409 no crea compras: `GET /compradores/compras/A-1043` da 404 y la siguiente compra válida recibe A-1043 (así US1 no depende del listado de US2).
- [X] T024 [P] [US1] Test de concurrencia en aiTicketIt-back/tests/integration/concurrencia.test.js (SC-003, research R2):
  - Con `crearEventoConCupo({ cupo: 10 })`, disparar 50 `POST /compradores/compras` de cantidad 1 en paralelo con `Promise.all`, repartidos entre los 5 compradores del seed.
  - Esperar exactamente 10 respuestas 201 y 40 respuestas 409 `LUGARES_INSUFICIENTES`, con `vendidas` = 10 y 10 números de compra distintos.
  - Segundo caso: 6 pedidos de cantidad 3 sobre un cupo de 10 → 3 compras creadas (9 vendidas) y 3 rechazadas.

### Implementation for User Story 1

- [X] T025 [US1] Crear aiTicketIt-back/schemas/compraSchema.js con zod `strict()` según data-model.md § Validaciones de entrada (Compra.eventoId, Compra.tipoDeEntradaId, Compra.cantidad, Compra.medioDePago, Compra.precioUnitario) y los mensajes de la tabla. Hace pasar T021.
- [X] T026 [US1] Agregar a aiTicketIt-back/services/comprasService.js la función **sincrónica** `comprar(compradorId, { eventoId, tipoDeEntradaId, cantidad, medioDePago, precioUnitario })` (research R2–R6, data-model.md § Transiciones, fila Comprar):
  - Verifica con `esVisibleParaCompradores` y `ahora()`, después precio y después lugares.
  - Incrementa `tipo.vendidas` (data-model.md TipoDeEntrada.vendidas) y guarda la compra con `comprasRepository.siguienteNumero()` y `guardar(compra, { organizadorId })`.
  - Ningún `await` en todo el camino.

  Hace pasar T022.
- [X] T027 [US1] Agregar `crear` a aiTicketIt-back/controllers/comprasController.js (sin `async`; 201 `{ compra }`) y `POST /` con `validar(compraSchema)` a aiTicketIt-back/routes/compras.js. Sumar el bloque `@openapi` de `POST /compradores/compras` y el schema `NuevaCompra` de contracts/compras.openapi.yaml. Hace pasar T023 y T024.
- [X] T028 [P] [US1] Crear aiTicketIt-front/src/components/ds/RadioCard.tsx según design-system.md § RadioCard:
  - Opción con título, detalle a la derecha y línea secundaria.
  - Estados elegida (`shadow-sm` + borde acento), normal y deshabilitada.
  - `accessibilityRole="radio"` y `accessibilityState`.
  - Se usa para tipos de entrada y medios de pago.
- [X] T029 [P] [US1] Crear aiTicketIt-front/src/components/ds/QuantityStepper.tsx según design-system.md § QuantityStepper:
  - Botones `minus` / `plus` (44px) con valor tabular, `min`, `max` y deshabilitado.
  - Texto de ayuda "Máximo N" o "Sin cupo".
  - `aria-label` "Restar una entrada" / "Sumar una entrada".
- [X] T030 [P] [US1] Crear aiTicketIt-front/src/components/ds/ResumenCompra.tsx (tarjeta Resumen de Compradores 06: evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}", total) y aiTicketIt-front/src/components/ds/MarcaDeExito.tsx (`check-circle` grande en acento). Los dos se implementan según lo documentado en T001, en design-system.md § Feedback y § ResumenCompra.
- [X] T031 [US1] Crear aiTicketIt-front/src/app/(compradores)/eventos/[id]/entradas.tsx (Compradores 05, contracts/rutas-front.md § Compradores 05):
  - Pide `GET /compradores/eventos/{id}` en cada foco y preselecciona el primer tipo con lugares.
  - Cantidad 1..`min(disponibles, 10)`, ajustada al cambiar de tipo (FR-005).
  - ActionFooter "Total" + **Continuar al pago** → `pago` con `tipo` y `cantidad`.
  - Si llega el parámetro `aviso` (`lugares` | `precio`) con `tipoNombre`, muestra el aviso, lo limpia con `setParams` y reajusta tipo y cantidad (FR-028, FR-030).
  - Si ningún tipo tiene lugares (p. ej. se llegó por un link viejo a un evento agotado), todos los RadioCard se ven "Agotada", el stepper queda deshabilitado con la ayuda "Sin cupo" y **Continuar al pago** está deshabilitado (Edge Cases).
  - Estados de carga, error con **Reintentar** y no disponible (404), con el componente de la feature 003.
- [X] T032 [US1] Crear aiTicketIt-front/src/app/(compradores)/eventos/[id]/pago.tsx (Compradores 06, contracts/rutas-front.md § Compradores 06):
  - Pide el evento y arma ResumenCompra con el precio vigente del tipo, que es el `precioUnitario` que se envía (research R3).
  - RadioCard de los 4 medios sin preselección, la nota "Pago simulado: no se realiza ningún cobro." y el botón cta **Pagar $ X**, deshabilitado sin medio y mientras se procesa (FR-011).
  - Respuestas:
    - 201 → `router.dismiss(2)` (saca Pago y Elegir entradas, así queda arriba la pantalla donde se tocó **Comprar**, sea Explorar o el Detalle del evento) y después `router.push` de `compras/[numero]/confirmada`. Así nada del flujo de compra queda en la pila (FR-011, US1-9).
    - 409 → `router.back()` a Elegir entradas, después `router.setParams({ aviso, tipoNombre })` sobre esa pantalla. Alternativa equivalente: `router.dismissTo` con los mismos parámetros.
    - 404 → pantalla no disponible.
    - Error de red → aviso de conexión, con el botón habilitado para reintentar.
- [X] T033 [US1] Crear aiTicketIt-front/src/app/(compradores)/compras/[numero]/confirmada.tsx (Compradores 07, contracts/rutas-front.md § Compradores 07):
  - Pide `GET /compradores/compras/{numero}` y muestra MarcaDeExito, "¡Compra confirmada!", "{evento} · {tipo} × {cantidad}", "Compra #A-NNNN", `cuentaRegresiva(dias, { paraElEvento: true })` (omitida si es `null`) y "Vas a encontrar tus entradas en Mis compras.".
  - **Ver mi compra** (secundario) → `replace` a `compras/[numero]`, así Volver desde ese Detalle de compra lleva a la pantalla donde se tocó **Comprar** y nunca al flujo de compra (spec US3-5, Clarifications). **Volver a explorar** (ghost) → `dismissTo('/explorar')`.
  - Volver con el gesto o el botón atrás desde la confirmación también lleva a la pantalla donde se tocó **Comprar**.
- [X] T034 [US1] Darle acción a **Comprar**: navega a `/eventos/[id]/entradas` en el EventCard de aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx y en el ActionFooter de aiTicketIt-front/src/app/(compradores)/eventos/[id]/index.tsx. **Agotado** sigue deshabilitado. Quitar los comentarios de "sin acción" de la feature 003 (FR-003).

**Checkpoint**: US1 funciona sola. Quickstart pasos 6–13 y tests T021–T024 en verde.

---

## Phase 4: User Story 2 - El comprador ve sus compras en Mis compras (Priority: P1)

**Goal**: desde el Avatar de Explorar, abrir el Menú de perfil y llegar a Mis compras, con una PurchaseCard por compra (la más nueva primero).

**Independent Test**: como Sofía, Mis compras muestra A-1042, A-1037, A-0871, A-0790, A-0655 con sus tags, "Faltan 13 días" en Hamlet, la imagen atenuada en Cartas y "Calificaste ★★★★☆" en Edipo. Una compra nueva aparece primera (quickstart pasos 1–3 y 11).

### Tests for User Story 2 ⚠️

- [X] T035 [P] [US2] Tests unitarios de `comprasService.listar` en aiTicketIt-back/tests/unit/comprasService.test.js:
  - Devuelve las compras del comprador con su evento y organizador, en orden `[creadaEn desc, numero desc]` (data-model.md Compra.creadaEn).
  - Incluye compras de eventos Finalizados (FR-017).
  - Un comprador sin compras devuelve `[]`.
- [X] T036 [P] [US2] Tests de integración de `GET /compradores/compras` en aiTicketIt-back/tests/integration/misCompras.test.js:
  - Para Sofía, con `HOY`, la respuesta es 200 con los 5 números en orden y estos valores:
    - A-1042: `diasParaEvento` 13.
    - A-1037: `estado` "Pendiente de pago" y `diasParaEvento` `null`.
    - A-0790: Reembolsada.
    - A-0655: `calificacion.puntaje` 4.
  - Una compra recién creada aparece primera.
  - Martín ve solo A-0612 y A-0540.
  - Un comprador nuevo sin compras recibe `{ compras: [] }` (crearlo con `compradoresRepository` en el test).
  - 401 sin token y con token de organizador.

### Implementation for User Story 2

- [X] T037 [US2] Agregar `listar(compradorId)` a aiTicketIt-back/services/comprasService.js, que usa `comprasRepository.listarPorComprador`. Hace pasar T035.
- [X] T038 [US2] Agregar `listar` a aiTicketIt-back/controllers/comprasController.js (`{ compras: [...] }`) y `GET /` a aiTicketIt-back/routes/compras.js, con su bloque `@openapi` de contracts/compras.openapi.yaml. Hace pasar T036.
- [X] T039 [P] [US2] Crear aiTicketIt-front/src/components/ds/BottomSheet.tsx según design-system.md § BottomSheet: un `Modal` transparente con scrim `color-scrim`, hoja con radio superior y manija, que se cierra al tocar el scrim o con atrás en Android.
- [X] T040 [P] [US2] Crear aiTicketIt-front/src/components/ds/MenuPerfil.tsx (Compradores 03, contracts/rutas-front.md § Compradores 03):
  - Avatar de 52px, "{nombre} {apellido}" y "Mi perfil".
  - Filas **Mis compras**, **Favoritos**, **Datos personales** (sin acción, FR-029) y **Cerrar sesión** (Button ghost).
  - Recibe callbacks `onMisCompras`, `onFavoritos` y `onCerrarSesion`.
- [X] T041 [P] [US2] Crear aiTicketIt-front/src/components/ds/PurchaseCard.tsx según design-system.md § PurchaseCard:
  - Texto a la izquierda (evento, fecha corta, `entradas(...)`) e imagen de 104px a la derecha, al 40 % si la compra está Cancelada o Reembolsada.
  - Abajo, TagCompra y la cuenta regresiva en `accent-300` si `diasParaEvento` no es `null`.
  - Si está Utilizada: "Calificaste {estrellas}" o "Calificá tu experiencia" (texto con aspecto de acción, sin acción, FR-029).
  - Toda la tarjeta es presionable.
- [X] T042 [US2] En aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx, hacer que el Avatar sea un botón (`aria-label` "Abrir menú de perfil") que abre `BottomSheet` + `MenuPerfil`:
  - **Mis compras** → `/mis-compras`.
  - **Favoritos** → `/favoritos`.
  - **Cerrar sesión** → `cerrarSesion('comprador')`.
- [X] T043 [US2] Crear aiTicketIt-front/src/app/(compradores)/mis-compras.tsx (Compradores 08, contracts/rutas-front.md § Compradores 08):
  - AppBar "Mis compras" y una lista de PurchaseCard en el orden de la API; tocar una abre `/compras/[numero]`.
  - Pide los datos con `useFocusEffect`.
  - Estado vacío con EstadoVacio y **Explorar eventos** → `/explorar`.
  - Carga y error con **Reintentar**.

**Checkpoint**: US1 y US2 funcionan. Quickstart pasos 1–3, 11, 17 y 20.

---

## Phase 5: User Story 3 - El comprador ve el detalle de una compra (Priority: P1)

**Goal**: el Detalle de compra con su estado, la cuenta regresiva, la DetailList, la calificación (si tiene) y la nota de por qué no se puede cancelar.

**Independent Test**: abrir cada compra del seed de Sofía y verificar sus seis datos, el estado y la nota contra data-model.md § Seed. Una compra ajena muestra "No encontramos esta compra." (quickstart pasos 4, 5 y 18).

### Tests for User Story 3 ⚠️

- [X] T044 [US3] Sumar a aiTicketIt-back/tests/integration/detalleCompra.test.js (con `HOY`) los casos de data-model.md § Seed:
  - A-1042: `tipoDeEntrada.nombre` "Platea", `monto` 36000, `medioDePago` "Tarjeta de crédito", `evento.ubicacion` "Galpón de Guevara, Chacarita", `diasParaEvento` 13 y `acciones` `{ completarPago: false, cancelar: true }`.
  - A-1037: `acciones` `{ completarPago: true, cancelar: true }`.
  - A-0871: `motivoNoCancelable` `UTILIZADA` y `calificacion` `null`.
  - A-0790: `REEMBOLSADA`.
  - A-0655: `UTILIZADA` con `calificacion` `{ puntaje: 4, comentario: "Muy buena puesta…" }`.
  - Con `fijarAhora` después de Hamlet, A-1042 tiene `EVENTO_REALIZADO` y `diasParaEvento` `null`.
  - Si el tipo de una compra se renombra después, el detalle conserva el nombre comprado (research R6).

### Implementation for User Story 3

- [X] T045 [US3] Ajustar aiTicketIt-back/dto/compraDto.js y aiTicketIt-back/services/reglasCompra.js hasta que pase T044 (lo esperable es que ya pase con la Phase 2; si es así, solo verificar).
- [X] T046 [P] [US3] Crear aiTicketIt-front/src/components/ds/DetailList.tsx según design-system.md § DetailList: card con filas término (muted) / valor (`color-text`, tabular en montos y números) y separadores.
- [X] T047 [US3] Crear aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx (Compradores 09, contracts/rutas-front.md § Compradores 09):
  - AppBar con el nombre del evento, imagen, TagCompra grande y cuenta regresiva.
  - DetailList con Fecha (`fechaYHoraLarga`), Lugar, Entradas, Total, Pago y Compra.
  - Tarjeta "Tu calificación", o tarjeta "Tu entrada fue utilizada…" con **Calificar experiencia** sin acción (FR-029).
  - Nota por `motivoNoCancelable`, con los textos de data-model.md § Valores derivados.
  - **Tengo una consulta** (secundario, sin acción).
  - Pide los datos con `useFocusEffect`.
  - 404 → "No encontramos esta compra." + **Volver a Mis compras**.
  - Error de red con **Reintentar**.
  - Dejar los lugares de **Completar pago** (US4) y **Cancelar compra** (US5) sin renderizar todavía.

**Checkpoint**: US1–US3 funcionan. Es el alcance P1 completo: comprar, ver las compras y ver cada una.

---

## Phase 6: User Story 4 - El comprador completa el pago de una compra pendiente (Priority: P2)

**Goal**: en el Detalle de una compra Pendiente de pago, **Completar pago** (simulado) la pasa a Confirmada.

**Independent Test**: abrir A-1037, tocar **Completar pago** y verificar que queda Confirmada con cuenta regresiva y que los lugares de Risas no cambian (quickstart paso 14).

### Tests for User Story 4 ⚠️

- [X] T048 [P] [US4] Tests unitarios de `comprasService.completarPago` en aiTicketIt-back/tests/unit/comprasService.test.js:
  - Pendiente con evento futuro → Confirmada, conservando `numero`, `monto` y `medioDePago` (data-model.md Compra.estado, Compra.monto, Compra.medioDePago).
  - Las vendidas del tipo no cambian (data-model.md TipoDeEntrada.vendidas).
  - Cualquier otro estado, o evento pasado → `PagoNoPermitido`.
  - Compra ajena → `CompraNoEncontrada`.
  - No devuelve una `Promise`.
- [X] T049 [P] [US4] Tests de integración de `POST /compradores/compras/:numero/pago` en aiTicketIt-back/tests/integration/completarPago.test.js:
  - A-1037 → 200, Confirmada, con `diasParaEvento` 6 desde `HOY`.
  - Repetirlo → 409 `PAGO_NO_PERMITIDO`.
  - A-1042 → 409.
  - Con `fijarAhora` después de Risas, A-1037 → 409.
  - A-0612 (de Martín) → 404.
  - 401 sin sesión.

### Implementation for User Story 4

- [X] T050 [US4] Agregar la función sincrónica `completarPago(compradorId, numero)` a aiTicketIt-back/services/comprasService.js, con la precondición `reglasCompra.puedeCompletarPago` (data-model.md § Transiciones, fila Completar pago). Hace pasar T048.
- [X] T051 [US4] Agregar `completarPago` a aiTicketIt-back/controllers/comprasController.js y `POST /:numero/pago` a aiTicketIt-back/routes/compras.js, con su bloque `@openapi`. Hace pasar T049.
- [X] T052 [US4] En aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx, mostrar **Completar pago** (primary) si `acciones.completarPago`:
  - Deshabilitado con indicador mientras se procesa.
  - Al terminar, reemplazar la compra mostrada por la de la respuesta.
  - Un 409 vuelve a pedir la compra.
  - Un error de red muestra el aviso de conexión.

**Checkpoint**: quickstart paso 14.

---

## Phase 7: User Story 5 - El comprador cancela una compra (Priority: P3)

**Goal**: **Cancelar compra** con Dialog de confirmación: Confirmada → Reembolsada, Pendiente → Cancelada, y se liberan los lugares.

**Independent Test**: cancelar A-1042 (queda Reembolsada y la Platea vuelve a "Quedan 12") y A-1037 (queda Cancelada). A-0871 no ofrece cancelar (quickstart pasos 15 y 16).

### Tests for User Story 5 ⚠️

- [X] T053 [P] [US5] Tests unitarios de `comprasService.cancelar` en aiTicketIt-back/tests/unit/comprasService.test.js:
  - Confirmada → Reembolsada y Pendiente → Cancelada (data-model.md Compra.estado).
  - Las dos restan `cantidad` de las vendidas del tipo (data-model.md TipoDeEntrada.vendidas, nunca por debajo de 0).
  - Utilizada, Cancelada, Reembolsada o evento pasado → `CancelacionNoPermitida`, sin tocar vendidas.
  - Compra ajena → `CompraNoEncontrada`.
  - No devuelve una `Promise`.
- [X] T054 [P] [US5] Tests de integración de `POST /compradores/compras/:numero/cancelacion` en aiTicketIt-back/tests/integration/cancelarCompra.test.js:
  - A-1042 → 200, Reembolsada, con `motivoNoCancelable` `REEMBOLSADA` y `acciones.cancelar` `false`.
  - `GET /compradores/eventos/evt-1` → Platea con `disponibles` 14.
  - A-1037 → Cancelada y Risas General suma 1.
  - Repetir cualquiera de las dos → 409 `CANCELACION_NO_PERMITIDA`.
  - A-0871 y A-0655 → 409.
  - A-0612 → 404.
  - 401 sin sesión.
  - Comprar y cancelar deja las vendidas como al principio.
  - Después de cancelar A-1042, `GET /organizadores/eventos/evt-1` (token de La Trama) muestra la Platea con `vendidas` 66 (FR-026, lado organizador).

### Implementation for User Story 5

- [X] T055 [US5] Agregar la función sincrónica `cancelar(compradorId, numero)` a aiTicketIt-back/services/comprasService.js. Usa `reglasCompra.motivoNoCancelable` y `estadoTrasCancelar`, y resta las vendidas del tipo buscándolo por `compra.tipoDeEntradaId` en el evento (data-model.md § Transiciones, fila Cancelar). Hace pasar T053.
- [X] T056 [US5] Agregar `cancelar` a aiTicketIt-back/controllers/comprasController.js y `POST /:numero/cancelacion` a aiTicketIt-back/routes/compras.js, con su bloque `@openapi`. Hace pasar T054.
- [X] T057 [P] [US5] Crear aiTicketIt-front/src/components/ds/Dialog.tsx según design-system.md § Dialog:
  - `Modal` sobre `color-scrim` con `shadow-lg`.
  - Título como pregunta y cuerpo.
  - Acciones a la derecha: volver (secundario) y confirmar (primary, con estado `enviando`).
- [X] T058 [US5] En aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx, mostrar **Cancelar compra** (ghost, debajo de **Tengo una consulta**) si `acciones.cancelar`. Abre el Dialog "¿Cancelar la compra?":
  - Cuerpo según el estado: reintegro "Se reintegrarán {plata(monto)} a tu {medioDePago}. Esta acción no se puede deshacer." o liberación "La compra se cancelará y se liberarán las entradas reservadas.".
  - **Volver** cierra el Dialog sin cambios.
  - Confirmar llama a `cancelarCompra` y muestra la compra actualizada.
  - Un 409 vuelve a pedir la compra.

**Checkpoint**: todas las historias funcionan. Quickstart pasos 15 y 16.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T059 [P] Sumar a aiTicketIt-back/tests/integration/docs.test.js un bloque para la feature 004 que verifique:
  - Los paths `/compradores/compras` (get, post), `/compradores/compras/{numero}` (get), `…/pago` (post) y `…/cancelacion` (post), con sus códigos de respuesta.
  - Los schemas `Compra`, `NuevaCompra`, `MedioDePago`, `EstadoCompra` y la respuesta `CompraNoEncontrada`.

  Corregir los `@openapi` hasta que pase.
- [X] T060 [P] Actualizar CLAUDE.md:
  - Párrafo "Endpoints de compras (feature 004)", con los 5 endpoints, la regla de sección crítica sincrónica (R2), `precioUnitario` / `PRECIO_CAMBIADO` y que la compra guarda una copia del tipo.
  - `FECHA_SIMULADA` en "Levantar los proyectos".
  - `tests/helpers/compras.js` en la sección de tests.
  - Las rutas nuevas de compradores y el Menú de perfil en "Estructura del front".
- [X] T061 Correr `npm test` completo en aiTicketIt-back/ (features 001–004) y corregir lo que falle. En particular, revisar los tests de las features 002 y 003 que listan compras del seed o dependen del orden de `comprasSeed`.
- [X] T062 En aiTicketIt-front/, correr `npm run lint` y `npx tsc --noEmit` sin errores, y revisar que las pantallas nuevas usen solo tokens de `src/theme/tokens.ts` (constitución, Principio I).
- [X] T063 Recorrer [quickstart.md](quickstart.md) completo: los curls con `FECHA_SIMULADA=2026-11-09T12:00:00-03:00` y los pasos 1–20 del front en web (390 px de ancho) y, si es posible, en un dispositivo. Anotar al final de quickstart.md qué pasos se verificaron y cuáles quedan cubiertos solo por tests.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
  - T001 (diseño) bloquea todas las tareas de front de las historias (T028–T034, T039–T043, T046–T047, T052, T057–T058).
  - T002 (test) va antes que T003 (implementación). T002–T003 solo son necesarias para la validación manual (T063), pero tienen que estar en verde antes de cerrar la feature (Principio II).
- **Foundational (Phase 2)**: depende de Setup. Bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: el backend depende solo de Foundational. En el front, `explorar.tsx` lo toca también US1 (T034 antes de T042).
- **US3 (Phase 5)**: el backend ya queda resuelto en Foundational (T007, T013–T015). El front depende de US2 para llegar desde Mis compras, pero la pantalla se puede abrir por URL.
- **US4 (Phase 6)**: depende de US3 (pantalla del Detalle de compra).
- **US5 (Phase 7)**: depende de US3. En el backend es independiente de US4, pero los dos tocan `comprasService.js`, `comprasController.js` y `routes/compras.js` en secuencia.
- **Polish (Phase 8)**: después de las historias que se entreguen.

### Within Each User Story

- Los tests del backend se escriben y se ven fallar antes de la implementación (Principio II).
- El orden es schema → service → controller y ruta → front.
- `comprasService.js`, `comprasController.js`, `routes/compras.js`, `tests/unit/comprasService.test.js` y `compras/[numero]/index.tsx` se tocan en varias historias. Esas tareas van en secuencia, no en paralelo.
- `comprar`, `completarPago` y `cancelar` no llevan `await` entre verificar y escribir (research R2). Cualquier revisión de código debe chequearlo.

### Parallel Opportunities

- **Setup**: T001 en paralelo con T002 → T003.
- **Foundational**:
  - Tests T004–T007.
  - Después, T008, T009, T012 y T016.
  - El front (T017–T019) en paralelo con todo el backend.
- **US1**:
  - Tests T021–T024.
  - Componentes T028–T030 mientras se implementa el backend.
- **US2**:
  - Tests T035 y T036.
  - Componentes T039–T041.
- **US3**: T046 en paralelo con T044 y T045.
- **US4 y US5**: tests T048/T049 y T053/T054 en paralelo; Dialog (T057) en paralelo con el backend de US5.
- **Polish**: T059 y T060.

---

## Parallel Example: User Story 1

```bash
# Tests del back (primero, todos fallan):
Task: "T021 tests de compraSchema en tests/unit/compraSchema.test.js"
Task: "T022 tests de comprasService.comprar en tests/unit/comprasService.test.js"
Task: "T023 tests de POST /compradores/compras en tests/integration/comprar.test.js"
Task: "T024 test de concurrencia en tests/integration/concurrencia.test.js"

# Componentes del front (mientras se implementa el back):
Task: "T028 RadioCard", "T029 QuantityStepper", "T030 ResumenCompra + MarcaDeExito"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 y Phase 2.
2. Phase 3 (US1): comprar con pago simulado y ver la confirmación, sin sobreventa.
3. **Validar**: quickstart pasos 6–13 y `concurrencia.test.js`.

### Incremental Delivery

1. **Setup + Foundational**: compras del seed, reglas, DTO y detalle por API.
2. **US1**: el comprador compra (MVP).
3. **US2**: encuentra sus compras desde el Menú de perfil.
4. **US3**: ve el detalle de cada compra. Con esto se completa el pedido "Compra y pago, Mis compras".
5. **US4**: completa pagos pendientes.
6. **US5**: cancela compras y libera lugares.
7. **Polish**: docs, CLAUDE.md, suite completa, lint/tsc y quickstart completo.
