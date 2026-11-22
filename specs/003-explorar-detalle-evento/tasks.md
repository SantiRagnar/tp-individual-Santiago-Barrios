---
description: "Lista de tareas de la feature 003: Explorar y detalle de evento (compradores)"
---

# Tasks: Explorar y detalle de evento (compradores)

**Input**: documentos de diseño en `specs/003-explorar-detalle-evento/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/compradores.openapi.yaml](contracts/compradores.openapi.yaml), [contracts/rutas-front.md](contracts/rutas-front.md), [quickstart.md](quickstart.md)

**Tests**: obligatorios en el backend por la constitución (Principio II, TDD). Cada bloque "tests primero" se escribe y se ve fallar antes de su implementación. Todos los tests arrancan con `reiniciarEstado()` y, si dependen de "hoy", con `fijarAhora(HOY)` (2026-11-09). El front no tiene tests automáticos: se valida con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Organization**: las tareas se agrupan por historia de usuario para poder implementarlas y probarlas por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1–US5)
- Rutas relativas a la raíz del repo: `aiTicketIt-back/` y `aiTicketIt-front/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: imagen del seed nuevo y estados de diseño que faltan

- [X] T001 [P] Generar `sotano.png` (1600×900, degradé con los colores de acento del design system, igual que las otras imágenes de ejemplo) en aiTicketIt-back/repository/imagenes-seed/ con un script de un solo uso que no queda en el repo (research R17)
- [X] T002 [P] Documentar los estados nuevos antes de cualquier tarea de front (constitución, Principio I), con los textos exactos de contracts/rutas-front.md. En "Diseño de AI Ticket It/pantallas.md":
  - Compradores 02: tarjetas esqueleto en la primera carga, indicador al pie al cargar la página siguiente de a 10, error de conexión con **Reintentar** (primera carga y página siguiente) y **Comprar** sin acción hasta la feature de compra.
  - Compradores 04: "N reseñas de eventos anteriores" con las 5 más recientes y **Ver más** (botón secundario) que agrega 5; organizador sin reseñas ("Todavía no tiene reseñas."); evento no disponible ("Este evento no está disponible." + **Volver a Explorar**).
  - Compradores 11: se recarga al volver a la pestaña.

  En "Diseño de AI Ticket It/design-system.md": Rating "para mostrar" con **Ver más** y sin reseñas, y EventCard sin puntaje cuando el organizador no tiene reseñas (research R15).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: compras con calificación, favoritos, seed, visibilidad, cursor, DTO de comprador y la base del front que usan todas las historias

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

### Backend: tests primero

- [X] T003 [P] Tests unitarios de `Compra` y `comprasRepository` en aiTicketIt-back/tests/unit/comprasRepository.test.js:
  - El seed da los resúmenes La Trama `{ suma: 18, cantidad: 4 }`, Lumbre `{ 8, 2 }` y Club del Chiste `{ 11, 3 }`, y `{ 0, 0 }` para un organizador sin reseñas.
  - `listarCalificadas` devuelve la más reciente primero (`[calificadaEn desc, numero desc]`), respeta `limite` y arranca después de `despuesDe`.
  - Guardar una compra calificada actualiza el índice y el resumen; una sin calificación no los toca.
  - `reiniciar()` vuelve al seed.
  - Usar data-model.md Compra.numero, Compra.estado, Compra.calificacion y Calificacion.calificadaEn.
- [X] T004 [P] Tests unitarios de `favoritosRepository` en aiTicketIt-back/tests/unit/favoritosRepository.test.js: `marcar` es idempotente y conserva el `marcadoEn` original, `desmarcar` es idempotente, `esFavorito`, `idsDe` es por comprador y `reiniciar()` deja todo vacío (data-model.md Favorito.eventoId, Favorito.marcadoEn).
- [X] T005 [P] Tests unitarios de `esVisibleParaCompradores` en aiTicketIt-back/tests/unit/visibilidadEvento.test.js: Publicado futuro → `true`; Borrador (con fecha futura o pasada) → `false`; Publicado con fecha pasada o igual a "ahora" → `false` (research R2).
- [X] T006 [P] Tests unitarios de `cursor` en aiTicketIt-back/tests/unit/cursor.test.js: `codificar` + `decodificar` devuelve la misma clave; base64url sin `=`; texto que no es base64url, JSON inválido o una clave con forma distinta a la esperada → `null` (research R4, R9).
- [X] T007 [P] Tests unitarios del DTO en aiTicketIt-back/tests/unit/eventoCompradorDto.test.js (research R18):
  - `precioDesde` y `precioHasta` usan todos los tipos, agotados incluidos.
  - `agotado` es `false` en Hamlet (solo VIP sin lugares) y `true` si todos tienen `vendidas = cupo`.
  - `organizador.puntaje` se redondea a 1 decimal (11/3 → 3.7) o es `null` sin reseñas; viaja también `cantidadResenas`.
  - `esFavorito` refleja `favoritosRepository`.
  - El detalle trae `tiposDeEntrada` con `disponibles`.
  - La reseña tiene `autor` "Sofía G." y `comentario` `null` si no tiene.
  - No expone `vendidas`, `cupo`, `estado` ni `materialMultimedia`.
