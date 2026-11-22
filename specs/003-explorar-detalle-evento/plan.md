# Implementation Plan: Explorar y detalle de evento (compradores)

**Branch**: `Feature/003-explorar-detalle-evento` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-explorar-detalle-evento/spec.md`

## Summary

El comprador explora los eventos visibles (Publicados y futuros) en Compradores 02, con búsqueda sin mayúsculas ni tildes, chips de categoría, orden por fecha, precio o puntaje y carga de a 10 al llegar al final. Abre el Detalle (Compradores 04) con facts, descripción y opiniones sobre el organizador, que se cargan de a 5 con **Ver más**. Marca favoritos con el corazón y los ve en Compradores 11.

En el backend se agrega un router `/compradores` con eventos, reseñas y favoritos. La visibilidad se decide en una sola regla de servicio. La paginación es por cursor, para que no se repitan ni salteen elementos. Se agrega un modelo mínimo de `Compra` que guarda la calificación, con un índice por organizador para que el puntaje no recorra todas las compras. Favoritos usa `PUT`/`DELETE` idempotentes.

En el front, Explorar y Favoritos pasan a ser pestañas (`Tabs` + BottomNav) debajo del Stack de compradores. Así el Detalle se apila arriba y al volver se conserva el estado. Se suman los componentes del design system que faltan. Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Backend: JavaScript (ES modules) sobre Node.js 26. Front: TypeScript ~6.0, React 19.3 / React Native 0.88 (Expo SDK 58). Sin cambios respecto de las features 001 y 002.

**Primary Dependencies**:
- Backend: Express 5, zod 4, swagger-jsdoc, supertest. **Sin dependencias nuevas.**
- Front: expo-router (`Tabs`, ya incluido), `phosphor-react-native` (ya instalado). **Sin dependencias nuevas.** La lista infinita usa `FlatList` (R12).

**Storage**: en memoria, en `repository/`. Se agregan dos repositorios:
- `comprasRepository`: compras con calificación, más un índice por organizador con el acumulado (R8).
- `favoritosRepository`: `Map` por comprador (R10).

El seed suma 4 compradores, 1 evento pasado y 9 compras calificadas (R17). Todo se reinicia con `reiniciarRepositorios()`.

**Testing**: backend con `node:test` + supertest y TDD obligatorio.
- Unitarios: visibilidad, búsqueda normalizada, orden y desempate, cursor (codificar, decodificar, inválido), página de eventos, resumen y página de reseñas del repositorio, DTO (precioDesde, precioHasta, agotado, autor, puntaje redondeado), favoritos (idempotencia, evento oculto) y `explorarSchema`.
- Integración, un archivo por historia: `explorar.test.js` (US1 + US2, con paginación de más de 10 eventos), `detalleEvento.test.js` (US3, incluida la paginación de 12 reseñas), `agotado.test.js` (US4), `favoritos.test.js` (US5), más `docs.test.js` con los paths nuevos.
- Front: `npm run lint` + `npx tsc --noEmit` y la validación manual de [quickstart.md](quickstart.md).

**Target Platform**: app de compradores para mobile (390 × 844, iOS/Android con Expo) y usable en web sin scroll horizontal. Backend Node en local.

**Project Type**: app mobile + web (un front Expo con dos apps) más una API REST monolítica.

**Performance Goals**:
- La primera página de Explorar y el Detalle responden en menos de 200 ms con el seed.
- Con 1.000 eventos y 1.000 reseñas por organizador, nunca viajan más de 10 eventos ni 5 reseñas por pedido. La primera pantalla se ve en menos de 2 s (SC-007).
- Cambiar filtro u orden actualiza la lista en menos de 1 s percibido (SC-003).

**Constraints**:
- Un evento no visible nunca se expone a compradores, ni pidiéndolo directo (SC-002, R2, R3).
- El puntaje y el contador de reseñas siempre reflejan el total, no lo cargado (FR-024).
- No se repiten elementos al paginar (R4, R9).
- UI solo con tokens del design system.
- **Comprar** no tiene acción en esta feature (FR-009).

**Scale/Scope**:
- Backend: 6 endpoints nuevos, 2 repositorios nuevos, 1 modelo nuevo (`Compra`).
- Front: 3 pantallas (Explorar completa, Favoritos y Detalle nuevas), unos 12 componentes del design system nuevos y 1 provider.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Compradores 02, 04, 11 y la BottomNav. Textos, componentes y formatos salen de `pantallas.md` y `design-system.md` (EventCard, Chip, SegmentedControl, AppBar, ActionFooter, facts, Rating para mostrar, BottomNav) y están en [rutas-front.md](contracts/rutas-front.md). Lo que el diseño no definía se resolvió con `/speckit-clarify`: reseñas de ejemplo, evento no disponible, organizador sin reseñas, **Ver más** y la carga por partes. Esos estados se documentan **primero** en `pantallas.md` (tarea previa a cualquier tarea de front, R15). **Ver más** usa el Button secundario existente, sin componentes inventados. | ✅ (con la tarea de diseño) |
| **II. Test-First en el backend** | En las tareas, los tests van antes que el código. Unitarios de cada regla de `services/` (visibilidad, búsqueda, orden, cursor, reseñas, favoritos) y del DTO. Integración de los 6 endpoints con 200, 204, 400 (orden, categoría, cursor), 401 (sin sesión y con token de organizador) y 404 (oculto, inexistente, organizador inexistente). | ✅ (lo hace cumplir `/speckit-tasks`) |
| **III. Backend monolito por capas** | `routes/eventosComprador.js` y `favoritos.js` → `controllers/` → `services/explorarService.js`, `resenasService.js`, `favoritosService.js`, `visibilidadEvento.js`, `cursor.js` → `repository/` (eventos, compras, favoritos, organizadores, compradores) → `models/Compra.js`. DTO en `dto/eventoCompradorDto.js`, forma en `schemas/explorarSchema.js`, error nuevo `OrganizadorNoEncontrado`. `middlewares/validarQuery.js` es hermano de `validar` y usa el mismo formato de error. No hay procesos ni capas nuevas. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/compradores.openapi.yaml](contracts/compradores.openapi.yaml) se copia a `@openapi` en las rutas. `docs.test.js` verifica los paths nuevos. | ✅ |
| **V. Español** | Entidades `Compra`, `Calificacion` y `Favorito`; campos `precioDesde`, `agotado`, `esFavorito`, `puntaje`, `cantidadResenas`, `siguiente`; estados de compra con sus nombres exactos; rutas `/compradores/eventos`, `/compradores/favoritos` y `/compradores/organizadores/{id}/resenas`. Los términos en inglés se limitan a `cursor` y `base64url`. | ✅ |
| **Stack y persistencia** | En memoria, en `repository/`, con seed y `reiniciar()`. Sin dependencias nuevas. | ✅ |
| **Flujo** | Rama `Feature/003-explorar-detalle-evento`. Quality gates: tests, lint, `tsc` y `/docs`. | ✅ |

**Re-check post-diseño (Phase 1)**: sin violaciones nuevas. Hay dos cambios en código existente con impacto compartido:
1. `seed.js` suma `evt-9`, así que se actualizan los tests de la feature 002 que esperan `evt-9` para un evento recién creado (pasan a `evt-10`) y la lista de eventos de Club del Chiste (R17).
2. `pedir()` acepta un `signal` opcional (R12). Es un cambio compatible.

## Project Structure

### Documentation (this feature)

```text
specs/003-explorar-detalle-evento/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── compradores.openapi.yaml
│   └── rutas-front.md
├── checklists/requirements.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
Diseño de AI Ticket It/
└── pantallas.md                        # + estados de Compradores 02/04/11 que el diseño no tenía (R15)

