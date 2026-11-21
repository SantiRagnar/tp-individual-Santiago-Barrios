---
description: "Lista de tareas de la feature 002: Mis eventos, crear y editar evento (organizadores)"
---

# Tasks: Mis eventos, crear y editar evento (organizadores)

**Input**: documentos de diseño en `specs/002-eventos-organizador/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/eventos.openapi.yaml](contracts/eventos.openapi.yaml), [contracts/rutas-front.md](contracts/rutas-front.md), [quickstart.md](quickstart.md)

**Tests**: obligatorios en el backend por la constitución (Principio II, TDD). Cada bloque "tests primero" se escribe y se ve fallar antes de su implementación. El front no tiene tests automáticos: se valida con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Organization**: las tareas se agrupan por historia de usuario para poder implementarlas y probarlas por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1–US4)
- Rutas relativas a la raíz del repo: `aiTicketIt-back/` y `aiTicketIt-front/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencias nuevas y archivos estáticos

- [X] T001 Instalar con `npx expo install expo-image-picker @react-native-community/datetimepicker` en aiTicketIt-front/package.json (research R10, R11); si alguna no tiene versión compatible con SDK 58, anotar la alternativa en research.md
- [X] T002 [P] Generar las 8 imágenes PNG de 1600×900 del seed (degradés con colores de acento del design system, una por evento: `hamlet.png`, `risas.png`, `bodas.png`, `cartas.png`, `impro.png`, `tango.png`, `edipo.png`, `gaviota.png`) en aiTicketIt-back/repository/imagenes-seed/ con un script de un solo uso (no queda en el repo) (research R8)
- [X] T003 [P] Documentar los estados nuevos antes de cualquier tarea de front (constitución, Principio I), con los textos exactos de contracts/rutas-front.md: en Diseño de AI Ticket It/pantallas.md, Organizadores 03 en modo Editar (título "Editar evento", **Guardar cambios** sin **Guardar borrador** si está Publicado, nota "…para guardar."), cuándo se muestran los errores (FR-013) y Organizadores 04 en versión mínima (Volver, título, "fecha · sala", Tag, **Editar evento**, **Consultas del evento** deshabilitado); en Diseño de AI Ticket It/design-system.md, TicketTypeEditor con un tipo con ventas (quitar deshabilitado al 45%, "Tiene ventas: no se puede quitar", "N vendidas") y Field dropzone con imagen (miniatura + "Cambiar imagen") y sus tres errores de imagen

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo de eventos, seed, reloj, imágenes servidas, errores y base del front, que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

### Backend: tests primero

- [X] T004 [P] Escribir tests unitarios de `validar` en aiTicketIt-back/tests/unit/validar.test.js: un error en `tiposDeEntrada[1].cupo` sale con `campo: "tiposDeEntrada.1.cupo"`; un campo plano (`email`) sale igual que antes; un mensaje por campo (research R5)
- [X] T005 [P] Escribir tests unitarios de `reloj` y del estado derivado en aiTicketIt-back/tests/unit/eventosService.test.js (sección "estado derivado"): con `fijarAhora(2026-11-09T12:00-03:00)` Edipo Rey y Tango en el Conventillo salen `Finalizado`, Hamlet `Publicado` y La gaviota `Borrador`; un Borrador con fecha pasada sigue `Borrador`; `reiniciarEstado()` vuelve al reloj real (research R1, R2; data-model.md `Evento.estado`)
- [X] T006 [P] Escribir tests unitarios de `eventoSchema` en aiTicketIt-back/tests/unit/eventoSchema.test.js: `{ estado: "Borrador" }` es válido; recorta strings y convierte vacíos en `null`; rechaza `categoria` fuera de la lista, `estado: "Finalizado"`, `cupo`/`precio` no enteros, `fechaHora` sin offset y largos mayores a los de data-model.md (`Evento.nombre`, `Evento.descripcion`, `Evento.ubicacion`, `TipoDeEntrada.nombre`, `MaterialMultimedia.nombre`, `MaterialMultimedia.tipo`); `materialMultimedia` y `tiposDeEntrada` por defecto `[]` (research R4)
- [X] T007 [P] Escribir tests de integración de `GET /imagenes/:id` en aiTicketIt-back/tests/integration/imagenes.test.js (sección "servir"): `img-seed-hamlet` responde 200 con `Content-Type: image/png` y `Cache-Control` con `immutable`, sin sesión; un id inexistente responde 404 `IMAGEN_NO_ENCONTRADA` (contracts/eventos.openapi.yaml `/imagenes/{id}`)

### Backend: implementación