- [X] T008 [P] Tests unitarios de `validarQuery` en aiTicketIt-back/tests/unit/validar.test.js: valida `req.query` con un schema zod, reemplaza `req.query` por los datos normalizados y devuelve `DATOS_INVALIDOS` con un error por campo, como `validar`.

### Backend: implementación

- [X] T009 Crear `Compra` (con `Calificacion` adentro) en aiTicketIt-back/models/Compra.js, según data-model.md (Compra.numero, Compra.compradorId, Compra.eventoId, Compra.tipoDeEntradaId, Compra.cantidad, Compra.monto, Compra.medioDePago, Compra.estado, Compra.creadaEn, Compra.calificacion, Calificacion.puntaje, Calificacion.comentario, Calificacion.calificadaEn)
- [X] T010 Ampliar el seed en aiTicketIt-back/repository/seed.js según data-model.md § Seed:
  - Compradores `cmp-2` a `cmp-5` con `HASH_CONTRASENA_DESARROLLO`.
  - Evento `evt-9` "Stand-up en el Sótano" con `tip-14`.
  - `"sotano"` en `imagenesSeed`.
  - Nuevo `comprasSeed` con las 9 compras calificadas.

  Depende de T001 y T009.
- [X] T011 Implementar aiTicketIt-back/repository/comprasRepository.js (research R8): `Map` por `numero` más un índice por organizador (`calificadas` ordenadas y `resumen { suma, cantidad }`), con `guardar(compra, { organizadorId })`, `buscarPorNumero`, `resumenDeCalificaciones`, `listarCalificadas(organizadorId, { despuesDe, limite })` y `reiniciar()`. Al reiniciar toma el `organizadorId` de cada compra del seed desde su evento en `eventosSeed`. Hace pasar T003.
- [X] T012 [P] Implementar aiTicketIt-back/repository/favoritosRepository.js (`Map<compradorId, Map<eventoId, marcadoEn>>`, research R10). Hace pasar T004.
- [X] T013 Sumar `comprasRepository.reiniciar()` y `favoritosRepository.reiniciar()` a `reiniciarRepositorios()` en aiTicketIt-back/repository/index.js
- [X] T014 Actualizar los tests de la feature 002 por el `evt-9` del seed (research R17):
  - En aiTicketIt-back/tests/integration/crearEvento.test.js y aiTicketIt-back/tests/unit/eventosService.test.js, el primer evento creado pasa a ser `evt-10`.
  - En aiTicketIt-back/tests/integration/misEventos.test.js, Club del Chiste ve `["evt-2", "evt-5", "evt-9"]`.
  - Si algún test cuenta compradores o imágenes del seed, actualizarlo también.

  Correr `npm test`: todo en verde salvo los tests nuevos de esta fase que todavía no tienen implementación.
- [X] T015 [P] Implementar `esVisibleParaCompradores(evento, ahora)` en aiTicketIt-back/services/visibilidadEvento.js (research R2). Hace pasar T005.
- [X] T016 [P] Implementar `codificar(clave)` / `decodificar(texto, validarForma)` en aiTicketIt-back/services/cursor.js (base64url de JSON, research R4). Hace pasar T006.
- [X] T017 [P] Agregar `OrganizadorNoEncontrado` (`ORGANIZADOR_NO_ENCONTRADO`, "No encontramos el organizador.", 404) en aiTicketIt-back/errors/ErrorDeDominio.js
- [X] T018 [P] Implementar el middleware `validarQuery(schema)` en aiTicketIt-back/middlewares/validarQuery.js, con el mismo armado de `campos` que middlewares/validar.js. En Express 5, `req.query` es un getter, así que los datos validados se dejan con `Object.defineProperty` o en `req.consulta`; documentar cuál se usa. Hace pasar T008.
- [X] T019 Implementar aiTicketIt-back/dto/eventoCompradorDto.js con `aEventoCompradorResumenDto(evento, contexto)`, `aEventoCompradorDetalleDto(evento, contexto, paginaDeResenas)` y `aResenaDto(compra, comprador, evento)`. El `contexto` trae organizador, resumen de calificaciones y `esFavorito`. Los campos son los de contracts/compradores.openapi.yaml; los valores derivados, los de data-model.md § Valores derivados. Hace pasar T007.
- [X] T020 Crear helpers en aiTicketIt-back/tests/helpers/compradores.js:
  - `crearEventosVisibles(n, datos)`: guarda eventos Publicados futuros con `eventosRepository`.
  - `crearComprasCalificadas(organizadorId, eventoId, n, desde)`: guarda compras Utilizadas con `calificadaEn` crecientes (data-model.md Compra.estado, Calificacion.calificadaEn).
  - `tokenDeComprador(email)` se reutiliza de helpers/sesion.js; sumar ahí la constante `MARTIN = "martin.perez@correo.com"`.

### Front: base compartida

