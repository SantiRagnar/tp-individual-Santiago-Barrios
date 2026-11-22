---
description: "Lista de tareas de la feature 005: Panel del evento (organizadores)"
---

# Tasks: Panel del evento (organizadores)

**Input**: documentos de diseño en `specs/005-panel-evento/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml), [contracts/rutas-front.md](contracts/rutas-front.md), [quickstart.md](quickstart.md)

**Tests**: son obligatorios en el backend por la constitución (Principio II, TDD). Cada bloque "tests primero" se escribe y se ve fallar antes de su implementación. Todos los tests arrancan con `reiniciarEstado()` y, si dependen de "hoy", con `fijarAhora(...)` (`HOY` = 2026-11-09 en `tests/helpers/sesion.js`). El front no tiene tests automáticos: se valida con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Puertos de esta sesión** (research R11): el backend se levanta con `PORT=3005` y el front con `EXPO_PUBLIC_API_URL=http://localhost:3005 npx expo start --web --port 8085`. No se cambian los valores por defecto del código.

**Organization**: las tareas se agrupan por historia de usuario. Las fases siguen la prioridad: US1, US2 y US4 (P1), y después US3 (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia a la que pertenece (US1–US4).
- Las rutas son relativas a la raíz del repo: `aiTicketIt-back/` y `aiTicketIt-front/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: arrancar con la fecha simulada y dejar documentado lo que la clarificación agregó al diseño.

- [X] T001 Agregar la lectura de `FECHA_SIMULADA` en `aiTicketIt-back/index.js`. Si es una fecha ISO válida, llamar a `fijarAhora()` antes de `listen` e informarlo por consola; si es inválida, salir con un mensaje claro; sin la variable, nada cambia (research R9, igual que la feature 004).
- [X] T002 [P] Actualizar "Organizadores 04 · Detalle del evento" en `Diseño de AI Ticket It/pantallas.md` (Principio I):
  - Ventas de a 20 con **Ver más**, y al cambiar de chip se vuelve a empezar.
  - **Marcar utilizada** solo desde las 00:00 (hora de Argentina) del día del evento.
  - **Consultas del evento** sigue deshabilitado y sin contador hasta la feature de Consultas.
  - El seed de compras queda consistente con las vendidas.
  No hay componente ni pantalla nueva: StatCard, DataTable y `progress-lg` ya están en `design-system.md`. Por eso alcanza con actualizar el `.md`. Si el artifact "Diseño de sistema de dos apps" se sigue manteniendo, se le agrega la misma nota en Organizadores 04.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: errores, reglas, índice por evento, seed consistente, vista de venta y piezas comunes del front, que necesitan todas las historias.

**⚠️ CRITICAL**: ninguna historia puede empezar antes de terminar esta fase.

### Tests primero (deben fallar)

- [X] T003 [P] Tests unitarios de las reglas en `aiTicketIt-back/tests/unit/reglasVenta.test.js`:
  - `inicioDelDiaEnArgentina("2026-11-21T21:00:00-03:00")` → 2026-11-21T00:00:00-03:00; también un evento a las 00:30 −03:00 y uno con offset `Z`.
  - `esActiva` para los 5 estados (data-model.md § Compra · Valores derivados).
  - `puedeMarcarUtilizada`: Confirmada a las 23:59 del día anterior → false; a las 00:00 del día → true; una semana después → true; los otros 4 estados → false; evento sin `fechaHora` → false (research R4).
- [X] T004 [P] Tests unitarios del índice por evento en `aiTicketIt-back/tests/unit/comprasRepository.test.js` (se suma a los existentes):
  - `listarPorEvento` ordena por `[creadaEn desc, numero desc]`, filtra por `estado`, empieza después de `despuesDe` y respeta `limite`.
  - `todasDelEvento` devuelve solo las de ese evento.
  - `reiniciar()` vacía el índice y lo rearma desde el seed (data-model.md § Compra · Operaciones nuevas del repositorio).
- [X] T005 [P] Tests unitarios del seed en `aiTicketIt-back/tests/unit/seed.test.js`, con los invariantes 1 a 6 de data-model.md § Seed de compras:
  - Σ cantidad de compras activas = `vendidas` por tipo.
  - `monto = precio × cantidad` en las generadas.
  - `numero` único, todas las generadas entre `A-0100` y `A-0539`, y el mayor sigue siendo `A-1042`.
  - Ninguna generada tiene calificación.
  - `creadaEn` es anterior a la fecha del evento y a 2026-11-09.
  - `evt-8` no tiene compras.
  - Hay al menos una Cancelada o Reembolsada por evento futuro con ventas.
  - Las cuatro compras de Sofía están con sus datos exactos.
  - Conteos de Hamlet (`evt-1`): 62 compras, 51 Confirmadas, 9 Pendientes de pago, 1 Cancelada y 1 Reembolsada.
- [X] T006 [P] Tests unitarios de la vista en `aiTicketIt-back/tests/unit/ventaDto.test.js`:
  - `comprador.nombre` con nombre y apellido, o el email si falta el nombre.
  - `tipoDeEntrada` resuelto desde el evento, con nombre `null` si el tipo no tiene nombre.
  - `acciones.marcarUtilizada` según la regla (data-model.md § Venta).
  - No expone email cuando hay nombre, ni `compradorId`.
- [X] T007 [P] Tests unitarios del schema en `aiTicketIt-back/tests/unit/ventasSchema.test.js`:
  - `estado` ausente o vacío → `null`.
  - Cada uno de los 5 estados es válido; "Confirmadas" es inválido y da "Elegí un estado válido".
  - `cursor` string, con vacío → `null` (data-model.md § Validaciones de entrada).

### Implementación

- [X] T008 [P] Agregar `CompraNoEncontrada`, `CompraNoConfirmada` y `EventoNoComenzo` en `aiTicketIt-back/errors/ErrorDeDominio.js`, con el código, status y mensaje de data-model.md § Errores nuevos.
- [X] T009 [P] Crear `aiTicketIt-back/services/reglasVenta.js` con `inicioDelDiaEnArgentina`, `esActiva` y `puedeMarcarUtilizada(compra, evento, ahora)`. Las reglas de cada una están en data-model.md: `Compra.estado` (Confirmada → Utilizada) en § Compra · Transición nueva; `inicioDelDiaEnArgentina` y `esActiva` en § Compra · Valores derivados. Ver también research R4. Hace pasar T003.
- [X] T010 Agregar a `aiTicketIt-back/repository/comprasRepository.js`:
  - El índice `Map<eventoId, Compra[]>` con inserción ordenada en `guardar()`.
  - `listarPorEvento(eventoId, { estado, despuesDe, limite })` y `todasDelEvento(eventoId)`.
  - El vaciado del índice en `reiniciar()` (data-model.md § Compra · Operaciones nuevas; research R3).
  Hace pasar T004.
- [X] T011 Ampliar `aiTicketIt-back/repository/seed.js` (data-model.md § Comprador (seed) y § Seed de compras; research R8):
  - Compradores `cmp-6` a `cmp-15` en `compradoresSeed`, con el hash de desarrollo.
  - Las cuatro compras de Sofía con un helper `compra(...)` que no califica.
  - La función pura y exportada `generarVentasDeEjemplo(eventos, comprasBase)`, con el ciclo de cantidades, la rotación de compradores y medios, los estados por fecha según el índice por evento, las Canceladas y Reembolsadas extra, el `creadaEn` repartido y los números desde `A-0100` saltando los existentes.
  - `comprasSeed = [...base, ...generarVentasDeEjemplo(eventosSeed, base)]`.
  Hace pasar T005. Después correr toda la suite (`npm test`) para confirmar que los tests de las features 001 a 003 siguen en verde.
- [X] T012 [P] Crear `aiTicketIt-back/dto/ventaDto.js` con `aVentaDto(compra, { comprador, evento, ahora })`. Campos de data-model.md: `Venta.comprador.nombre` (nombre y apellido, o el email) y `Venta.tipoDeEntrada` (nombre que puede ser null) en § Venta; `Venta.acciones.marcarUtilizada` en § Compra · Valores derivados. Ver también research R7. Hace pasar T006.
- [X] T013 [P] Crear `aiTicketIt-back/schemas/ventasSchema.js` con el schema zod de los parámetros `estado` y `cursor` de data-model.md § Validaciones de entrada (`estado`: uno de los 5 estados; `cursor`: string opcional). `cursor` se arma igual que `cursor` en `schemas/explorarSchema.js`. Hace pasar T007.
- [X] T014 [P] Crear `aiTicketIt-front/src/api/ventas.ts` según [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml):
  - Tipos `EstadoCompra`, `MedioDePago`, `Venta`, `ResumenDeVentas` y `PaginaDeVentas`.
  - `listarVentas(token, eventoId, { estado, cursor, signal })` y `marcarUtilizada(token, eventoId, numero)`.
  - Las dos funciones pasan `token` y `tipo: 'organizador'` a `pedir()`.
- [X] T015 [P] Agregar en `aiTicketIt-front/src/lib/formato.ts`:
  - `numeroCompra(numero)` → "#A-1042".
  - `textoEntradasVendidas(n)` → "1 entrada vendida" / "N entradas vendidas".
  - `textoComprasActivas(n)` → "1 compra activa" / "N compras activas".
  - `entradasDeCompra(nombre, cantidad)` → "Platea × 2", o "Sin nombre × 2" si falta el nombre.

**Checkpoint**: reglas, repositorio, seed y DTO en verde; el resto de la suite sigue pasando.

---

## Phase 3: User Story 1 - El organizador ve la disponibilidad y lo recaudado (Priority: P1) 🎯 MVP

**Goal**: al abrir el panel de un evento propio se ven la Disponibilidad por tipo de entrada y la StatCard Recaudado.

**Independent Test**: ingresar con `produccion@latrama.com.ar`, abrir Hamlet en el Galpón y verificar:

- Las tres barras: General 66/150, Platea 68/80 y VIP 20/20 "Agotada".
- "$ 2.536.000" y "154 entradas vendidas · 60 compras activas".

Son los escenarios 1 a 3, 9 y 10 del quickstart.

### Tests primero (deben fallar)

- [X] T016 [P] [US1] Tests unitarios de `resumen(evento)` en `aiTicketIt-back/tests/unit/ventasService.test.js` (data-model.md § Resumen de ventas):
  - Hamlet: `recaudado` 2.536.000, `entradasVendidas` 154, `comprasActivas` 60 y `porEstado` de T005.
  - Borrador `evt-8`: todo en 0.
  - Tipo con `precio` `null`: aporta 0.
- [X] T017 [P] [US1] Test de integración `aiTicketIt-back/tests/integration/panelDisponibilidad.test.js`:
  - `GET /organizadores/eventos/evt-1` sigue devolviendo `vendidas` y `disponibles` por tipo (VIP con `disponibles` 0).
  - `GET /organizadores/eventos/evt-1/ventas` responde 200 con el `resumen` de Hamlet.
  - Para `evt-8` el resumen viene en cero y `ventas` vacío.
  - La respuesta cumple `PaginaDeVentas` de [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml).

### Implementación

- [X] T018 [US1] Crear `aiTicketIt-back/services/ventasService.js` con `resumen(evento)` (research R2) y `pagina(organizadorId, eventoId, { estado, cursor })`. Por ahora `pagina` resuelve el evento con `eventosService.obtener` y devuelve `{ resumen, compras }` con las primeras 20 de `listarPorEvento`. El filtro y el cursor se completan en US2. Hace pasar T016.
- [X] T019 [US1] Crear `aiTicketIt-back/controllers/ventasController.js` con `listar(req, res)`. Toma `req.sesion.usuario.id`, `req.params.id` y `req.query`, y arma cada fila con `aVentaDto` (con comprador desde `compradoresRepository` y `ahora()`).
- [X] T020 [US1] Registrar `router.get("/:id/ventas", validarQuery(ventasSchema), ventasController.listar)` en `aiTicketIt-back/routes/eventosOrganizador.js`. Copiar el bloque `@openapi` del path `GET /organizadores/eventos/{id}/ventas` y los schemas `EstadoCompra`, `MedioDePago`, `Venta`, `ResumenDeVentas` y `PaginaDeVentas` de [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml). Hace pasar T017.
- [X] T021 [P] [US1] Agregar la prop `variante?: 'fino' | 'lg'` a `aiTicketIt-front/src/components/ds/ProgressBar.tsx`. `lg` mide 10px y usa degradé `accent-700` → `accent` como `backgroundImage` en web, y `accent` plano en nativo. El riel es `neutral-900`. Solo tokens de `src/theme/tokens.ts` (research R10).
- [X] T022 [P] [US1] Crear `aiTicketIt-front/src/components/ds/StatCard.tsx` con las props `kicker`, `cifra` y `aclaracion`. La cifra va en `type-stat` con números tabulares y el kicker en estilo `type-kicker` (design-system.md § StatCard).
- [X] T023 [P] [US1] Crear `aiTicketIt-front/src/components/ds/DisponibilidadTipo.tsx` según [contracts/rutas-front.md](contracts/rutas-front.md) § Organizadores 04, punto 2:
  - "{nombre} · {$ precio}", con "Sin nombre" si falta el nombre y sin precio si es `null`.
  - `ProgressBar` variante `lg`.
  - "Quedan N" o "Agotada", y "{vendidas} / {cupo} vendidas" tabular. Sin cupo (`TipoDeEntrada.cupo` null): ni "Quedan" ni "Agotada", solo "0 / 0 vendidas" y la barra vacía.
- [X] T024 [US1] Ampliar `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx`:
  - Conservar la cabecera y sus estados (cargando, 404 y error).
  - Agregar la fila superior con la sección "Disponibilidad por tipo de entrada" (un `DisponibilidadTipo` por tipo, en orden) y la `StatCard` "Recaudado", con el `resumen` de `listarVentas`.
  - Las dos columnas se apilan en pantallas chicas.
  - Mientras cargan las ventas, `ActivityIndicator` en la StatCard; si falla la red, aviso de conexión + **Reintentar** solo en esa zona (rutas-front.md § Estados de la pantalla).
  - Recargar al recibir foco.

**Checkpoint**: el panel muestra disponibilidad y Recaudado; los escenarios 1 a 3, 9 y 10 del quickstart pasan con el backend en 3005 y el front en 8085.

---

## Phase 4: User Story 2 - El organizador revisa las ventas del evento (Priority: P1)

**Goal**: la tabla de Ventas con chips por estado y contador, cargada de a 20 con **Ver más**.

**Independent Test**: Edipo Rey lista sus compras (entre ellas #A-0655 de Sofía Gómez); con el chip **Utilizadas** de Hamlet se ve "No hay ventas con este estado."; en Hamlet, **Ver más** llega a 62 filas. Son los escenarios 4 a 8 del quickstart.

### Tests primero (deben fallar)

- [X] T025 [P] [US2] Sumar a `aiTicketIt-back/tests/unit/ventasService.test.js` los tests de `pagina` (research R3):
  - Devuelve 20 compras y `siguiente`, y con 21 pide una de más.
  - La última página trae `siguiente` `null`.
  - Filtra por `estado`: con `Pendiente de pago`, Hamlet devuelve 9.
  - Un cursor inválido o de otra forma lanza `DatosInvalidos` con el campo `cursor`.
  - Recorrer todas las páginas no repite ni salta compras.
  - El orden es `[creadaEn desc, numero desc]`.
- [X] T026 [P] [US2] Test de integración `aiTicketIt-back/tests/integration/panelVentas.test.js`:
  - Las filas tienen la forma `Venta` del contrato. A-1042 sale con "Sofía Gómez", Platea × 2, Confirmada, Tarjeta de crédito y 36000.
  - Orden de la más reciente a la más antigua.
  - `porEstado` de Hamlet.
  - `?estado=Utilizada` en Hamlet → `ventas` vacío y `porEstado` sin cambios.
  - `?estado=Confirmadas` → 400 `DATOS_INVALIDOS` con el campo `estado`.
  - Recorrer con `siguiente` da 20 + 20 + 20 + 2 = 62 números únicos.
  - Con `cursor=xyz` → 400 con el campo `cursor`.

### Implementación

- [X] T027 [US2] Completar `pagina` en `aiTicketIt-back/services/ventasService.js` (research R3):
  - Decodificar el cursor con `cursor.js` (clave `[string, string]`), filtrar por `estado` y pedir `TAMANO_PAGINA_VENTAS + 1` (20 + 1).
  - Devolver `{ resumen, compras, siguiente }`, con `siguiente = codificar([creadaEn, numero])` de la última compra devuelta.
  Hace pasar T025.
- [X] T028 [US2] Hacer que `listar` en `aiTicketIt-back/controllers/ventasController.js` responda `{ resumen, ventas, siguiente }` con el `siguiente` del servicio. Hace pasar T026.
- [X] T029 [P] [US2] Agregar `TagEstadoCompra` en `aiTicketIt-front/src/components/ds/Tag.tsx`: Tag con ícono y una variante por estado de compra (Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada), solo con tokens (design-system.md § Tag y § DataTable). Si al mergear la 004 ya existe, se queda una sola versión.
- [X] T030 [P] [US2] Crear `aiTicketIt-front/src/components/ds/TablaVentas.tsx` (DataTable), según rutas-front.md § Organizadores 04, punto 3:
  - Encabezado en mayúsculas 11px muted: Número, Comprador, Entradas, Estado, Medio de pago, Monto, Acciones.
  - Filas `type-body-sm` separadas por una línea que se desvanece.
  - Número y monto tabulares; monto y acciones alineados a la derecha.
  - Recibe `ventas` y `onMarcarUtilizada(numero)`, y un `numeroEnCurso` para deshabilitar el botón de esa fila. En Acciones, **Marcar utilizada** (secundario chico) solo si `acciones.marcarUtilizada`.
- [X] T031 [US2] En `aiTicketIt-front/src/hooks/useListaPaginada.ts`:
  - Exponer `cargarMas()` para llamarlo desde un botón, además del uso por scroll que ya hace Explorar.
  - Exponer `reemplazar(id, item)` y `quitar(id)`, que modifican los items sin volver a pedir.
  - Exponer `recargar()`.
  - Mantener intacto el comportamiento que usan Explorar y las reseñas.
- [X] T032 [US2] Agregar la sección "Ventas" en `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx`:
  - `FilaDeChips` con Todas, Confirmadas, Pendientes, Utilizadas, Canceladas y Reembolsadas, cada uno con su contador de `resumen.porEstado`. El chip envía el `estado` exacto.
  - `useListaPaginada` con `clave = estado` e `id = numero`. Pide con `listarVentas` y actualiza el `resumen` en cada página.
  - `TablaVentas`, y **Ver más** (secundario) si hay `siguiente`, con un indicador mientras carga.
  - Si falla una página siguiente, aviso de conexión + **Reintentar** al pie, y las filas cargadas quedan.
  - Vacío: "No hay ventas con este estado.".

**Checkpoint**: US1 y US2 funcionan juntas; los escenarios 4 a 8 del quickstart pasan.

---

## Phase 5: User Story 4 - El organizador solo accede a los paneles de sus eventos (Priority: P1)

**Goal**: ni el panel ni las ventas de un evento ajeno o inexistente exponen datos.

**Independent Test**: con la sesión de La Trama, abrir `/organizadores/eventos/evt-2` y ver "No encontramos el evento." (escenarios 15 y 16 del quickstart).

### Tests primero (deben fallar o confirmar el comportamiento)

- [X] T033 [P] [US4] Test de integración `aiTicketIt-back/tests/integration/panelPropiedad.test.js`:
  - `GET /organizadores/eventos/evt-2/ventas` con la sesión de La Trama → 404 `EVENTO_NO_ENCONTRADO`, sin `resumen` ni `ventas`. Lo mismo con `evt-999`.
  - Sin token → 401 `SESION_INVALIDA`.
  - Con token de comprador → 401.
  - `POST /organizadores/eventos/evt-2/ventas/<numero de evt-2>/utilizacion` con la sesión de La Trama → 404 `EVENTO_NO_ENCONTRADO`, y la compra no cambia.

### Implementación

- [X] T034 [US4] Confirmar que `pagina` en `aiTicketIt-back/services/ventasService.js` resuelve el evento con `eventosService.obtener(organizadorId, eventoId)` antes de leer compras (research R6), y corregirlo si T033 falla. El `router.use(requiereSesion("organizador"))` ya cubre los dos endpoints.
- [X] T035 [US4] Verificar en `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx` que un 404 del evento muestra "No encontramos el evento." + link a Mis eventos, sin pedir ventas. Si `listarVentas` responde 404, la pantalla pasa al mismo estado "no-encontrado" (rutas-front.md § Estados de la pantalla).

**Checkpoint**: todas las historias P1 funcionan y la propiedad está cubierta en los dos endpoints.

---

## Phase 6: User Story 3 - El organizador marca una entrada como utilizada (Priority: P2)

**Goal**: **Marcar utilizada** pasa una compra Confirmada a Utilizada desde el día del evento, y actualiza la fila, los chips y Recaudado sin recargar la lista.

**Independent Test**: con `FECHA_SIMULADA=2026-11-21T20:00:00-03:00`, marcar una Confirmada de Hamlet y ver que la fila pasa a Utilizada, que Confirmadas baja 1 y Utilizadas sube 1, y que el botón desaparece. Son los escenarios 11 a 14 del quickstart.

### Tests primero (deben fallar)

- [X] T036 [P] [US3] Sumar a `aiTicketIt-back/tests/unit/ventasService.test.js` los tests de `marcarUtilizada(organizadorId, eventoId, numero)` (data-model.md § Compra · Transición nueva; research R5, R6):
  - Salvo que se indique otra cosa, cada caso fija `fijarAhora("2026-11-21T00:00:00-03:00")` (el día de Hamlet).
  - OK: devuelve `{ compra, resumen }` con Confirmada 50 y Utilizada 1 en Hamlet, y no devuelve una `Promise`.
  - Ya Utilizada → `CompraNoConfirmada`.
  - Pendiente de pago → `CompraNoConfirmada`.
  - El día anterior, con `fijarAhora("2026-11-20T23:59:00-03:00")` → `EventoNoComenzo`.
  - Número inexistente → `CompraNoEncontrada`.
  - Compra de otro evento del mismo organizador (A-0655 de `evt-7` pedida en `evt-1`) → `CompraNoEncontrada`.
  - Evento ajeno → `EventoNoEncontrado`.
  - `vendidas` no cambia.
- [X] T037 [P] [US3] Test de integración `aiTicketIt-back/tests/integration/marcarUtilizada.test.js`:
  - Con `fijarAhora("2026-11-21T00:00:00-03:00")`, `POST /organizadores/eventos/evt-1/ventas/A-1042/utilizacion` → 200 con `venta.estado` Utilizada, `venta.acciones.marcarUtilizada` false y el `resumen` actualizado.
  - Un segundo POST → 409 `COMPRA_NO_CONFIRMADA`.
  - Con `fijarAhora("2026-11-20T23:59:00-03:00")` → 409 `EVENTO_NO_COMENZO`.
  - En `GET …/ventas` con `fijarAhora(HOY)`, ninguna fila de `evt-1` tiene `acciones.marcarUtilizada`; con la fecha del evento, las Confirmadas sí.
  - Después de marcar, `comprasRepository.buscarPorNumero("A-1042").estado` es `Utilizada` (FR-015). Ver la compra en Mis compras es de la feature 004.

### Implementación

- [X] T038 [US3] Agregar `marcarUtilizada(organizadorId, eventoId, numero)` en `aiTicketIt-back/services/ventasService.js`. Es sincrónica, sin `await`, y sigue este orden: `eventosService.obtener` → `buscarPorNumero` y `compra.eventoId === eventoId` → `estado === "Confirmada"` → `puedeMarcarUtilizada` por fecha → `compra.estado = "Utilizada"`. La transición de `Compra.estado` y el orden de verificación están en data-model.md § Compra · Transición nueva. Devuelve `{ compra, resumen }`. Hace pasar T036.
- [X] T039 [US3] Agregar `marcarUtilizada(req, res)` en `aiTicketIt-back/controllers/ventasController.js`, que responde `{ venta: aVentaDto(...), resumen }`. Registrar `router.post("/:id/ventas/:numero/utilizacion", ventasController.marcarUtilizada)` en `aiTicketIt-back/routes/eventosOrganizador.js`, con el bloque `@openapi` del path `POST …/utilizacion` de [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml). Hace pasar T037.
- [X] T040 [US3] Conectar **Marcar utilizada** en `aiTicketIt-front/src/app/organizadores/eventos/[id]/index.tsx` (rutas-front.md § Marcar utilizada):
  - Mientras espera, deshabilitar el botón de esa fila con `numeroEnCurso`.
  - **200**: `reemplazar(numero, venta)`, o `quitar(numero)` si el chip activo es Confirmadas. Actualizar chips y StatCard con el `resumen` de la respuesta, sin recargar.
  - **409**: aviso inline sobre la tabla con el `mensaje` del servidor y `recargar()`.
  - **404**: recargar la pantalla.
  - **Error de red**: "No pudimos conectarnos. Probá de nuevo en un rato." y la fila queda como estaba.

**Checkpoint**: las cuatro historias funcionan; los escenarios 11 a 14 y 17 del quickstart pasan.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T041 Sumar a `aiTicketIt-back/tests/integration/docs.test.js` la verificación de que `/docs.json` incluye `/organizadores/eventos/{id}/ventas` (get) y `/organizadores/eventos/{id}/ventas/{numero}/utilizacion` (post), con el tag "Ventas del evento".
- [X] T042 [P] Actualizar `CLAUDE.md` con un párrafo de **Endpoints del panel del evento (feature 005)**:
  - Los dos endpoints, el resumen, los 20 por página y la regla del día del evento en `services/reglasVenta.js`.
  - El índice por evento en `comprasRepository` y el seed generado con `generarVentasDeEjemplo`.
  - Los compradores `cmp-6` a `cmp-15`.
  - `FECHA_SIMULADA`.
  - En la estructura del front, los componentes nuevos (`StatCard`, `DisponibilidadTipo`, `TablaVentas`, `TagEstadoCompra`) y `src/api/ventas.ts`.
- [X] T043 Correr `npm test` en `aiTicketIt-back/`, y `npm run lint` y `npx tsc --noEmit` en `aiTicketIt-front/` (antes, `npx expo start` una vez si cambiaron rutas tipadas). Corregir todo hasta que quede en verde.
- [X] T044 Validación manual con [quickstart.md](quickstart.md), con el backend en `PORT=3005` y el front en el 8085 apuntando a ese backend. Recorrer los escenarios 1 a 17 (el 13 con `FECHA_SIMULADA`) y revisar tokens, textos y estados vacío, deshabilitado y error contra el design system.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias. T001 y T002 son independientes.
- **Foundational (Phase 2)**: después de Setup. Bloquea todas las historias.
  - Tests T003 a T007 en paralelo.
  - T008, T009, T012, T013, T014 y T015 en paralelo.
  - T010 antes de T011: el seed usa `guardar()` con el índice.
  - T012 depende de T009.
- **US1 (Phase 3)**: después de Foundational. Es el MVP.
- **US2 (Phase 4)**: depende de US1, porque completa el mismo servicio, controller y pantalla.
- **US4 (Phase 5)**: depende de US1 (endpoint GET). Se puede hacer en paralelo con US2, salvo T035, que toca la misma pantalla.
- **US3 (Phase 6)**: depende de US2, porque usa `TablaVentas` y los métodos del hook de T031.
- **Polish (Phase 7)**: después de todas las historias.

### Within Each User Story

- Los tests se escriben y se ven fallar antes de la implementación (Principio II).
- En el backend: servicio → controller → ruta con `@openapi`.
- En el front: componentes del design system → pantalla.

### Parallel Opportunities

- Phase 2: los cinco archivos de tests (T003 a T007) y luego T008, T009, T012 a T015 son archivos distintos.
- US1: T016 y T017 en paralelo; T021, T022 y T023 (componentes del front) en paralelo con el backend T018 a T020.
- US2: T029 y T030 en paralelo con T027 y T028.
- US3: T036 y T037 en paralelo.

---

## Parallel Example: User Story 1

```text
# Tests primero, en paralelo:
T016 tests unitarios de resumen en tests/unit/ventasService.test.js
T017 test de integración en tests/integration/panelDisponibilidad.test.js

# Componentes del front mientras se implementa el backend:
T021 ProgressBar variante lg
T022 StatCard
T023 DisponibilidadTipo
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 y Phase 2. El seed consistente y el índice son la base de todo.
2. Phase 3 (US1): el panel ya muestra cómo viene la venta.
3. Validar con los escenarios 1 a 3, 9 y 10 del quickstart (backend en 3005, front en 8085).

### Incremental Delivery

1. US1: disponibilidad y Recaudado.
2. US2: tabla de Ventas con chips y **Ver más**.
3. US4: propiedad verificada en los dos endpoints.
4. US3: **Marcar utilizada**.
5. Polish: docs, CLAUDE.md y quality gates.

### Coordinación con la feature 004

Al mergear la 004, hay que conciliar `seed.js`, `comprasRepository.js`, `ErrorDeDominio.js`, `index.js` y `Tag.tsx`. Después hay que volver a correr `seed.test.js` (T005) y la suite completa (plan.md § Riesgos y coordinación).