- [X] T008 Cambiar aiTicketIt-back/middlewares/validar.js para que `campo` sea `issue.path.join(".")` (o `"body"` si está vacío) hasta que T004 pase sin romper los tests de la feature 001 (research R5)
- [X] T009 [P] Crear `reloj` con `ahora()` y `fijarAhora(fecha | null)` en aiTicketIt-back/services/reloj.js, y hacer que `reiniciarEstado()` llame a `fijarAhora(null)` en aiTicketIt-back/tests/helpers/estado.js (research R2)
- [X] T010 [P] Agregar a aiTicketIt-back/errors/ErrorDeDominio.js: `EventoNoEncontrado` (404 `EVENTO_NO_ENCONTRADO`, "No encontramos el evento."), `EventoFinalizado` (409 `EVENTO_FINALIZADO`, "El evento ya se realizó: no se puede editar."), `NoSePuedeDespublicar` (409 `NO_SE_PUEDE_DESPUBLICAR`, "Un evento publicado no puede volver a borrador."), `ImagenInvalida` (415 `IMAGEN_INVALIDA`, "La imagen tiene que ser JPG o PNG"), `ImagenMuyGrande` (413 `IMAGEN_MUY_GRANDE`, "La imagen no puede pesar más de 5 MB") e `ImagenNoEncontrada` (404 `IMAGEN_NO_ENCONTRADA`, "No encontramos la imagen.") (contracts/eventos.openapi.yaml)
- [X] T011 [P] Crear el modelo `Evento` en aiTicketIt-back/models/Evento.js con data-model.md `Evento.id`, `Evento.organizadorId`, `Evento.nombre`, `Evento.descripcion`, `Evento.categoria`, `Evento.fechaHora`, `Evento.ubicacion`, `Evento.imagenId`, `Evento.materialMultimedia`, `Evento.tiposDeEntrada`, `Evento.estado`, `Evento.creadoEn`; cada tipo con `TipoDeEntrada.id`, `TipoDeEntrada.nombre`, `TipoDeEntrada.cupo`, `TipoDeEntrada.precio`, `TipoDeEntrada.vendidas`, y cada material con `MaterialMultimedia.nombre`, `MaterialMultimedia.tipo`
- [X] T012 [P] Crear el modelo `Imagen` en aiTicketIt-back/models/Imagen.js con data-model.md `Imagen.id`, `Imagen.organizadorId`, `Imagen.tipoMime`, `Imagen.datos`
- [X] T013 [P] Implementar `eventoSchema` (zod, solo forma) en aiTicketIt-back/schemas/eventoSchema.js según data-model.md § "Validaciones de entrada" hasta que T006 pase (research R4)
- [X] T014 Agregar `eventosSeed` (8 eventos con ids `evt-1`…`evt-8`, tipos `tip-1`…, `imagenId` `img-seed-*`, ubicaciones de `pantallas.md` y descripciones cortas de ejemplo) en aiTicketIt-back/repository/seed.js según la tabla de data-model.md § "Seed" y research R18 (depende de T011)
- [X] T015 Implementar aiTicketIt-back/repository/eventosRepository.js (`listarPorOrganizador`, `buscarPorId`, `guardar`, `siguienteIdEvento`, `siguienteIdTipo`, `reiniciar`) con `Map` por data-model.md `Evento.id` y contadores `evt-N` / `tip-N` que arrancan después de los ids del seed (research R17; depende de T011, T014)
- [X] T016 Implementar aiTicketIt-back/repository/imagenesRepository.js (`guardar`, `buscarPorId`, `reiniciar`); `reiniciar()` carga los PNG de `imagenes-seed/` con ids `img-seed-*` y data-model.md `Imagen.organizadorId` en `null` (research R8; depende de T002, T012)
- [X] T017 Sumar `eventosRepository.reiniciar()` e `imagenesRepository.reiniciar()` a `reiniciarRepositorios()` en aiTicketIt-back/repository/index.js (depende de T015, T016)
- [X] T018 [P] Crear `aEventoResumenDto` y `aEventoDto` en aiTicketIt-back/dto/eventoDto.js: estado visible derivado con `reloj.ahora()`, `cupo` y `vendidas` totales (los `null` cuentan 0), `imagenUrl` = `/imagenes/{imagenId}`, y `disponibles` por tipo, según data-model.md § "Valores derivados" y contracts/eventos.openapi.yaml `EventoResumen`/`Evento` hasta que T005 pase (research R1)
- [X] T019 Crear `imagenesService.obtener(id)` en aiTicketIt-back/services/imagenesService.js, la ruta `GET /imagenes/:id` (pública, `Content-Type` de data-model.md `Imagen.tipoMime`, `Cache-Control: public, max-age=31536000, immutable`) con su `@openapi` en aiTicketIt-back/routes/imagenes.js y aiTicketIt-back/controllers/imagenesController.js, y montarla en aiTicketIt-back/app.js, hasta que T007 pase (depende de T010, T016)
- [X] T020 [P] Crear el helper `tokenDeOrganizador(email)` (ingresa con `Entradas2026` y devuelve el token) en aiTicketIt-back/tests/helpers/sesion.js

### Front: base compartida