- [X] T021 [P] Agregar `fechaLarga`, `hora`, `rangoDePrecios`, `puntaje`, `estrellas`, `contadorEventos` y `contadorResenas` en aiTicketIt-front/src/lib/formato.ts, con los ejemplos de contracts/rutas-front.md § Formatos (research R16)
- [X] T022 [P] Sumar la opción `signal?: AbortSignal` a `pedir()` en aiTicketIt-front/src/api/cliente.ts. Se pasa a `fetch`; un `AbortError` se relanza como `ErrorApi('CANCELADO', …)` para que la pantalla lo ignore (research R12).
- [X] T023 [P] Crear aiTicketIt-front/src/api/compradores.ts:
  - Tipos `EventoCompradorResumen`, `EventoCompradorDetalle`, `Resena`, `PaginaDeEventos` y `PaginaDeResenas`, según contracts/compradores.openapi.yaml.
  - Funciones `listarEventos({ busqueda, categoria, orden, cursor }, signal)`, `obtenerEvento(id)`, `listarResenas(organizadorId, cursor)`, `listarFavoritos()`, `marcarFavorito(id)` y `desmarcarFavorito(id)`.
  - Todas con `token` y `tipo: 'comprador'`.
- [X] T024 [P] Crear `ImagenEvento` (imagen con `expo-image` a partir de `API_URL + imagenUrl`, o espacio neutro `surface` sin imagen, alto por prop) en aiTicketIt-front/src/components/ds/ImagenEvento.tsx
- [X] T025 [P] Crear `BottomNav` (pestañas Explorar `compass` y Favoritos `heart`; la activa con ícono `-fill` y texto en acento; 48px; `accessibilityState.selected`) en aiTicketIt-front/src/components/ds/BottomNav.tsx, según design-system.md § BottomNav
- [X] T026 Reorganizar las rutas de compradores (research R11, contracts/rutas-front.md § Rutas):
  - Mover aiTicketIt-front/src/app/(compradores)/explorar.tsx a aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx.
  - Crear aiTicketIt-front/src/app/(compradores)/(pestanas)/_layout.tsx con `Tabs` (`headerShown: false`, `tabBar` = `BottomNav`).
  - Crear aiTicketIt-front/src/app/(compradores)/(pestanas)/favoritos.tsx mínimo (título "Favoritos").
  - Crear aiTicketIt-front/src/app/(compradores)/eventos/[id].tsx mínimo (AppBar provisoria con Volver).
  - En aiTicketIt-front/src/app/(compradores)/_layout.tsx, dentro del `Stack.Protected guard={!!comprador}`, cambiar `explorar` por `(pestanas)` y `eventos/[id]`.
  - Verificar que el Ingreso sigue llevando a `/explorar`, correr `npx expo start` una vez para regenerar `.expo/types` y después `npx tsc --noEmit`.

**Checkpoint**: `npm test` en verde, salvo los tests de historias todavía no escritos. El front navega entre Explorar y Favoritos con la BottomNav.

---

## Phase 3: User Story 1 - El comprador explora los eventos disponibles (Priority: P1) 🎯 MVP

**Goal**: Explorar muestra los eventos visibles con su tarjeta completa, ordenados por fecha, con contador y saludo.

**Independent Test**: ingresar como Sofía con "hoy" = 2026-11-09 y ver exactamente evt-2, evt-1, evt-4, evt-3 y evt-5, en ese orden, sin Borradores ni Finalizados (quickstart escenarios 1, 2 y 6).

### Tests for User Story 1 ⚠️

- [X] T027 [P] [US1] Tests unitarios de `explorarService.listar` sin filtros en aiTicketIt-back/tests/unit/explorarService.test.js: solo eventos visibles, orden por `fechaHora` ascendente con desempate por `id` y `total` igual a la cantidad de visibles. Con `fijarAhora` después del 2026-11-14 22:30, Risas a Domicilio ya no aparece.
- [X] T028 [P] [US1] Tests de integración de `GET /compradores/eventos` en aiTicketIt-back/tests/integration/explorar.test.js:
  - 200 con `total` 5 y los ids en orden; no aparecen evt-6, evt-7, evt-8 ni evt-9.
  - Hamlet trae `precioDesde` 12000, `agotado` false, `organizador { nombre: "Compañía La Trama", puntaje: 4.5, cantidadResenas: 4 }`, `imagenUrl` `/imagenes/img-seed-hamlet` y `esFavorito` false.
  - 401 `SESION_INVALIDA` sin token y con token de organizador.

### Implementation for User Story 1

