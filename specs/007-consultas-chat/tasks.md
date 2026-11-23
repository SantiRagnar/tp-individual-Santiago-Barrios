---
description: "Lista de tareas de la feature 007: Consultas (chat de la compra)"
---

# Tasks: Consultas (chat de la compra)

**Input**: documentos de diseño en `specs/007-consultas-chat/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/consultas.openapi.yaml](contracts/consultas.openapi.yaml), [contracts/rutas-front.md](contracts/rutas-front.md), [quickstart.md](quickstart.md)

**Tests**: son obligatorios en el backend por la constitución (Principio II, TDD). Cada bloque "tests primero" se escribe y se ve fallar antes de su implementación. Todos los tests arrancan con `reiniciarEstado()` (`tests/helpers/estado.js`) y usan `tokenDeComprador` / `tokenDeOrganizador` (`tests/helpers/sesion.js`). Si dependen de la hora, usan `fijarAhora(HOY)`. El front no tiene tests automáticos: se valida con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Puertos de esta feature** (research R13): el backend se levanta con `PORT=3007` y el front con `EXPO_PUBLIC_API_URL=http://localhost:3007 npx expo start --port 8087`. No se cambian los valores por defecto del código.

**Organization**: las tareas se agrupan por historia de usuario. Las fases siguen la prioridad: US1, US2 y US5 (P1), y después US3, US4 y US6 (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia a la que pertenece (US1 a US6).
- Las rutas son relativas a la raíz del repo: `aiTicketIt-back/`, `aiTicketIt-front/` y `Diseño de AI Ticket It/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: documentar en el diseño lo que agregó la clarificación (Principio I), antes de escribir UI.

- [X] T001 [P] En `Diseño de AI Ticket It/design-system.md`, agregar (research R10):
  - Componente **Toast**: tarjeta `color-surface`, `shadow-lg`, `radius-lg`, ícono de chat en acento, título `type-body-sm` 500 y línea `type-caption` muted. Va arriba, debajo del safe area, con margen `pad-page` y ancho máximo 390. Se oculta a los 5 s y uno nuevo reemplaza al anterior. `role="alert"` y `aria-live="polite"`; todo el toast es tocable.
  - En § Chat: el contador "N/1000" del compositor desde 900 caracteres. En desktop, Enter envía y Shift+Enter agrega un salto de línea.
  - En § Tags y estados: `dot-unread` también en PurchaseCard (arriba a la derecha, sin la opacidad de Cancelada/Reembolsada) y en un botón secundario (**Tengo una consulta**).
- [X] T002 [P] En `Diseño de AI Ticket It/pantallas.md`:
  - § Consultas (chat): sumar la regla de no leída del comprador (FR-022), el sondeo de 3 s (FR-021) y el largo de 1 a 1000 caracteres.
  - Compradores 08: el punto en la tarjeta.
  - Compradores 09: **Tengo una consulta** → Chat, con punto. Quitar la nota "sin acción hasta su feature" de Tengo una consulta.
  - Compradores 10: el estado vacío de FR-026 y "compra ajena".
  - Una sección nueva "Toast de mensaje nuevo" con los textos de FR-024.
  - Organizadores 04: **Consultas del evento** habilitado con `tag-count` y el botón de chat por fila. Reemplazar la nota de la feature 005 que decía que seguían deshabilitados.
  - Organizadores 05: los tres textos vacíos de FR-026.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo, repositorio, reglas, validación y seed de las consultas, más las piezas de front que comparten los dos lados del chat. Sin esto no avanza ninguna historia.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

### Tests primero (backend)

- [X] T003 [P] Tests unitarios de `noLeidaPara` y `ultimoMensaje` en `aiTicketIt-back/tests/unit/reglasConsulta.test.js`. Casos:
  - Sin mensajes.
  - Último del comprador con `vistosPorOrganizador` menor y con igual que `mensajes.length`.
  - Último del organizador para cada parte.
  - Simetría del lado comprador (data-model.md § Consulta, reglas derivadas; `Consulta.vistosPorOrganizador`, `Consulta.vistosPorComprador`).
- [X] T004 [P] Tests unitarios del repositorio en `aiTicketIt-back/tests/unit/consultasRepository.test.js`:
  - `agregarMensaje` crea la consulta al primer mensaje y no antes.
  - Los ids `msj-{n}` son crecientes (data-model.md `Mensaje.id`).
  - `vistosPor{autor}` queda igual a `mensajes.length` después de enviar.
  - `marcarVista` sin consulta no la crea.
  - `mensajesDespuesDe` con `null`, con un id intermedio, con el último (`[]`) y con un id ajeno (`undefined`).
  - `delEvento` solo devuelve consultas con mensajes de ese evento (`Consulta.eventoId`).
  - `reiniciar` vuelve al seed sin compartir referencias.
- [X] T005 [P] Tests unitarios de `mensajeSchema` en `aiTicketIt-back/tests/unit/mensajeSchema.test.js`:
  - Recorta espacios y conserva los saltos internos.
  - Vacío o solo espacios → "Escribí un mensaje".
  - 1000 caracteres pasa y 1001 → "El mensaje puede tener hasta 1000 caracteres" (data-model.md `Mensaje.texto`).
  - Campos extra → error (estricto).
  - El query `despuesDe` es opcional y es un string no vacío.
- [X] T006 [P] Tests unitarios del DTO en `aiTicketIt-back/tests/unit/consultaDto.test.js`:
  - `aMensajeDto` expone solo `{ id, autor, texto, enviadoEn }` (data-model.md `Mensaje.autor`, `Mensaje.enviadoEn`).
  - `aConsultaResumenDto` usa nombre y apellido, o el email si faltan; `ultimoMensaje` es null sin mensajes; `noLeida` es la del organizador.
  - `aConsultaNoLeidaDto` arma evento, organizador y último mensaje.
- [X] T007 [P] Ampliar `aiTicketIt-back/tests/unit/seed.test.js` con lo que pide FR-018 (data-model.md § Seed):
  - Cada consulta del seed apunta a una compra existente y su `eventoId` coincide con el de la compra.
  - A-1042 está no leída para el organizador.
  - A-1037 está no leída para el comprador.
  - Hay una conversación de Hamlet de `cmp-6` leída por los dos.
  - Hay una de Bodas de sangre de `cmp-7` no leída para el organizador.
  - Todas las fechas son anteriores a 2026-11-09 y ninguna es anterior a la `creadaEn` de su compra (data-model.md `Mensaje.enviadoEn`).
  - En `evt-1`, el último mensaje de A-1042 es más reciente que el de la conversación de `cmp-6`.

### Implementación (backend)

- [X] T008 [P] Crear las clases `Consulta` y `Mensaje` en `aiTicketIt-back/models/Consulta.js` con los campos de data-model.md: `Consulta.compraNumero`, `Consulta.eventoId`, `Consulta.mensajes`, `Consulta.vistosPorOrganizador`, `Consulta.vistosPorComprador`, `Mensaje.id`, `Mensaje.autor`, `Mensaje.texto` y `Mensaje.enviadoEn`. El constructor de `Consulta` convierte los mensajes planos en instancias de `Mensaje`.
- [X] T009 [P] Crear `ultimoMensaje` y `noLeidaPara(consulta, parte)` en `aiTicketIt-back/services/reglasConsulta.js`. Aceptan `null` como consulta vacía (research R1 y R2). Hace pasar T003.
- [X] T010 [P] Crear `mensajeSchema` (body `{ texto }`, `z.strictObject`) y `consultaQuerySchema` (`{ despuesDe? }`) en `aiTicketIt-back/schemas/mensajeSchema.js` (research R7; data-model.md `Mensaje.texto`). Hace pasar T005.
- [X] T011 Agregar `consultasSeed` en `aiTicketIt-back/repository/seed.js` con las 4 conversaciones de data-model.md § Seed:
  - Las de A-1042 y A-1037 usan los textos del contrato.
  - Las compras generadas se eligen sobre `comprasSeed` por `eventoId` y `compradorId` (la primera por número), no con un número fijo.
  - Los mensajes llevan `id` `msj-{n}`. Los de A-1042 y A-1037 tienen `enviadoEn` fijos con `-03:00`, posteriores a la creación de la compra. Los de las compras generadas se calculan desde su `creadaEn` (data-model.md `Mensaje.enviadoEn`). Los `vistosPor…` dan los estados de lectura de la tabla.
- [X] T012 Crear `aiTicketIt-back/repository/consultasRepository.js` con `buscar`, `agregarMensaje`, `marcarVista`, `mensajesDespuesDe`, `delEvento` y `reiniciar` (data-model.md § Repositorio):
  - Usa `Map<numero, Consulta>` y el índice `eventoId → Set<numero>`.
  - El contador de ids arranca después del mayor `msj-{n}` del seed.
  - `reiniciar` carga `structuredClone(consultasSeed)` y se llama al cargar el módulo.

  Agregar `consultasRepository.reiniciar()` en `aiTicketIt-back/repository/index.js`. Hace pasar T004 y T007.
- [X] T013 [P] Crear `aMensajeDto`, `aConsultaResumenDto(compra, { comprador, consulta })` y `aConsultaNoLeidaDto(compra, { evento, organizador, consulta })` en `aiTicketIt-back/dto/consultaDto.js`. Reusan la regla de nombre de `aVentaDto` (extraerla a una función exportada de `dto/ventaDto.js` en lugar de duplicarla). Hace pasar T006.
- [X] T014 [P] Crear `aiTicketIt-back/tests/helpers/consultas.js` con `enviarMensaje(numero, autor, texto)`, que escribe por el repositorio para preparar escenarios, y `ultimoId(numero)`.

### Implementación (front, compartida)

- [X] T015 [P] Crear `aiTicketIt-front/src/api/consultas.ts` con los tipos `Mensaje`, `ConsultaResumen` y `ConsultaNoLeida` del contrato y las funciones:
  - Comprador: `listarMensajes(token, numero, despuesDe?)`, `enviarMensaje(token, numero, texto)`, `marcarLeida(token, numero)`, `listarNoLeidas(token)`.
  - Organizador: `listarConsultasDelEvento(token, eventoId)`, `obtenerConversacion(token, eventoId, numero, despuesDe?)`, `responder(token, eventoId, numero, texto)`, `marcarLeidaOrganizador(token, eventoId, numero)`.

  Todas pasan `token` y `tipo` a `pedir()`.
- [X] T016 [P] Agregar `horaDeMensaje(iso, ahora = new Date())` en `aiTicketIt-front/src/lib/formato.ts`: "21:04" si es el mismo día en hora de Argentina y "Sáb 21 nov · 21:04" si no (research R11; reusa `fechaCorta` y `hora`).
- [X] T017 [P] Crear `aiTicketIt-front/src/hooks/useSondeo.ts`: `useSondeo(tarea, { cadaMs = 3000, activo })` (research R3).
  - Corre `tarea` cada `cadaMs` solo con la pantalla enfocada (`useFocusEffect`) y la app en `active` (`AppState`).
  - No se solapa: espera a que termine la anterior.
  - Se cancela al desmontar.
  - Ignora los errores (el siguiente intento reintenta).
- [X] T018 [P] Crear `aiTicketIt-front/src/components/ds/ChatMensajes.tsx` (design-system.md § Chat):
  - Burbujas propias a la derecha en `accent-800` y las de la otra parte a la izquierda en `surface`; `radius-lg`, ancho máximo 78%, hora en 10px muted debajo (`horaDeMensaje`).
  - Props: `mensajes`, `propio: 'comprador' | 'organizador'` y `vacio` (el nodo del estado vacío).
  - Al montar, la vista va al final. Con mensajes nuevos, baja solo si el usuario ya estaba a menos de 48px del final.
- [X] T019 [P] Crear `aiTicketIt-front/src/components/ds/CompositorChat.tsx`:
  - Props: `variante: 'mobile' | 'desktop'`, `placeholder`, `onEnviar(texto): Promise<boolean>`, `error`.
  - `mobile`: input redondeado de 44px + botón circular primario con ícono y `accessibilityLabel` "Enviar". `desktop`: input + **Enviar**.
  - `maxLength` 1000 y contador "N/1000" desde 900.
  - Deshabilitado si el texto recortado está vacío o se está enviando.
  - Enter envía (en web, Shift+Enter agrega un salto de línea).
  - Si `onEnviar` devuelve `true`, vacía el texto; si no, lo conserva.
  - Muestra `error` arriba en `danger`.

**Checkpoint**: `npm test` del backend en verde, con T003 a T007 pasando; `npx tsc --noEmit` del front sin errores.

---

## Phase 3: User Story 1 - El comprador hace una consulta sobre su compra (Priority: P1) 🎯 MVP

**Goal**: desde el Detalle de compra, el comprador abre el chat de su compra, ve los mensajes y envía consultas, con la compra en cualquier estado.

**Independent Test**: ingresar con Sofía, abrir #A-1042 → **Tengo una consulta**, enviar un mensaje y verificar que aparece a la derecha con la hora y sigue ahí al volver a entrar (quickstart, escenarios 3, 5, 6 y 10).

### Tests primero

- [X] T020 [P] [US1] Tests unitarios de `mensajesDeComprador`, `enviarComoComprador` y `marcarLeidaComprador` en `aiTicketIt-back/tests/unit/consultasService.test.js`:
  - Compra propia vs. ajena → `CompraNoEncontrada`.
  - Compra sin mensajes → `[]`.
  - `despuesDe` desconocido → `DatosInvalidos` con `campo: "despuesDe"`.
  - El autor siempre es "comprador" y `enviadoEn` = `ahora()` (data-model.md `Mensaje.autor`, `Mensaje.enviadoEn`).
  - Funciona en los cinco estados de compra (FR-004).
- [X] T021 [P] [US1] Tests de integración en `aiTicketIt-back/tests/integration/consultasComprador.test.js`:
  - `GET /compradores/compras/A-1042/mensajes` devuelve los mensajes del seed en orden.
  - `POST` con `{ texto: "  ¿Se puede entrar con cochecito?  " }` → 201 con el texto recortado y `autor: "comprador"`. Un `GET ?despuesDe={último anterior}` devuelve solo ese mensaje.
  - `POST` vacío, de solo espacios, de 1001 caracteres o con campos extra → 400 `DATOS_INVALIDOS` sin guardar nada (SC-006).
  - Enviar en A-0790 (Reembolsada) y en A-0655 (Utilizada, evento pasado) → 201.
  - `PUT …/mensajes/lectura` → 204, también sin mensajes.
  - Sin token → 401.

### Implementación

- [X] T022 [US1] Crear `aiTicketIt-back/services/consultasService.js` con `mensajesDeComprador(compradorId, numero, { despuesDe })`, `enviarComoComprador(compradorId, numero, texto)` y `marcarLeidaComprador(compradorId, numero)`.
  - La propiedad se resuelve con la misma regla que `comprasService` (exportar `compraDe` o reusar `comprasService.obtener`).
  - Todo es sincrónico, sin `await` entre verificar y escribir.

  Hace pasar T020.
- [X] T023 [US1] Crear `aiTicketIt-back/controllers/consultasController.js` (métodos del comprador) y agregar a `aiTicketIt-back/routes/compras.js`:
  - `GET /:numero/mensajes` con `validarQuery(consultaQuerySchema)`.
  - `POST /:numero/mensajes` con `validar(mensajeSchema)` → 201 `{ mensaje }`.
  - `PUT /:numero/mensajes/lectura` → 204.
  - Comentarios `@openapi` copiados de contracts/consultas.openapi.yaml (tag "Consultas (comprador)", schemas `Mensaje` y `NuevoMensaje`).

  Hace pasar T021.
- [X] T024 [US1] Crear la pantalla Compradores 10 en `aiTicketIt-front/src/app/(compradores)/compras/[numero]/consulta.tsx` según contracts/rutas-front.md:
  - AppBar con evento y "{organizador} · Compra #{número}" (sale de `obtenerCompra`).
  - `ChatMensajes` con `propio="comprador"` y el vacío de FR-026 (`EstadoVacio`).
  - `CompositorChat` mobile con "Escribí tu consulta", dentro de `KeyboardAvoidingView` y con el safe area.
  - Al enfocarse, carga y llama a `marcarLeida`. `useSondeo` con `despuesDe`; si llegan mensajes del organizador, llama a `marcarLeida`.
  - Error al enviar: conserva el texto y muestra `SIN_CONEXION`.
  - Error al abrir: `PantallaDeAviso` + **Reintentar**.
  - Registrar `compras/[numero]/consulta` en el `Stack.Protected` de `aiTicketIt-front/src/app/(compradores)/_layout.tsx` y correr `npx expo start` una vez para regenerar `.expo/types`.
- [X] T025 [US1] En `aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx`, **Tengo una consulta** hace `router.push` a `/compras/{numero}/consulta`. Quitar el comentario de "sin acción hasta la feature de consultas".

**Checkpoint**: la US1 se prueba sola con los escenarios 3, 5 y 6 del quickstart (respuestas del organizador solo desde el seed).

---

## Phase 4: User Story 2 - El organizador responde las consultas de un evento (Priority: P1)

**Goal**: el organizador entra a Consultas del evento, ve la lista de conversaciones con mensajes, abre una y responde.

**Independent Test**: con La Trama, panel de Hamlet → **Consultas del evento** → conversación de #A-1042 → responder, y verificar que Sofía lo ve en su chat (quickstart, escenarios 7 a 10).

### Tests primero

- [X] T026 [P] [US2] Ampliar `aiTicketIt-back/tests/unit/consultasService.test.js` con `consultasDelEvento`, `consultaDeCompra` y `enviarComoOrganizador`:
  - Solo consultas con mensajes, ordenadas por `enviadoEn` del último desc y, a igual hora, por número desc (research R8).
  - `noLeidas` cuenta según `noLeidaPara(…, "organizador")`.
  - Funciona en eventos Finalizados y en compras en cualquier estado.
  - El autor es "organizador".
- [X] T027 [P] [US2] Tests de integración en `aiTicketIt-back/tests/integration/consultasOrganizador.test.js`:
  - `GET /organizadores/eventos/evt-1/consultas` con La Trama → A-1042 primera, `noLeida: true`, cabecera completa ("Sofía Gómez", Platea, 2, 36000, Confirmada); `noLeidas: 1`.
  - `GET …/consultas/A-1042` → `consulta` + mensajes; con `?despuesDe` → solo los nuevos.
  - `POST …/consultas/A-1042/mensajes` → 201 con `autor: "organizador"`. Después, el `GET` del comprador lo incluye y la lista lo muestra primero con ese último mensaje.
  - Mensaje inválido → 400.
  - Evento Finalizado (Edipo, evt-7) → se puede responder.

### Implementación

- [X] T028 [US2] Agregar a `aiTicketIt-back/services/consultasService.js`:
  - `consultasDelEvento(organizadorId, eventoId)` → `{ evento, items: [{ compra, consulta }], noLeidas }`.
  - `consultaDeCompra(organizadorId, eventoId, numero, { despuesDe })`.
  - `enviarComoOrganizador(organizadorId, eventoId, numero, texto)`.

  El orden de verificación es evento propio (`eventosService.obtener`) → compra de ese evento (`CompraNoEncontrada`) → cuerpo. Hace pasar T026.
- [X] T029 [US2] Agregar los métodos del organizador a `aiTicketIt-back/controllers/consultasController.js` y a `aiTicketIt-back/routes/eventosOrganizador.js`:
  - `GET /:id/consultas`.
  - `GET /:id/consultas/:numero` con `validarQuery(consultaQuerySchema)`.
  - `POST /:id/consultas/:numero/mensajes` con `validar(mensajeSchema)`.
  - Comentarios `@openapi` (tag "Consultas (organizador)", schema `ConsultaResumen`).

  Hace pasar T027.
- [X] T030 [P] [US2] Crear `aiTicketIt-front/src/components/ds/ListaConversaciones.tsx` (design-system.md § ConversationList; contracts/rutas-front.md):
  - Columna de 380px.
  - Filas con Avatar de 38px `neutral-800` (`iniciales`; si el nombre es un email, la primera letra en mayúscula), nombre, hora (`horaDeMensaje`), "Compra #{número} · {tipo} × {cantidad}", último mensaje con `numberOfLines={1}` y `dot-unread` si `noLeida`.
  - La fila seleccionada lleva `aria-current="true"` y fondo `surface` + `shadow-sm`.
- [X] T031 [US2] Crear la pantalla Organizadores 05 en `aiTicketIt-front/src/app/organizadores/eventos/[id]/consultas.tsx` según contracts/rutas-front.md:
  - `page-head`: Volver → panel, "Consultas del evento" + nombre del evento (de `GET /organizadores/eventos/{id}`).
  - `ListaConversaciones` y panel de chat: cabecera con comprador, "Compra #… · {tipo} × {cantidad} · $ {monto}" y `TagCompra`; `ChatMensajes` con `propio="organizador"`; `CompositorChat` desktop con "Responder a {comprador}".
  - Al enviar, actualiza la lista localmente (sube primera) y conserva el texto si hay error.
  - `useSondeo` de la lista y de la conversación abierta.
  - Si falla la carga inicial (evento o lista): `PantallaDeAviso` con `SIN_CONEXION` + **Reintentar** (FR-019). Los errores del sondeo no muestran nada.
  - Registrar `eventos/[id]/consultas` en `aiTicketIt-front/src/app/organizadores/_layout.tsx`.
- [X] T032 [US2] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx`, habilitar **Consultas del evento** (quitar el 45% y el comentario de "sin contador") para que navegue a `/organizadores/eventos/{id}/consultas`.

**Checkpoint**: US1 + US2 dan el ida y vuelta completo (quickstart, escenarios 7 a 10, sin contador todavía).

---

## Phase 5: User Story 5 - Cada uno ve solo sus conversaciones (Priority: P1)

**Goal**: nadie lee ni escribe en una conversación ajena, aunque escriba la URL a mano.

**Independent Test**: quickstart, escenarios 15 y 16.

### Tests primero

- [X] T033 [P] [US5] Tests de integración en `aiTicketIt-back/tests/integration/consultasPropiedad.test.js`. Comprador:
  - `GET`, `POST` y `PUT lectura` sobre la compra de otro comprador (`cmp-6`) y sobre `A-9999` → 404 `COMPRA_NO_ENCONTRADA`, sin cambiar la consulta.
  - Con un token de organizador → 401.

  Organizador:
  - Club del Chiste sobre `evt-1` → 404 `EVENTO_NO_ENCONTRADO`.
  - La Trama sobre `evt-1` con una compra de `evt-3` (`A-…` de Bodas) → 404 `COMPRA_NO_ENCONTRADA`.
  - Ninguno de los dos crea mensajes (SC-005).

### Implementación

- [X] T034 [US5] Verificar que T033 pase con T022 y T028. Si falta algún caso, corregir el orden de verificación en `aiTicketIt-back/services/consultasService.js` (propiedad antes que validar `despuesDe` o el cuerpo; un 404 nunca revela si la compra existe).
- [X] T035 [P] [US5] En `aiTicketIt-front/src/app/(compradores)/compras/[numero]/consulta.tsx`, con `COMPRA_NO_ENCONTRADA` mostrar AppBar con Volver, "No encontramos esta compra." y **Volver a Mis compras**, igual que el Detalle de compra.
- [X] T036 [P] [US5] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/consultas.tsx`:
  - Con `EVENTO_NO_ENCONTRADO`: "No encontramos el evento." + link a Mis eventos.
  - Con un `?compra=` que da `COMPRA_NO_ENCONTRADA`: la pantalla queda sin conversación elegida.

**Checkpoint**: todas las historias P1 completas.

---

## Phase 6: User Story 3 - El organizador sabe qué consultas tiene sin leer (Priority: P2)

**Goal**: punto de no leído en la lista y contador en **Consultas del evento**. Abrir una conversación la marca como leída; entrar a Consultas no marca ninguna.

**Independent Test**: quickstart, escenarios 7, 8, 9 y 13.

### Tests primero

- [X] T037 [P] [US3] Ampliar `aiTicketIt-back/tests/unit/consultasService.test.js` con `marcarLeidaOrganizador`:
  - Deja `vistosPorOrganizador = mensajes.length` (data-model.md `Consulta.vistosPorOrganizador`).
  - Sin consulta, no la crea.
  - Un mensaje nuevo del comprador la vuelve no leída; uno del organizador nunca la deja no leída.
- [X] T038 [P] [US3] Tests de integración en `aiTicketIt-back/tests/integration/consultasNoLeidas.test.js` (parte organizador):
  - Panel de Hamlet: `noLeidas` 1.
  - `GET …/consultas` y `GET …/consultas/A-1042` no cambian `noLeidas` (ningún GET tiene efectos, research R4).
  - `PUT …/consultas/A-1042/lectura` → 204 y `noLeidas` 0.
  - Sofía escribe → vuelve a 1.
  - Evento ajeno → 404.

### Implementación

- [X] T039 [US3] Agregar `marcarLeidaOrganizador(organizadorId, eventoId, numero)` en `aiTicketIt-back/services/consultasService.js` y `PUT /:id/consultas/:numero/lectura` → 204 en `aiTicketIt-back/routes/eventosOrganizador.js` y en el controller, con `@openapi`. Hace pasar T037 y T038.
- [X] T040 [P] [US3] En `aiTicketIt-front/src/components/ds/Button.tsx`, agregar la prop `contador?: number`, que muestra `tag-count` si es > 0 (design-system.md § Tags).
- [X] T041 [US3] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx`, pedir `listarConsultasDelEvento` al enfocarse y pasar `noLeidas` como `contador` a **Consultas del evento**. Si ese pedido falla, el botón queda sin contador y el panel no muestra error.
- [X] T042 [US3] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/consultas.tsx`:
  - Llamar a `marcarLeidaOrganizador` al elegir una conversación y cuando el sondeo trae mensajes nuevos del comprador a la abierta.
  - Actualizar `noLeida` en la lista local sin esperar al sondeo.
  - No abrir ninguna conversación automáticamente sin `?compra` (US3, escenario 5).

**Checkpoint**: contador y puntos coinciden con el cálculo a mano (SC-004, lado organizador).

---

## Phase 7: User Story 4 - El organizador abre el chat desde una venta (Priority: P2)

**Goal**: botón de chat en cada fila de Ventas → Consultas con esa conversación abierta, aunque no tenga mensajes; el organizador puede escribir primero.

**Independent Test**: quickstart, escenario 14.

### Tests primero

- [X] T043 [P] [US4] Tests de integración en `aiTicketIt-back/tests/integration/consultasDesdeVentas.test.js`. Con una compra de Hamlet sin mensajes:
  - `GET …/consultas/{numero}` → 200 con `consulta.ultimoMensaje: null` y `mensajes: []`.
  - No aparece en `GET …/consultas`.
  - `PUT lectura` → 204 sin crearla.
  - `POST` del organizador → 201; ahora aparece primera en la lista con `noLeida: false`, y el comprador la ve en `GET /compradores/compras/{numero}/mensajes`.

### Implementación

- [X] T044 [US4] Verificar que T043 pase con T028 y T039 (compra sin consulta = conversación vacía, research R1). Si no pasa, ajustar `consultaDeCompra` en `aiTicketIt-back/services/consultasService.js` y `aConsultaResumenDto` en `aiTicketIt-back/dto/consultaDto.js`.
- [X] T045 [P] [US4] En `aiTicketIt-front/src/components/ds/TablaVentas.tsx`, agregar en la columna Acciones de todas las filas un botón ícono de 30px (`ChatCircle`) con `accessibilityLabel` "Consultas de la compra #{número}", a la derecha de **Marcar utilizada**. El callback es `onAbrirConsulta(numero)`.
- [X] T046 [US4] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx`, `onAbrirConsulta` hace `router.push` a `/organizadores/eventos/{id}/consultas?compra={numero}`.
- [X] T047 [US4] En `aiTicketIt-front/src/app/organizadores/eventos/[id]/consultas.tsx`:
  - Con `?compra=` abrir esa conversación aunque no esté en la lista y mostrar "Todavía no hay mensajes con {comprador}." si no tiene mensajes.
  - Al elegir otra, actualizar el parámetro con `router.setParams`.
  - Con `?compra=` y sin ninguna conversación en la lista, mostrar igual las dos columnas: la lista vacía no reemplaza el chat abierto.

**Checkpoint**: el organizador puede iniciar una conversación desde Ventas.

---

## Phase 8: User Story 6 - El comprador se entera de que le respondieron (Priority: P2)

**Goal**: punto de no leído en Mis compras y en **Tengo una consulta**, y un toast cuando llega una respuesta del organizador mientras el comprador usa la app.

**Independent Test**: quickstart, escenarios 1, 2, 4, 11 y 12.

### Tests primero

- [X] T048 [P] [US6] Ampliar `aiTicketIt-back/tests/unit/consultasService.test.js` con `noLeidasDeComprador(compradorId)`:
  - Solo consultas de sus compras con el último mensaje del organizador y `vistosPorComprador < mensajes.length` (data-model.md `Consulta.vistosPorComprador`).
  - Ordenadas por el último mensaje desc.
  - Vacío → `[]`.
- [X] T049 [P] [US6] Ampliar `aiTicketIt-back/tests/unit/compraDto.test.js`: `consultaNoLeida` es true solo si la consulta de la compra está no leída para el comprador, y es false sin consulta.
- [X] T050 [P] [US6] Agregar la parte comprador en `aiTicketIt-back/tests/integration/consultasNoLeidas.test.js`:
  - `GET /compradores/consultas/no-leidas` con Sofía → solo A-1037, con evento "Risas a Domicilio" y organizador "Club del Chiste".
  - `GET /compradores/compras` → A-1037 con `consultaNoLeida: true` y A-1042 con `false`.
  - `PUT /compradores/compras/A-1037/mensajes/lectura` → desaparece de `no-leidas` y `consultaNoLeida: false`.
  - El organizador de Hamlet responde A-1042 → aparece en `no-leidas`.
  - Otro comprador (Martín) no ve las de Sofía.
  - Sin sesión → 401.

### Implementación

- [X] T051 [US6] Agregar `noLeidasDeComprador(compradorId)` en `aiTicketIt-back/services/consultasService.js`, usando `comprasRepository.listarPorComprador` + `consultasRepository.buscar`.
- [X] T052 [US6] Crear `aiTicketIt-back/routes/consultas.js` (`GET /no-leidas` con `requiereSesion("comprador")`, `@openapi` con el schema `ConsultaNoLeida`) y montarlo en `aiTicketIt-back/app.js` como `/compradores/consultas`. Hace pasar T048 y T050.
- [X] T053 [US6] En `aiTicketIt-back/dto/compraDto.js`, agregar `consultaNoLeida`, que `aCompraDto` recibe ya calculado: en `aiTicketIt-back/services/comprasService.js`, `conContexto` suma `consultaNoLeida: noLeidaPara(consultasRepository.buscar(compra.numero), "comprador")` y el controller lo pasa al DTO. El DTO no lee repositorios (Principio III). Agregar el campo al schema `Compra` en `@openapi` de `aiTicketIt-back/routes/compras.js`. Hace pasar T049 sin romper los tests de las features 004 y 005.
- [X] T054 [P] [US6] En `aiTicketIt-front/src/api/compras.ts`, agregar `consultaNoLeida: boolean` al tipo `Compra`.
- [X] T055 [P] [US6] Crear `aiTicketIt-front/src/components/ds/Toast.tsx` según el design-system.md actualizado en T001:
  - Props: `titulo`, `texto`, `onPress`, `onOcultar`.
  - Se oculta a los 5 s; un `key` nuevo reinicia el temporizador.
  - `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"`.
  - Va posicionado arriba, debajo del safe area.
- [X] T056 [P] [US6] En `aiTicketIt-front/src/components/ds/Button.tsx`, agregar la prop `noLeido?: boolean`, que muestra `dot-unread` con `accessibilityLabel` "Tenés mensajes sin leer". En `aiTicketIt-front/src/components/ds/PurchaseCard.tsx`, mostrar el punto arriba a la derecha si `compra.consultaNoLeida`, fuera de la capa con opacidad del 40%.
- [X] T057 [US6] Crear `aiTicketIt-front/src/consultas/AvisosDeConsultasProvider.tsx` y el hook `useAvisosDeConsultas()` (research R9):
  - Sondeo global con `listarNoLeidas` cada 3 s, con la app en primer plano.
  - El primer resultado es la línea de base, sin toast (FR-025).
  - Las novedades son las consultas cuyo `ultimoMensaje.id` no se avisó, sin contar la del chat abierto (`usePathname()`).
  - Una novedad → toast "Nuevo mensaje de {organizador}" / "{evento} · Compra #{número}" → `router.push` al chat. Varias → "Tenés N mensajes nuevos" / "Tocá para ver tus compras" → Mis compras.
  - Expone `version`, que se incrementa cuando cambia el conjunto de no leídas.
- [X] T058 [US6] En `aiTicketIt-front/src/app/(compradores)/_layout.tsx`, montar `AvisosDeConsultasProvider` (con `key` por comprador y `token`) alrededor del `Stack`, activo solo con sesión de comprador.
- [X] T059 [US6] En `aiTicketIt-front/src/app/(compradores)/compras/[numero]/index.tsx`, pasar `noLeido={compra.consultaNoLeida}` a **Tengo una consulta** y recargar la compra cuando cambia `version`. En `aiTicketIt-front/src/app/(compradores)/mis-compras.tsx`, recargar la lista cuando cambia `version`.

**Checkpoint**: todas las historias completas (quickstart, escenarios 1 a 18).

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T060 [P] Ampliar `aiTicketIt-back/tests/integration/docs.test.js` para que verifique en `/docs.json` los 8 paths nuevos y el campo `consultaNoLeida` del schema `Compra`.
- [X] T061 [P] Actualizar `CLAUDE.md`:
  - Un párrafo de "Endpoints de consultas (feature 007)": rutas, `despuesDe`, `PUT …/lectura`, sondeo de 3 s, `consultasRepository` con `vistosPor…`, `consultaNoLeida` y `AvisosDeConsultasProvider`.
  - Las pantallas nuevas en "Estructura del front" y los helpers de test nuevos.
- [X] T062 Correr `cd aiTicketIt-back && npm test` (todo en verde), `cd aiTicketIt-front && npm run lint && npx tsc --noEmit` y revisar `/docs` en `http://localhost:3007/docs`.
- [ ] T063 Validar a mano los 18 escenarios de [quickstart.md](quickstart.md) con dos ventanas (Sofía en 390 × 844 y La Trama en 1280 × 800), midiendo los < 5 s de FR-021 y FR-024. Revisar tokens, textos y estados vacío, deshabilitado y error contra `design-system.md` y `pantallas.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 y T002 en paralelo. Tiene que estar antes de las tareas de UI que usan el Toast y los puntos (T055 y T056).
- **Foundational (Phase 2)**: bloquea todo.
  - Backend: tests T003 a T007 → T008 a T014. T011 va antes de T012; T013 usa T008.
  - Front: T015 a T019, en paralelo entre sí.
- **US1 (Phase 3)**: depende de la Foundational. Es el MVP.
- **US2 (Phase 4)**: depende de la Foundational. Comparte `consultasService.js` y `consultasController.js` con la US1: si se hacen en paralelo, coordinar las ediciones de esos archivos (o hacer la US1 primero).
- **US5 (Phase 5)**: depende de la US1 y la US2, porque verifica sus endpoints.
- **US3 (Phase 6)**: depende de la US2 (pantalla de Consultas y panel).
- **US4 (Phase 7)**: depende de la US2 y la US3 (T039 para `PUT lectura`).
- **US6 (Phase 8)**: depende de la US1 (chat del comprador) y de la Foundational. Es independiente de la US3 y la US4.
- **Polish (Phase 9)**: al final.

### Within Each User Story

- Tests (rojo) → servicio → controller y routes (verde) → front.
- Una historia se cierra cuando pasa su checkpoint.

### Parallel Opportunities

- T001 ∥ T002.
- T003 ∥ T004 ∥ T005 ∥ T006 ∥ T007; después T008 ∥ T009 ∥ T010 ∥ T013 ∥ T014. Front: T015 ∥ T016 ∥ T017 ∥ T018 ∥ T019.
- En cada historia, los tests [P] van juntos (unitario ∥ integración).
- T030 (ListaConversaciones) ∥ T028 y T029 (backend de la US2).
- T035 ∥ T036; T040 ∥ T039; T045 ∥ T044.
- US6: T054 ∥ T055 ∥ T056 mientras se hace el backend (T051 a T053).
- Con dos personas: una hace la US6 mientras otra hace la US3 y la US4, después de la US1 y la US2.

---

## Parallel Example: User Story 1

```text
# Tests primero, juntos:
T020 [US1] tests unitarios de consultasService (comprador)
T021 [US1] tests de integración consultasComprador.test.js

# Después, backend (T022 → T023) y luego el front (T024 → T025).
```

## Parallel Example: User Story 6

```text
# Tests juntos:
T048 noLeidasDeComprador · T049 compraDto.consultaNoLeida · T050 integración no-leidas

# Front en paralelo con el backend:
T054 tipo Compra · T055 Toast · T056 punto en Button/PurchaseCard
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (diseño) y Phase 2 (fundaciones).
2. Phase 3 (US1): el comprador ya puede consultar y ver las respuestas del seed.
3. **Validar**: quickstart, escenarios 3, 5 y 6.

### Incremental Delivery

1. US1 → MVP del comprador.
2. US2 → ida y vuelta completo (casos de uso del enunciado cubiertos).
3. US5 → propiedad blindada (cierra las P1).
4. US3 → contador y puntos del organizador.
5. US4 → chat desde Ventas.
6. US6 → avisos al comprador (puntos y toast).
7. Polish → docs, CLAUDE.md y validación final.

Cada incremento deja `npm test` en verde y la app usable.