- [X] T021 [P] Crear `plata(n)` (`$ 18.000`, 0 → `$ 0`), `fechaCorta(iso)` (`Sáb 21 nov · 21:00` en hora local, `null` → "Fecha a definir"), `miles(n)` y `entradasVendidas(n, m)` ("N de M entradas vendidas") en aiTicketIt-front/src/lib/formato.ts (contracts/rutas-front.md § "Formatos")
- [X] T022 [P] Ampliar `pedir()` en aiTicketIt-front/src/api/cliente.ts con el método `PUT` y un body binario (`Blob` con su `Content-Type`, sin `JSON.stringify`) para subir la imagen
- [X] T023 [P] Crear los tipos (`EventoResumen`, `Evento`, `TipoDeEntrada`, `EventoEntrada`, `MaterialMultimedia`, `EstadoEvento`, `Categoria`) y `listarMisEventos(token)`, `obtenerEvento(token, id)` en aiTicketIt-front/src/api/eventos.ts, siguiendo contracts/eventos.openapi.yaml; todas pasan `token` y `tipo: "organizador"` a `pedir()`; `urlDeImagen(imagenUrl)` antepone `API_URL`
- [X] T024 [P] Crear `Tag` en aiTicketIt-front/src/components/ds/Tag.tsx con las variantes `tag-accent`, `tag-outline`, `tag-neutral` y el mapeo fijo Publicado/Borrador/Finalizado de design-system.md § Tag; la categoría usa `tag-neutral`
- [X] T025 [P] Crear `ProgressBar` (variante fina `progress` de 4px, acento plano sobre riel `neutral-900`; siempre acompañada de texto) en aiTicketIt-front/src/components/ds/ProgressBar.tsx
- [X] T026 Convertir "Mis eventos" de aiTicketIt-front/src/components/ds/DesktopNav.tsx en un link real a `/organizadores/mis-eventos` (con `aria-current` solo cuando es la ruta actual) y registrar `eventos/nuevo`, `eventos/[id]/index` y `eventos/[id]/editar` dentro del `Stack.Protected guard={!!organizador}` de aiTicketIt-front/src/app/organizadores/_layout.tsx (`nuevo` antes que `[id]`) (contracts/rutas-front.md § Rutas)

**Checkpoint**: `npm test` en verde (incluida la feature 001); `GET /imagenes/img-seed-hamlet` devuelve la imagen.

---

## Phase 3: User Story 1 - El organizador ve sus eventos (Priority: P1) 🎯 MVP

**Goal**: Mis eventos muestra solo los eventos del organizador, con estado, imagen y "N de M entradas vendidas"; las tarjetas abren el Detalle mínimo.

**Independent Test**: con `produccion@latrama.com.ar`, Mis eventos muestra "4 eventos" (Hamlet "154 de 250 entradas vendidas", Edipo Rey Finalizado, La gaviota Borrador) y ningún evento de otro organizador (quickstart escenarios 1, 2, 15, 16).

### Tests for User Story 1 ⚠️

> Escribirlos primero y verlos fallar.

- [X] T027 [P] [US1] Escribir tests unitarios de orden y filtro en aiTicketIt-back/tests/unit/eventosService.test.js (sección "listar"): `listar(org-1)` devuelve solo evt-1, evt-3, evt-7, evt-8 en el orden de research R15 (Hamlet, Bodas de sangre, La gaviota, Edipo Rey con reloj en 2026-11-09); un borrador sin fecha va después de los que tienen fecha; `obtener(org-1, "evt-2")` lanza `EventoNoEncontrado` (research R16)
- [X] T028 [P] [US1] Escribir tests de integración en aiTicketIt-back/tests/integration/misEventos.test.js: `GET /organizadores/eventos` sin token o con token de comprador → 401 `SESION_INVALIDA`; La Trama → 200 con 4 eventos y Hamlet con `vendidas: 154`, `cupo: 250`, `estado: "Publicado"`, `imagenUrl: "/imagenes/img-seed-hamlet"`; Club del Chiste → solo evt-2 y evt-5; `GET /organizadores/eventos/evt-1` → 200 con `tiposDeEntrada` y `disponibles`; `GET /organizadores/eventos/evt-2` como La Trama y `/evt-999` → 404 `EVENTO_NO_ENCONTRADO` (contracts/eventos.openapi.yaml)

### Implementation for User Story 1