- [X] T029 [US1] Implementar `listar(compradorId, criterio)` en aiTicketIt-back/services/explorarService.js: filtra con `esVisibleParaCompradores`, ordena por fecha (`[fechaHora, id]`) y arma el contexto de cada evento (organizador con `organizadoresRepository`, resumen con `comprasRepository`, `esFavorito`). En esta historia devuelve todos los resultados con `total` y `siguiente: null`; la paginación llega en US2. Hace pasar T027.
- [X] T030 [US1] Crear aiTicketIt-back/controllers/eventosCompradorController.js con `listar`, que devuelve `{ eventos, total, siguiente }` con `aEventoCompradorResumenDto`
- [X] T031 [US1] Crear aiTicketIt-back/routes/eventosComprador.js con `requiereSesion("comprador")` y `GET /`, con su bloque `@openapi` (path y schemas `OrganizadorResumen`, `EventoCompradorResumen` y `PaginaDeEventos` de contracts/compradores.openapi.yaml). Montarlo en `/compradores/eventos` en aiTicketIt-back/app.js. Hace pasar T028.
- [X] T032 [P] [US1] Crear `EventCard` en aiTicketIt-front/src/components/ds/EventCard.tsx, según design-system.md § EventCard y contracts/rutas-front.md § Compradores 02:
  - `ImagenEvento` de 150px, Tag de categoría y un hueco arriba a la derecha (prop `accionSuperior`) para el corazón de US5.
  - Título, fecha corta y sala con íconos.
  - Pie con "Desde $ X" y "4.5 · {organizador}" (o solo el organizador si `puntaje` es `null`).
  - **Comprar** con `onPress` vacío, que no propaga el toque a la tarjeta (research R14).
  - Toda la tarjeta navega a `/eventos/[id]`.
- [X] T033 [US1] Completar aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx (FR-003, FR-007, FR-008):
  - Saludo con Avatar, "Hola, {nombre}" y "¿Qué querés ver?".
  - Contador `contadorEventos(total)` y `FlatList` de `EventCard`.
  - Tarjetas esqueleto en la primera carga.
  - Error con "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**.

**Checkpoint**: US1 se puede demostrar sola (quickstart escenarios 1, 2 y 6).

---

## Phase 4: User Story 2 - El comprador busca, filtra y ordena (Priority: P1)

**Goal**: búsqueda sin mayúsculas ni tildes, chips de categoría, orden Fecha/Precio/Puntaje y carga de a 10 al llegar al final, todo resuelto en el servicio.

**Independent Test**: chip Comedia + orden Precio → Impro Express y después Risas a Domicilio; "lumbre" → solo Cartas a Julieta; con 23 eventos visibles, páginas de 10, 10 y 3 sin repetidos (quickstart escenarios 3–5 y 16).

### Tests for User Story 2 ⚠️

- [X] T034 [P] [US2] Tests unitarios del schema en aiTicketIt-back/tests/unit/explorarSchema.test.js (data-model.md § Validaciones de entrada: `busqueda`, `categoria`, `orden`, `cursor`):
  - `orden` por defecto `fecha`.
  - Categoría fuera de la lista → "Elegí una categoría válida".
  - Orden inválido → "Elegí un orden válido".
  - Más de 100 caracteres → "La búsqueda puede tener hasta 100 caracteres".
  - La búsqueda se recorta y queda vacía si son solo espacios.
- [X] T035 [P] [US2] Ampliar aiTicketIt-back/tests/unit/explorarService.test.js:
  - Búsqueda normalizada: "galpon" encuentra Hamlet, "LUMBRE" encuentra Cartas a Julieta por organizador y "konex" por ubicación (research R6).
  - Filtro por categoría, y búsqueda + categoría combinadas con `total` del resultado.
  - Orden `precio` por `precioDesde` y orden `puntaje` (La Trama 4.5, Lumbre 4.0, Club del Chiste 3.7; un organizador sin reseñas, al final).
  - Desempate por fecha e id (research R5).
  - Con 23 eventos (helper T020): páginas de 10, 10 y 3, `siguiente` `null` al final, sin repetidos ni salteados aunque se publique un evento nuevo entre la página 1 y la 2 (research R4).
  - Cursor inválido o de otro orden → `DatosInvalidos` con campo `cursor` ("El cursor no es válido").
- [X] T036 [P] [US2] Ampliar aiTicketIt-back/tests/integration/explorar.test.js:
  - `?busqueda=galpon` → solo evt-1.
  - `?categoria=Comedia&orden=precio` → evt-5, evt-2.
  - `?orden=puntaje` → evt-1, evt-3, evt-4, evt-2, evt-5.
  - `?busqueda=xyz` → `total` 0 y lista vacía.
  - 400 `DATOS_INVALIDOS` con `orden=nombre`, `categoria=Rock` y un cursor roto.
  - Paginación de 23 eventos recorriendo `siguiente` hasta `null`, con `total` 23 en cada página.

### Implementation for User Story 2

- [X] T037 [US2] Crear aiTicketIt-back/schemas/explorarSchema.js con `busqueda`, `categoria` (reusa `CATEGORIAS` de schemas/eventoSchema.js), `orden` y `cursor`, citando data-model.md § Validaciones de entrada. Hace pasar T034.
- [X] T038 [US2] Completar `listar` en aiTicketIt-back/services/explorarService.js (research R4–R6). Hace pasar T035.
  - Normalizar con `normalize("NFD")` sin `\p{M}`.
  - Filtrar por categoría.
  - Ordenar con clave completa `[clave del orden, fechaHora, id]`; en `puntaje`, `null` va al final.
  - Decodificar el cursor con `services/cursor.js` validando que su forma coincida con el orden.
  - Cortar 10 (`TAMANO_PAGINA_EVENTOS`) después del cursor y devolver `siguiente` codificado o `null`, con `total` del filtro completo.