aiTicketIt-back/
├── app.js                              # + routers /compradores/eventos, /compradores/organizadores, /compradores/favoritos
├── routes/
│   ├── eventosComprador.js             # NUEVO: GET eventos, GET eventos/:id, GET organizadores/:id/resenas (@openapi)
│   └── favoritos.js                    # NUEVO: GET, PUT /:eventoId, DELETE /:eventoId (@openapi)
├── controllers/
│   ├── eventosCompradorController.js   # NUEVO
│   └── favoritosController.js          # NUEVO
├── services/
│   ├── visibilidadEvento.js            # NUEVO: esVisibleParaCompradores (R2)
│   ├── explorarService.js              # NUEVO: listar (filtro, orden, cursor), obtener (R4–R6)
│   ├── resenasService.js               # NUEVO: resumen y página por organizador (R8, R9)
│   ├── favoritosService.js             # NUEVO: marcar, desmarcar, listar (R10)
│   └── cursor.js                       # NUEVO: codificar/decodificar claves opacas (base64url)
├── repository/
│   ├── comprasRepository.js            # NUEVO: Map + índice por organizador (R8)
│   ├── favoritosRepository.js          # NUEVO
│   ├── imagenes-seed/sotano.png        # NUEVO (R17)
│   ├── seed.js                         # + compradores cmp-2..5, evt-9, comprasSeed (R17)
│   └── index.js                        # reiniciarRepositorios() suma compras y favoritos
├── models/
│   └── Compra.js                       # NUEVO (incluye Calificacion)
├── dto/
│   └── eventoCompradorDto.js           # NUEVO: resumen, detalle, reseña (R18)
├── schemas/
│   └── explorarSchema.js               # NUEVO: busqueda, categoria, orden, cursor
├── middlewares/
│   └── validarQuery.js                 # NUEVO: como validar, sobre req.query
├── errors/
│   └── ErrorDeDominio.js               # + OrganizadorNoEncontrado
└── tests/
    ├── helpers/compradores.js          # NUEVO: crear eventos visibles y compras calificadas extra
    ├── unit/
    │   ├── visibilidadEvento.test.js
    │   ├── explorarService.test.js
    │   ├── cursor.test.js
    │   ├── resenasService.test.js
    │   ├── comprasRepository.test.js
    │   ├── favoritosService.test.js
    │   ├── eventoCompradorDto.test.js
    │   └── explorarSchema.test.js
    └── integration/
        ├── explorar.test.js            # US1 + US2 (+ paginación)
        ├── detalleEvento.test.js       # US3 (+ Ver más)
        ├── agotado.test.js             # US4
        ├── favoritos.test.js           # US5
        ├── docs.test.js                # + paths nuevos
        ├── crearEvento.test.js         # evt-9 → evt-10 (R17)
        └── misEventos.test.js          # Club del Chiste: + evt-9 (R17)