- [X] T029 [US1] Implementar `eventosService.listar(organizadorId)` (orden de research R15 usando el estado derivado) y `eventosService.obtener(organizadorId, id)` (404 si no existe o data-model.md `Evento.organizadorId` no coincide) en aiTicketIt-back/services/eventosService.js hasta que T027 pase
- [X] T030 [US1] Crear `listar` y `obtener` en aiTicketIt-back/controllers/eventosOrganizadorController.js (usan `req.sesion.usuario.id` y los DTO de T018) y las rutas `GET /` y `GET /:id` con `requiereSesion("organizador")` en aiTicketIt-back/routes/eventosOrganizador.js, con los `@openapi` de contracts/eventos.openapi.yaml (paths, `components.schemas` y `components.responses.EventoNoEncontrado`); montar en `/organizadores/eventos` en aiTicketIt-back/app.js, hasta que T028 pase
- [X] T031 [P] [US1] Crear `EventManageCard` (imagen de 140px o espacio neutro `surface` si `imagenUrl` es `null`, título 15px o "Nombre del evento", fecha corta o "Fecha a definir", `Tag` de estado, `ProgressBar` fina y `entradasVendidas`; toda la tarjeta es un botón accesible) y `NuevoEventoTile` (tile punteado "Nuevo evento") en aiTicketIt-front/src/components/ds/EventManageCard.tsx (design-system.md § EventManageCard)
- [X] T032 [US1] Completar Organizadores 02 en aiTicketIt-front/src/app/organizadores/mis-eventos.tsx: título "Mis eventos", contador "N eventos" / "1 evento", botón primario **Crear evento** → `/organizadores/eventos/nuevo`, grilla con 4/3/2/1 columnas según `useWindowDimensions()` (research R14), tarjetas → `/organizadores/eventos/[id]`, tile **Nuevo evento** al final, esqueletos mientras carga y error de red con **Reintentar** (contracts/rutas-front.md § Organizadores 02); recarga al volver a la pantalla (`useFocusEffect`)
- [X] T033 [US1] Crear Organizadores 04 mínimo en aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx: DesktopNav, Volver → Mis eventos, título ("Nombre del evento"), "{fecha corta} · {ubicación}", `Tag` de estado, **Consultas del evento** secundario deshabilitado al 45%; con 404, "No encontramos el evento." + link a Mis eventos (contracts/rutas-front.md § Organizadores 04; FR-021). El botón **Editar evento** se agrega en US4 (T066)

**Checkpoint**: US1 se puede demostrar sola (quickstart escenarios 1, 2, 16 y 17 en Mis eventos).

---

## Phase 4: User Story 2 - El organizador crea y publica un evento (Priority: P1)

**Goal**: Crear evento con imagen, multimedia, tipos de entrada, validaciones y vista previa en vivo; **Publicar evento** lo deja Publicado con 0 vendidas y lleva al Detalle.

**Independent Test**: crear un evento con dos tipos y fecha futura, publicarlo y verlo en Mis eventos como Publicado con "0 de N entradas vendidas" (quickstart escenarios 3–9).

### Tests for User Story 2 ⚠️

- [X] T034 [P] [US2] Escribir tests unitarios de `validarParaPublicar(evento, ahora)` en aiTicketIt-back/tests/unit/reglasEvento.test.js: devuelve **todos** los errores juntos, uno por campo, con los mensajes exactos de data-model.md para `Evento.nombre`, `Evento.fechaHora` (falta / no futura, comparando instantes), `Evento.ubicacion`, `Evento.tiposDeEntrada` (vacío → `campo: "tiposDeEntrada"`), y por tipo `TipoDeEntrada.nombre` (falta / repetido comparando recortado y en minúsculas: " VIP " y "vip"), `TipoDeEntrada.cupo` (falta / < 1) y `TipoDeEntrada.precio` (falta / negativo; 0 válido), con campos `tiposDeEntrada.N.*`; un evento completo devuelve `[]`
- [X] T035 [P] [US2] Escribir tests unitarios de `eventosService.crear` en aiTicketIt-back/tests/unit/eventosService.test.js (sección "crear"): con `estado: "Publicado"` inválido lanza `DatosInvalidos` con los `campos` de `reglasEvento`; válido asigna `evt-9`, `tip-N` nuevos, data-model.md `TipoDeEntrada.vendidas` en 0, `Evento.organizadorId` de la sesión y `Evento.creadoEn`; ignora `vendidas` e `id` enviados por el cliente; un `imagenId` inexistente o de otro organizador → `DatosInvalidos` en `imagenId`
- [X] T036 [P] [US2] Escribir tests unitarios de la firma de bytes en aiTicketIt-back/tests/unit/imagenesService.test.js: acepta `FF D8 FF` (JPG) y `89 50 4E 47` (PNG); rechaza un PNG declarado como JPG con bytes de texto, un buffer vacío y un PDF con `ImagenInvalida` (research R7)
- [X] T037 [P] [US2] Escribir tests de integración en aiTicketIt-back/tests/integration/crearEvento.test.js: `POST /organizadores/eventos` sin token → 401; `{ estado: "Publicado" }` → 400 con `campos` de `nombre`, `fechaHora`, `ubicacion` y `tiposDeEntrada`; fecha pasada (reloj en 2026-11-09) → "La fecha tiene que ser futura"; "Platea" y "platea" → `tiposDeEntrada.1.nombre`; evento válido → 201 con `estado: "Publicado"`, `vendidas: 0`, `cupo` total, y aparece en `GET /organizadores/eventos` de La Trama pero no en el de Club del Chiste (SC-002)
- [X] T038 [P] [US2] Escribir tests de integración en aiTicketIt-back/tests/integration/imagenes.test.js (sección "subir"): `POST /organizadores/imagenes` sin token → 401; PNG válido → 201 `{ id, url }` y `GET url` devuelve los mismos bytes; `text/plain` o bytes que no son imagen → 415 `IMAGEN_INVALIDA`; más de 5 MB → 413 `IMAGEN_MUY_GRANDE`; un evento creado con ese `imagenId` devuelve `imagenUrl`