- [X] T039 [US2] Agregar `validarQuery(explorarSchema)` a `GET /` en aiTicketIt-back/routes/eventosComprador.js y completar su `@openapi` con los parámetros `busqueda`, `categoria`, `orden` y `cursor` y la respuesta 400. Hace pasar T036.
- [X] T040 [P] [US2] Crear `Chip` y `FilaDeChips` (scroll horizontal, una sola elección, la primera es "Todos", 34px, `accessibilityState.selected`) en aiTicketIt-front/src/components/ds/Chip.tsx, según design-system.md § Chip
- [X] T041 [P] [US2] Crear `SegmentedControl` (2 a 4 opciones en partes iguales, una sola elección) en aiTicketIt-front/src/components/ds/SegmentedControl.tsx, según design-system.md § SegmentedControl
- [X] T042 [P] [US2] Crear `EstadoVacio` (título + texto muted) en aiTicketIt-front/src/components/ds/EstadoVacio.tsx
- [X] T043 [P] [US2] Crear el hook `useListaPaginada(pedirPagina, criterio)` en aiTicketIt-front/src/hooks/useListaPaginada.ts (research R12):
  - Guarda `items`, `total`, `siguiente`, `cargando`, `cargandoMas` y `error`.
  - Al cambiar el criterio, cancela con `AbortController` y reinicia.
  - Descarta respuestas de un pedido viejo (número de pedido) y descarta ids repetidos al agregar.
  - `cargarMas()` no hace nada si ya está cargando o si `siguiente` es `null`; `reintentar()` repite el último pedido.
- [X] T044 [US2] Conectar en aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx (FR-004 a FR-007, FR-010, FR-025):
  - Campo de búsqueda con ícono y placeholder "Buscar evento, sala u organizador", con espera de 300 ms.
  - `FilaDeChips` (Todos, Teatro, Comedia, Drama, Amor) y `SegmentedControl` (Fecha, Precio, Puntaje).
  - `useListaPaginada` con `listarEventos`.
  - `onEndReached` → `cargarMas`, con `ActivityIndicator` al pie mientras carga y aviso de conexión + **Reintentar** al pie si falla una página siguiente.
  - `EstadoVacio` "No encontramos eventos" / "Probá con otra búsqueda o categoría.".

**Checkpoint**: US1 + US2 funcionan juntas (quickstart escenarios 3–5 y 16).

---

## Phase 5: User Story 3 - El comprador ve el detalle de un evento (Priority: P1)

**Goal**: Detalle con facts, descripción, opiniones del organizador cargadas de a 5 con **Ver más**, footer con Comprar y pantalla de evento no disponible.

**Independent Test**: abrir Hamlet y comparar todo con el seed (4 reseñas de La Trama, la más reciente de Diego R.); Impro Express muestra "$ 8.000" sin rango; con 12 reseñas, **Ver más** muestra 5, 10 y 12 (quickstart escenarios 7–9, 14 y 15).

### Tests for User Story 3 ⚠️

- [X] T045 [P] [US3] Tests unitarios de aiTicketIt-back/tests/unit/resenasService.test.js (research R8, R9):
  - `pagina(organizadorId, cursor)` devuelve 5 de la más reciente a la más antigua, con `total` y `siguiente`.
  - Con 12 reseñas (helper T020): 5, 5 y 2; `siguiente` `null` al final.
  - Una reseña nueva agregada entre páginas no repite ni saltea elementos.
  - Un organizador sin reseñas → lista vacía y `total` 0.
  - Un organizador inexistente → `OrganizadorNoEncontrado`; un cursor inválido → `DatosInvalidos`.
- [X] T046 [P] [US3] Ampliar aiTicketIt-back/tests/unit/explorarService.test.js con `obtener(compradorId, id)`: un evento visible trae el contexto completo; un Borrador, un Finalizado o un id inexistente lanzan `EventoNoEncontrado` (research R3).
- [X] T047 [P] [US3] Tests de integración en aiTicketIt-back/tests/integration/detalleEvento.test.js:
  - `GET /compradores/eventos/evt-1` → 200 con `descripcion`, `precioDesde` 12000, `precioHasta` 26000, 3 `tiposDeEntrada` (VIP con `disponibles` 0) y `resenas.resenas` de 4 elementos (el primero de "Diego R." con 4★ sobre Edipo Rey; el de "Lucía F." con `comentario` `null`) y `siguiente` `null`.
  - evt-5 → `precioDesde` = `precioHasta` = 8000.
  - evt-7, evt-8 y `evt-999` → 404 `EVENTO_NO_ENCONTRADO`.
  - `GET /compradores/organizadores/org-1/resenas` con 12 reseñas → páginas de 5, 5 y 2 siguiendo `siguiente`, con `total` 12.
  - `org-999` → 404 `ORGANIZADOR_NO_ENCONTRADO`; cursor roto → 400; sin sesión → 401.

### Implementation for User Story 3