aiTicketIt-front/src/
├── app/(compradores)/
│   ├── _layout.tsx                     # + (pestanas) y eventos/[id] en Stack.Protected; envuelve en FavoritosProvider
│   ├── (pestanas)/
│   │   ├── _layout.tsx                 # NUEVO: Tabs con tabBar = BottomNav (R11)
│   │   ├── explorar.tsx                # MOVIDO y completado: Compradores 02
│   │   └── favoritos.tsx               # NUEVO: Compradores 11
│   └── eventos/
│       └── [id].tsx                    # NUEVO: Compradores 04
├── api/
│   ├── cliente.ts                      # + opción signal (R12)
│   └── compradores.ts                  # NUEVO: listarEventos, obtenerEvento, listarResenas, favoritos
├── favoritos/
│   └── FavoritosProvider.tsx           # NUEVO (R13)
├── hooks/
│   └── useListaPaginada.ts             # NUEVO: cursor, cancelación, descarte de respuestas viejas y repetidos (R12)
├── lib/
│   └── formato.ts                      # + fechaLarga, hora, rangoDePrecios, puntaje, estrellas, contadores (R16)
└── components/ds/
    ├── EventCard.tsx                   # NUEVO
    ├── ImagenEvento.tsx                # NUEVO: imagen o espacio neutro
    ├── BotonFavorito.tsx               # NUEVO
    ├── Chip.tsx                        # NUEVO (+ FilaDeChips con scroll horizontal)
    ├── SegmentedControl.tsx            # NUEVO
    ├── BottomNav.tsx                   # NUEVO
    ├── AppBar.tsx                      # NUEVO
    ├── ActionFooter.tsx                # NUEVO
    ├── Facts.tsx                       # NUEVO
    ├── Opiniones.tsx                   # NUEVO: Rating para mostrar + Ver más
    ├── FavoritoCard.tsx                # NUEVO
    └── EstadoVacio.tsx                 # NUEVO
```

**Structure Decision**: se mantienen los dos proyectos. El backend agrega un módulo de lectura para compradores (eventos y reseñas) y uno de favoritos, con las mismas capas que la feature 002. El front reorganiza el lado compradores en pestañas dentro del Stack existente. Las URLs no cambian.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Paginación por cursor en lugar de offset (R4, R9) | La spec exige no repetir ni saltear elementos cuando cambian los datos entre páginas, y la clarificación pide un diseño que escale. | Offset/limit repite o saltea elementos cuando se publica o califica algo entre dos pedidos. |
| Índice de calificaciones por organizador en `comprasRepository` (R8) | El puntaje se muestra en cada tarjeta y se usa para ordenar; sin índice, cada pedido recorre todas las compras. | Calcularlo en cada pedido no cumple SC-007 con muchos datos. |
| Modelo `Compra` antes de la feature de compra (R7) | La clarificación 1 pide reseñas respaldadas por compras Utilizadas, y el design system guarda la calificación en la compra. | Una entidad de reseña suelta se descartó en la clarificación (opción C) y habría que migrarla después. |