### Implementation for User Story 2

- [X] T039 [US2] Implementar `validarParaPublicar(evento, ahora)` en aiTicketIt-back/services/reglasEvento.js hasta que T034 pase (research R4, R5)
- [X] T040 [US2] Implementar `imagenesService.subir(organizadorId, tipoMime, buffer)` (verifica firma, guarda con UUID de `crypto.randomUUID()` y data-model.md `Imagen.organizadorId`) y `imagenesService.verificarDuenio(organizadorId, imagenId)` en aiTicketIt-back/services/imagenesService.js hasta que T036 pase
- [X] T041 [US2] Agregar `POST /organizadores/imagenes` con `requiereSesion("organizador")` y `express.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" })` en aiTicketIt-back/routes/imagenes.js y su handler en aiTicketIt-back/controllers/imagenesController.js; un Content-Type distinto → `ImagenInvalida`, y el error `entity.too.large` de Express → `ImagenMuyGrande` con un manejador de errores propio de esta ruta en aiTicketIt-back/routes/imagenes.js (no en `manejadorDeErrores`, para que un JSON demasiado grande en otra ruta no responda con el mensaje de la imagen); con su `@openapi`, hasta que T038 pase
- [X] T042 [US2] Implementar `eventosService.crear(organizadorId, entrada)` en aiTicketIt-back/services/eventosService.js: si `estado` es Publicado aplica `validarParaPublicar` con `reloj.ahora()`; verifica `imagenId`; asigna ids, `vendidas: 0` y `creadoEn`, hasta que T035 pase (FR-016)
- [X] T043 [US2] Agregar `POST /` con `requiereSesion("organizador")` y `validar(eventoSchema)` → 201 `{ evento }` en aiTicketIt-back/routes/eventosOrganizador.js y aiTicketIt-back/controllers/eventosOrganizadorController.js, con su `@openapi` (`EventoEntrada`, `responses.ReglasDeEvento`), hasta que T037 pase
- [X] T044 [P] [US2] Crear en aiTicketIt-front/src/lib/validacionEvento.ts el estado del formulario (data-model.md § "Estado del formulario en el front"), `validarEvento(form, ahora)` con las mismas reglas y mensajes que `reglasEvento` (por campo y por tipo, rutas `tiposDeEntrada.N.*`), `notaPublicar(errores)` ("Revisá el campo marcado para publicar." / "Revisá los campos marcados para publicar." / "Agregá al menos un tipo de entrada para publicar.") y `aEventoEntrada(form, estado)` (cupo y precio de texto a entero, vacíos a `null`) (research R13)
- [X] T045 [P] [US2] Agregar `crearEvento(token, entrada)` y `subirImagen(token, archivo)` (`fetch(uri)` → `blob` → `POST /organizadores/imagenes`) en aiTicketIt-front/src/api/eventos.ts
- [X] T046 [P] [US2] Crear `Select` en aiTicketIt-front/src/components/ds/Select.tsx (nativo: modal/BottomSheet con las opciones) y aiTicketIt-front/src/components/ds/Select.web.tsx (`<select>` con estilo de Field), con label arriba y placeholder "Elegí una categoría" (research R12)
- [X] T047 [P] [US2] Crear `CampoFechaHora` en aiTicketIt-front/src/components/ds/CampoFechaHora.tsx (`@react-native-community/datetimepicker`, fecha y después hora) y aiTicketIt-front/src/components/ds/CampoFechaHora.web.tsx (`<input type="datetime-local">`), que devuelven ISO con el offset local, con label "Fecha y hora de realización" y error debajo (research R3, R11)
- [X] T048 [P] [US2] Crear `Dropzone` en aiTicketIt-front/src/components/ds/Dropzone.tsx (clic → `expo-image-picker` con `mediaTypes: ['images']`) y aiTicketIt-front/src/components/ds/Dropzone.web.tsx (además `dragover`/`drop` del DOM): borde punteado, "Arrastrá un archivo o hacé clic. JPG o PNG, 1600×900.", valida tipo y 5 MB antes de subir, muestra miniatura + "Cambiar imagen" y los errores de contracts/rutas-front.md; si falla, conserva la imagen anterior (research R10)
- [X] T049 [P] [US2] Crear `MaterialMultimediaEditor` en aiTicketIt-front/src/components/ds/MaterialMultimedia.tsx: tags `tag-neutral` con ícono foto/video (según data-model.md `MaterialMultimedia.tipo`) y quitar (`aria-label="Quitar {nombre}"`), más ghost **Agregar foto o video** con `expo-image-picker` (`['images', 'videos']`) del que solo se toman nombre y tipo (research R9)
- [X] T050 [P] [US2] Crear `TicketTypeEditor` en aiTicketIt-front/src/components/ds/TicketTypeEditor.tsx: grilla de 3 columnas (menos en pantallas angostas), tarjetas "Entrada N" con Nombre (placeholder "Ej.: Platea"), Cupo y Precio ($) lado a lado, quitar (`aria-label="Quitar entrada N"`), tile punteado **Agregar tipo de entrada** que agrega una entrada vacía, renumeración al quitar y error general arriba (design-system.md § TicketTypeEditor). Recibe `vendidas` por tipo para US4
- [X] T051 [P] [US2] Crear `EventPreview` en aiTicketIt-front/src/components/ds/EventPreview.tsx: kicker "Vista previa · así lo verá el comprador", EventCard con imagen, Tag de categoría (si hay), nombre, fecha, ubicación, descripción, lista "{tipo} · {cupo} lugares — $ {precio}", **Comprar** inerte y "Capacidad total: N lugares" / "1 lugar", con los textos genéricos de FR-018 (contracts/rutas-front.md § Vista previa)
- [X] T052 [US2] Crear `FormularioEvento` en aiTicketIt-front/src/components/ds/FormularioEvento.tsx: Volver + título, campos en el orden de FR-008 (Descripción con contador "N/2000"), errores según FR-013 (se muestran por campo tocado; el primario se ve deshabilitado, no envía con errores y, si se lo toca, marca todos los campos como tocados; la nota aparece solo con algún error visible), errores del back (`campos`) en el mismo lugar, botón primario con nota, **Guardar borrador**, los dos deshabilitados mientras guarda, error de red sin perder lo escrito, y la vista previa a la derecha (400px) desde 1000px o debajo en pantallas angostas (research R14). Props: `modo` (`crear` | `editarBorrador` | `editarPublicado`), `inicial`, `onGuardar(entrada, estado)` (depende de T044–T051)
- [X] T053 [US2] Crear Organizadores 03 · Crear evento en aiTicketIt-front/src/app/organizadores/eventos/nuevo.tsx: DesktopNav + `FormularioEvento` en modo `crear`; **Publicar evento** → `crearEvento(…, "Publicado")` y `router.replace` al Detalle; Volver → Mis eventos (contracts/rutas-front.md § Navegación)