- [X] T048 [US3] Implementar aiTicketIt-back/services/resenasService.js con `resumen(organizadorId)` y `pagina(organizadorId, cursor)`, usando `comprasRepository.listarCalificadas` con `TAMANO_PAGINA_RESENAS = 5`, clave `[calificadaEn, numero]` y `services/cursor.js`. Hace pasar T045.
- [X] T049 [US3] Agregar `obtener(compradorId, id)` en aiTicketIt-back/services/explorarService.js: visibilidad, contexto y primera página de reseñas desde `resenasService`. Hace pasar T046.
- [X] T050 [US3] Agregar `obtener` y `resenas` a aiTicketIt-back/controllers/eventosCompradorController.js y las rutas:
  - `GET /:id` en aiTicketIt-back/routes/eventosComprador.js.
  - `GET /:id/resenas` (con `validarQuery` para `cursor`) en un router `/compradores/organizadores` dentro del mismo archivo, montado en aiTicketIt-back/app.js.
  - Los dos con su `@openapi` (schemas `EventoCompradorDetalle`, `TipoDeEntradaComprador`, `Resena` y `PaginaDeResenas` de contracts/compradores.openapi.yaml).

  Hace pasar T047.
- [X] T051 [P] [US3] Crear `AppBar` (Volver `arrow-left` 44px con `accessibilityLabel` "Volver", título de una línea con elipsis, a lo sumo una acción a la derecha) en aiTicketIt-front/src/components/ds/AppBar.tsx, según design-system.md § AppBar
- [X] T052 [P] [US3] Crear `Facts` (ícono en acento + dato, sin etiqueta: `calendar-blank`, `clock`, `map-pin`, `ticket`) en aiTicketIt-front/src/components/ds/Facts.tsx
- [X] T053 [P] [US3] Crear `ActionFooter` (valor a la izquierda con "Desde" en 12px muted + monto en 17px, `Button` cta a la derecha, padding inferior `pad-footer-bottom`) en aiTicketIt-front/src/components/ds/ActionFooter.tsx, según design-system.md § ActionFooter
- [X] T054 [P] [US3] Crear `Opiniones` en aiTicketIt-front/src/components/ds/Opiniones.tsx, según design-system.md § Rating "para mostrar" y contracts/rutas-front.md § Compradores 04:
  - Puntaje en 32px, nombre del organizador y `contadorResenas`.
  - Cada reseña con autor, `estrellas`, evento y comentario o "Sin comentario.".
  - **Ver más** secundario con `enviando` mientras carga, solo si hay `siguiente`.
  - Sin reseñas: nombre + "Todavía no tiene reseñas.".
- [X] T055 [US3] Completar aiTicketIt-front/src/app/(compradores)/eventos/[id].tsx (FR-012 a FR-016, FR-024):
  - `obtenerEvento(id)`.
  - `AppBar` con el título, `ImagenEvento`, Tag de categoría.
  - `Facts`: `fechaLarga`, `hora`, sala y `rangoDePrecios`.
  - Descripción y `Opiniones`, cuyo **Ver más** llama a `listarResenas(organizador.id, siguiente)` y agrega abajo; si falla, conserva lo cargado y muestra el aviso de conexión.
  - `ActionFooter` "Desde" + **Comprar** sin acción.
  - Con 404: AppBar con Volver, "Este evento no está disponible." y **Volver a Explorar**.
  - Al volver, Explorar conserva su estado (FR-015, research R11).

**Checkpoint**: US1–US3 completas: el flujo principal de la historia del usuario (explorar y ver el detalle) funciona de punta a punta.

---

## Phase 6: User Story 4 - El comprador ve qué eventos están agotados (Priority: P2)

**Goal**: un evento sin lugares en ningún tipo sigue en Explorar y muestra **Agotado** deshabilitado en la tarjeta y en el Detalle.

**Independent Test**: con todos los tipos de un evento con `vendidas = cupo`, la tarjeta y el footer muestran **Agotado** deshabilitado y el evento sigue listado (quickstart, variante del escenario 2).

### Tests for User Story 4 ⚠️

- [X] T056 [P] [US4] Tests de integración en aiTicketIt-back/tests/integration/agotado.test.js:
  - Poner `vendidas = cupo` en todos los tipos de Bodas de sangre con `eventosRepository`. `GET /compradores/eventos` lo sigue listando con `agotado` true y `precioDesde` 15000, y `GET /compradores/eventos/evt-3` trae `agotado` true y `disponibles` 0 en cada tipo.
  - Hamlet (solo VIP agotado) sigue con `agotado` false.

### Implementation for User Story 4

- [X] T057 [US4] Verificar que T056 pasa con el DTO de T019. Si falta algo, corregirlo en aiTicketIt-back/dto/eventoCompradorDto.js sin cambiar el contrato (data-model.md § Valores derivados, `agotado`).
- [X] T058 [P] [US4] En aiTicketIt-front/src/components/ds/EventCard.tsx, con `agotado` true mostrar **Agotado** con `disabled` (45%) en lugar de **Comprar** (FR-014)
- [X] T059 [P] [US4] En aiTicketIt-front/src/app/(compradores)/eventos/[id].tsx, el `ActionFooter` muestra **Agotado** con `disabled` si `agotado` es true; "Desde $ X" se mantiene (FR-014)