**Checkpoint**: US1 + US2 funcionan (quickstart escenarios 3–9).

---

## Phase 5: User Story 3 - El organizador guarda un borrador (Priority: P2)

**Goal**: **Guardar borrador** guarda sin validar; el borrador aparece en Mis eventos, no es visible para compradores y después se puede completar y publicar.

**Independent Test**: guardar un borrador solo con nombre desde el front y verlo como Borrador en Mis eventos con "Fecha a definir" (quickstart escenario 10); completarlo y publicarlo con `PUT` desde la API (T054). Publicarlo desde el front (escenario 11) llega con US4.

### Tests for User Story 3 ⚠️

- [X] T054 [P] [US3] Escribir tests de integración en aiTicketIt-back/tests/integration/borradorEvento.test.js: `POST` con `{ estado: "Borrador" }` → 201 Borrador con todo en `null` y `tiposDeEntrada: []`; un borrador con fecha pasada y precio negativo también se guarda (FR-014; la forma igual se valida: `cupo: 1.5` → 400); el borrador aparece en `GET /organizadores/eventos` con `cupo: 0`, `vendidas: 0`; `PUT /organizadores/eventos/evt-8` (La gaviota) con datos completos y `estado: "Publicado"` → 200 Publicado; con datos incompletos y `estado: "Publicado"` → 400 y sigue Borrador
- [X] T055 [P] [US3] Escribir tests unitarios de `eventosService.editar` en aiTicketIt-back/tests/unit/eventosService.test.js (sección "editar borrador"): un evento ajeno o inexistente lanza `EventoNoEncontrado`; Borrador → Borrador guarda sin reglas de publicación; Borrador → Publicado inválido lanza `DatosInvalidos` con los `campos` de `reglasEvento` y válido queda Publicado; conserva data-model.md `Evento.id`, `Evento.organizadorId` y `Evento.creadoEn` aunque la entrada traiga otros; un `imagenId` de otro organizador → error en `imagenId`

### Implementation for User Story 3

- [X] T056 [US3] Implementar `eventosService.editar(organizadorId, id, entrada)` en aiTicketIt-back/services/eventosService.js para el caso Borrador → Borrador/Publicado: 404 si es ajeno, aplica `validarParaPublicar` si `estado` es Publicado, verifica `imagenId` y conserva data-model.md `Evento.id`, `Evento.organizadorId` y `Evento.creadoEn`; y agregar `PUT /:id` con `validar(eventoSchema)` en aiTicketIt-back/routes/eventosOrganizador.js y aiTicketIt-back/controllers/eventosOrganizadorController.js con su `@openapi`, hasta que T054 y T055 pasen
- [X] T057 [US3] Conectar **Guardar borrador** en aiTicketIt-front/src/app/organizadores/eventos/nuevo.tsx: `crearEvento(…, "Borrador")` siempre habilitado y, si sale bien, `router.replace("/organizadores/mis-eventos")` (FR-014, FR-025)

**Checkpoint**: crear y publicar borradores desde la API; en el front, el borrador aparece en Mis eventos (publicarlo desde el front llega con US4, que agrega Editar).

---

## Phase 6: User Story 4 - El organizador edita un evento (Priority: P2)

**Goal**: Editar evento reutiliza el formulario precargado; protege las ventas, no despublica y no edita Finalizados.

**Independent Test**: en Bodas de sangre, cambiar la descripción, cambiar el precio de Platea y agregar un tipo; las vendidas siguen en 110. Bajar el cupo de Platea a 20 da error. Edipo Rey no ofrece **Editar evento** (quickstart escenarios 11–15).

### Tests for User Story 4 ⚠️

- [X] T058 [P] [US4] Escribir tests unitarios de `validarCambiosConVentas(guardado, entrada)` en aiTicketIt-back/tests/unit/reglasEvento.test.js: quitar un tipo con data-model.md `TipoDeEntrada.vendidas` > 0 → `campo: "tiposDeEntrada"`, "Tiene ventas: no se puede quitar"; cupo menor a las vendidas → `tiposDeEntrada.N.cupo`, "El cupo no puede ser menor a las vendidas (30)"; cambiar nombre o precio de un tipo con ventas → sin error; quitar un tipo sin ventas → sin error; un `id` de tipo que no es del evento → error en `tiposDeEntrada.N.id` (research R6)
- [X] T059 [P] [US4] Escribir tests de integración en aiTicketIt-back/tests/integration/editarEvento.test.js: `PUT /organizadores/eventos/evt-3` cambiando la descripción, el precio de Platea (`tip` existente) y agregando "VIP" → 200; las vendidas de General y Platea siguen 80 y 30, VIP 0, y `vendidas` total 110 (SC-006); sin el tipo Platea → 400 "Tiene ventas: no se puede quitar"; Platea con cupo 20 → 400; `estado: "Borrador"` sobre evt-3 → 409 `NO_SE_PUEDE_DESPUBLICAR`; `PUT evt-7` (Edipo Rey, Finalizado) → 409 `EVENTO_FINALIZADO`; `PUT evt-2` como La Trama → 404; un Publicado sin nombre → 400 "Poné un nombre al evento"
- [X] T060 [P] [US4] Escribir tests unitarios de `eventosService.editar` en aiTicketIt-back/tests/unit/eventosService.test.js (sección "editar con ventas"), con `fijarAhora(2026-11-09T12:00-03:00)`: Edipo Rey (Finalizado) lanza `EventoFinalizado`; Publicado → Borrador lanza `NoSePuedeDespublicar`; en Bodas de sangre, cambiar el precio de Platea conserva data-model.md `TipoDeEntrada.vendidas` por `TipoDeEntrada.id`; un tipo nuevo recibe `tip-N` y `vendidas: 0`; un error de ventas y uno de publicación salen juntos en un solo `DatosInvalidos`

### Implementation for User Story 4

- [X] T061 [US4] Implementar `validarCambiosConVentas(guardado, entrada)` en aiTicketIt-back/services/reglasEvento.js hasta que T058 pase
- [X] T062 [US4] Completar `eventosService.editar` en aiTicketIt-back/services/eventosService.js según research R6: `EventoFinalizado` si el estado visible es Finalizado, `NoSePuedeDespublicar` si se pasa de Publicado a Borrador, `validarCambiosConVentas` junto con `validarParaPublicar` (errores combinados en un solo `DatosInvalidos`), conserva data-model.md `TipoDeEntrada.vendidas` por `TipoDeEntrada.id` y asigna `tip-N` a los tipos nuevos, hasta que T059 y T060 pasen (FR-019, FR-020)
- [X] T063 [P] [US4] Agregar `editarEvento(token, id, entrada)` en aiTicketIt-front/src/api/eventos.ts
- [X] T064 [US4] Completar el modo edición en aiTicketIt-front/src/components/ds/FormularioEvento.tsx y aiTicketIt-front/src/components/ds/TicketTypeEditor.tsx: título "Editar evento"; en `editarPublicado`, primario **Guardar cambios** sin **Guardar borrador** y nota "…para guardar."; tipos con ventas con quitar deshabilitado + "Tiene ventas: no se puede quitar" y "N vendidas" muted; error de cupo < vendidas en vivo; en `validarEvento` de aiTicketIt-front/src/lib/validacionEvento.ts, la regla de cupo ≥ vendidas (contracts/rutas-front.md § Organizadores 03)
- [X] T065 [US4] Crear Editar evento en aiTicketIt-front/src/app/organizadores/eventos/[id]/editar.tsx: carga con `obtenerEvento`, precarga el formulario (incluidos los `id` de tipo); si es Finalizado o responde 409 `EVENTO_FINALIZADO`, vuelve al Detalle; 404 → "No encontramos el evento."; **Publicar evento** / **Guardar cambios** → `editarEvento` y `router.replace` al Detalle; **Guardar borrador** (solo Borrador) → Mis eventos; Volver → Detalle (FR-025)
- [X] T066 [US4] Agregar **Editar evento** (secundario, oculto si el estado es Finalizado) → `/organizadores/eventos/[id]/editar` en aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx (FR-021)