**Checkpoint**: Agotado se ve en la tarjeta y en el Detalle sin afectar a eventos con algún tipo disponible.

---

## Phase 7: User Story 5 - El comprador guarda eventos en Favoritos (Priority: P2)

**Goal**: corazón en EventCard, Detalle y Favoritos con estado consistente y guardado en el servicio; pantalla Favoritos con estado vacío.

**Independent Test**: marcar dos eventos desde Explorar y el Detalle, verlos en Favoritos, quitar uno desde Favoritos, cerrar sesión y volver a ingresar: queda el otro (quickstart escenarios 10–13).

### Tests for User Story 5 ⚠️

- [X] T060 [P] [US5] Tests unitarios de aiTicketIt-back/tests/unit/favoritosService.test.js (research R10):
  - `marcar` sobre un evento visible guarda; sobre uno oculto o inexistente lanza `EventoNoEncontrado`.
  - `desmarcar` es idempotente, incluso si el evento ya no es visible.
  - `listar` devuelve solo los favoritos visibles, ordenados por `fechaHora`.
  - Un favorito que pasa a Finalizado (con `fijarAhora` posterior) deja de listarse pero sigue guardado.
- [X] T061 [P] [US5] Tests de integración en aiTicketIt-back/tests/integration/favoritos.test.js:
  - `PUT /compradores/favoritos/evt-3` dos veces → 204 y 204; `GET /compradores/favoritos` → `[evt-3]` con la forma de `EventoCompradorResumen` y `esFavorito` true.
  - `GET /compradores/eventos` y `/compradores/eventos/evt-3` traen `esFavorito` true.
  - `DELETE` dos veces → 204 y 204, y la lista queda vacía.
  - `PUT` sobre evt-8 → 404.
  - Los favoritos de Sofía no aparecen para Martín (`MARTIN`).
  - Siguen después de cerrar sesión y volver a ingresar.
  - Sin sesión → 401.

### Implementation for User Story 5

- [X] T062 [US5] Implementar aiTicketIt-back/services/favoritosService.js con `marcar`, `desmarcar` y `listar`, usando `esVisibleParaCompradores` y `reloj.ahora()` para `marcadoEn` (data-model.md Favorito.marcadoEn). Hace pasar T060.
- [X] T063 [US5] Crear aiTicketIt-back/controllers/favoritosController.js y aiTicketIt-back/routes/favoritos.js (`requiereSesion("comprador")`; `GET /`, `PUT /:eventoId` y `DELETE /:eventoId` con 204), con su `@openapi` (tag "Favoritos"). Montarlo en `/compradores/favoritos` en aiTicketIt-back/app.js. Hace pasar T061.
- [X] T064 [US5] Crear `FavoritosProvider` en aiTicketIt-front/src/favoritos/FavoritosProvider.tsx (research R13):
  - `Map<eventoId, boolean>` que se alimenta con `registrar(eventos)` desde cada respuesta.
  - `esFavorito(id)` y `alternar(id)`, que cambia al instante y llama a `marcarFavorito` / `desmarcarFavorito`.
  - Mientras hay un pedido en curso, guarda el estado final y lo manda al terminar.
  - Si falla, revierte y expone el aviso "No pudimos conectarnos. Probá de nuevo en un rato.".

  Envolver el Stack protegido de aiTicketIt-front/src/app/(compradores)/_layout.tsx con el provider.
- [X] T065 [P] [US5] Crear `BotonFavorito` (`heart` / `heart-fill` en `color-accent-300`, área ≥ 44px, `accessibilityLabel` "Agregar a favoritos" / "Quitar de favoritos", `accessibilityState.selected`, toque sin propagar a la tarjeta) en aiTicketIt-front/src/components/ds/BotonFavorito.tsx, según contracts/rutas-front.md § BotonFavorito
- [X] T066 [P] [US5] Crear `FavoritoCard` (título, fecha corta, "Desde $ X", `BotonFavorito` lleno; toque → Detalle) en aiTicketIt-front/src/components/ds/FavoritoCard.tsx
- [X] T067 [US5] Conectar el corazón: `BotonFavorito` en la `accionSuperior` de `EventCard` dentro de aiTicketIt-front/src/app/(compradores)/(pestanas)/explorar.tsx y como acción de la `AppBar` en aiTicketIt-front/src/app/(compradores)/eventos/[id].tsx. Las dos pantallas registran `esFavorito` de sus respuestas en el provider y muestran su aviso de error (FR-019).
- [X] T068 [US5] Completar aiTicketIt-front/src/app/(compradores)/(pestanas)/favoritos.tsx (FR-021, FR-022):
  - Título "Favoritos" y `FlatList` de `FavoritoCard` con `listarFavoritos()`, recargada con `useFocusEffect` cada vez que la pestaña toma foco.
  - Al quitar un corazón, la tarjeta se va de la lista.
  - `EstadoVacio` "Todavía no guardaste eventos" / "Tocá el corazón en un evento para encontrarlo acá.".
  - Error de conexión con **Reintentar**.