**Checkpoint**: las cuatro historias funcionan (quickstart escenarios 1–16).

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T067 [P] Extender aiTicketIt-back/tests/integration/docs.test.js: `/docs.json` incluye `/organizadores/eventos`, `/organizadores/eventos/{id}`, `/organizadores/imagenes` e `/imagenes/{id}` con sus métodos, y los schemas `Evento`, `EventoResumen` y `EventoEntrada` (Principio IV)
- [X] T068 [P] Actualizar CLAUDE.md (sección Estructura del front y Backend): rutas `organizadores/eventos/*`, endpoints de eventos e imágenes, `services/reloj.js` (`fijarAhora` en tests) e imágenes del seed en `repository/imagenes-seed/`
- [X] T069 Revisar que Mis eventos, Crear/Editar evento y el Detalle mínimo usen solo tokens de aiTicketIt-front/src/theme/tokens.ts (sin colores, medidas ni radios sueltos) y los textos exactos de contracts/rutas-front.md
- [X] T070 Correr `npm test` en aiTicketIt-back, `npm run lint` y `npx tsc --noEmit` en aiTicketIt-front, y recorrer los 18 escenarios de specs/002-eventos-organizador/quickstart.md (web en 1280 px y en 390 px); anotar en quickstart.md cualquier diferencia encontrada

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T003 (diseño) bloquea todas las tareas de front (T021–T026 y las de front de cada historia).
- **Foundational (Phase 2)**: depende de Setup (T002 para T016). Bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: depende de Foundational. En el back es independiente de US1; en el front, la navegación al Detalle después de publicar usa T033 (US1).
- **US3 (Phase 5)**: el back depende de T039 y T042 (US2) para la validación y la creación; el front usa la pantalla de T053.
- **US4 (Phase 6)**: depende de T056 (US3, `PUT` base) y de T052 (US2, formulario).
- **Polish (Phase 7)**: después de las historias que se entreguen.

### Within Each User Story

- Los tests del backend se escriben y se ven fallar antes de la implementación (Principio II).
- Modelos → repositorios → servicios → controllers/rutas → front.
- `reglasEvento.js`, `eventosService.js`, `eventosOrganizador.js` y `FormularioEvento.tsx` se tocan en varias historias: esas tareas van en secuencia, no en paralelo.

### Parallel Opportunities

- Setup: T001, T002 y T003.
- Foundational: los tests T004–T007; después T009–T013 y T018; en el front, T021–T025 en paralelo con todo el back.
- US1: T027 y T028; T031 en paralelo con el back.
- US2: T034–T038; en el front, T044–T051 (componentes en archivos distintos) mientras se implementa el back.
- US4: T058, T059 y T060; T063 en paralelo con el back.

---

## Parallel Example: User Story 2

```bash
# Tests del back (primero, todos fallan):
Task: "T034 tests de validarParaPublicar en tests/unit/reglasEvento.test.js"
Task: "T035 tests de eventosService.crear en tests/unit/eventosService.test.js"
Task: "T036 tests de firma de bytes en tests/unit/imagenesService.test.js"
Task: "T037 tests de POST /organizadores/eventos en tests/integration/crearEvento.test.js"
Task: "T038 tests de POST /organizadores/imagenes en tests/integration/imagenes.test.js"

# Componentes del front (mientras se implementa el back):
Task: "T046 Select", "T047 CampoFechaHora", "T048 Dropzone",
      "T049 MaterialMultimediaEditor", "T050 TicketTypeEditor", "T051 EventPreview"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2.
2. Phase 3 (US1): Mis eventos con los datos del seed y el Detalle mínimo.
3. **Validar**: quickstart escenarios 1, 2, 16 y 17.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → el organizador ve sus eventos (MVP).
3. US2 → crea y publica eventos con vista previa.
4. US3 → guarda borradores.
5. US4 → edita, protegiendo las ventas.
6. Polish → docs, CLAUDE.md, revisión de tokens y quickstart completo.