**Checkpoint**: las cinco historias funcionan juntas.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T069 [P] Extender aiTicketIt-back/tests/integration/docs.test.js: `/docs.json` incluye `/compradores/eventos`, `/compradores/eventos/{id}`, `/compradores/organizadores/{id}/resenas`, `/compradores/favoritos` y `/compradores/favoritos/{eventoId}` con sus métodos, y los schemas `EventoCompradorResumen`, `EventoCompradorDetalle`, `Resena`, `PaginaDeEventos` y `PaginaDeResenas` (Principio IV)
- [X] T070 [P] Test de escala en aiTicketIt-back/tests/integration/escala.test.js (SC-007): con 1.000 eventos visibles y 1.000 reseñas de un organizador (helpers T020), `GET /compradores/eventos` devuelve 10 eventos y `total` 1000+, el Detalle trae 5 reseñas y `cantidadResenas` 1000, y cada pedido tarda menos de 200 ms
- [X] T071 [P] Actualizar CLAUDE.md:
  - Endpoints de la feature 003 (`/compradores/eventos`, `/compradores/organizadores/:id/resenas`, `/compradores/favoritos`), paginación por cursor y `validarQuery`.
  - Cuentas de ejemplo nuevas (`martin.perez@correo.com`, `lucia.fernandez@correo.com`, `diego.romero@correo.com`, `valentina.sosa@correo.com`).
  - Estructura del front: `(compradores)/(pestanas)/explorar` y `favoritos`, `(compradores)/eventos/[id]`, `FavoritosProvider` y `useListaPaginada`.
- [X] T072 Revisar que Explorar, Detalle y Favoritos usen solo tokens de aiTicketIt-front/src/theme/tokens.ts (sin colores, medidas ni radios sueltos), los textos exactos de contracts/rutas-front.md y áreas táctiles ≥ 44px
- [X] T073 Correr `npm test` en aiTicketIt-back y `npm run lint` + `npx tsc --noEmit` en aiTicketIt-front. Recorrer los 16 escenarios de specs/003-explorar-detalle-evento/quickstart.md (web en 390 px y, si es posible, en un teléfono) y completar su sección "Resultado de la validación" con lo encontrado.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 bloquea T010. T002 (diseño) bloquea todas las tareas de front (T021–T026 y las de front de cada historia).
- **Foundational (Phase 2)**: depende de Setup. Bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational.
- **US2 (Phase 4)**: depende de US1, porque completa `explorarService.listar`, la ruta `GET /compradores/eventos` y la pantalla Explorar.
- **US3 (Phase 5)**: el backend depende solo de Foundational (agrega `obtener` y las reseñas al mismo service y controller; si US1 todavía no está, crear esos archivos acá). En el front, la tarjeta que abre el Detalle es de US1.
- **US4 (Phase 6)**: depende de US1 (EventCard) y de US3 (ActionFooter del Detalle).
- **US5 (Phase 7)**: el backend depende solo de Foundational. En el front se conecta a las pantallas de US1 y US3.
- **Polish (Phase 8)**: después de las historias que se entreguen.

### Within Each User Story

- Los tests del backend se escriben y se ven fallar antes de la implementación (Principio II).
- Repositorios → servicios → DTO → controllers/rutas → front.
- `explorarService.js`, `eventosCompradorController.js`, `routes/eventosComprador.js`, `app.js`, `explorar.tsx`, `eventos/[id].tsx` y `EventCard.tsx` se tocan en varias historias: esas tareas van en secuencia, no en paralelo.

### Parallel Opportunities

- Setup: T001 y T002.
- Foundational: los tests T003–T008; después T012, T015–T018. En el front, T021–T025 en paralelo con todo el backend.
- US1: T027 y T028; T032 en paralelo con el backend.
- US2: T034–T036; en el front, T040–T043 mientras se implementa el backend.
- US3: T045–T047; en el front, T051–T054.
- US5: T060 y T061; T065 y T066 en paralelo con el backend.
- Con más de una persona: después de Foundational, el backend de US3 y el de US5 se pueden hacer en paralelo con US1/US2.

---

## Parallel Example: User Story 3

```bash
# Tests del back (primero, todos fallan):
Task: "T045 tests de resenasService en tests/unit/resenasService.test.js"
Task: "T046 tests de explorarService.obtener en tests/unit/explorarService.test.js"
Task: "T047 tests de GET /compradores/eventos/:id y /organizadores/:id/resenas en tests/integration/detalleEvento.test.js"

# Componentes del front (mientras se implementa el back):
Task: "T051 AppBar", "T052 Facts", "T053 ActionFooter", "T054 Opiniones"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2.
2. Phase 3 (US1): Explorar con los eventos visibles del seed.
3. **Validar**: quickstart escenarios 1, 2 y 6.

### Incremental Delivery

1. Setup + Foundational → base lista (compras, favoritos, seed, visibilidad, pestañas).
2. US1 → el comprador ve los eventos (MVP).
3. US2 → busca, filtra, ordena y carga de a 10.
4. US3 → ve el detalle con las opiniones de a 5: completa la historia pedida ("explorar y ver el detalle").
5. US4 → Agotado.
6. US5 → Favoritos.
7. Polish → docs, prueba de escala, CLAUDE.md, revisión de tokens y quickstart completo.
