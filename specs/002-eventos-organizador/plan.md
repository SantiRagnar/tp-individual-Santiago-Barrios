# Implementation Plan: Mis eventos, crear y editar evento (organizadores)

**Branch**: `Feature/002-eventos-organizador` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-eventos-organizador/spec.md`

## Summary

El organizador ve sus eventos en Mis eventos (Organizadores 02), crea uno nuevo o edita uno existente con el formulario con vista previa (Organizadores 03) y llega a una versión mínima del Detalle del evento (Organizadores 04). En el backend se agregan los eventos con sus tipos de entrada, material multimedia (solo nombres) e imagen (subida real, en memoria). El estado Finalizado se deriva de la fecha con un reloj inyectable. Las reglas para publicar y las de tipos con ventas viven en `services/` y se validan siempre en el servidor. El front suma los componentes del design system que faltan (EventManageCard, ProgressBar, Tag, Dropzone, TicketTypeEditor, EventPreview, Select, CampoFechaHora) y tres rutas nuevas dentro del `Stack.Protected` de organizadores. Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**: Backend: JavaScript (ES modules) sobre Node.js 26. Front: TypeScript ~6.0, React 19.3 / React Native 0.88 (Expo SDK 58). Sin cambios respecto de la feature 001.

**Primary Dependencies**:
- Backend: Express 5 (`express.raw` para la imagen), zod 4, swagger-jsdoc, supertest. **Sin dependencias nuevas** (R7).
- Front: se suman **expo-image-picker** (R10) y **@react-native-community/datetimepicker** (R11), instaladas con `npx expo install`. La fecha en web usa el `<input type="datetime-local">` del navegador.

**Storage**: en memoria, en `repository/`: `eventosRepository` (eventos con sus tipos de entrada y material multimedia) e `imagenesRepository` (Buffers). Se reinician con el seed (8 eventos y 8 imágenes PNG de ejemplo).

**Testing**: backend con `node:test` + supertest y TDD obligatorio. Unitarios: `reglasEvento`, `eventosService` (estado derivado, orden, edición con ventas), `eventoSchema`, `imagenesService` (firma de bytes). Integración: un archivo por historia más imágenes y docs. Front: `npm run lint` + `npx tsc --noEmit` y la validación manual de [quickstart.md](quickstart.md).

**Target Platform**: igual que la feature 001. El panel de organizadores se usa principalmente en web/desktop y tiene que poder usarse desde 390 px de ancho.

**Project Type**: app mobile + web (un front Expo con dos apps) más una API REST monolítica.

**Performance Goals**: la vista previa se actualiza en menos de 1 s (SC-003); en la práctica, en el mismo render. Mis eventos responde en menos de 200 ms con los datos del seed. Una imagen de 5 MB se sube en menos de 2 s en red local.

**Constraints**:
- Las reglas de publicación y de ventas se validan siempre en el servidor (FR-015).
- Un organizador nunca ve ni modifica un evento ajeno: responde 404 (R16).
- Las vendidas nunca cambian por una edición (SC-006).
- Las imágenes ocupan como máximo 5 MB cada una, en memoria.
- La UI usa solo tokens del design system; no hay colores rojo ni verde de estado.

**Scale/Scope**: 8 eventos de seed; 6 endpoints nuevos (4 de eventos y 2 de imágenes); 3 rutas nuevas del front y 1 completada (Mis eventos); unos 10 componentes del design system nuevos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Organizadores 02, 03 y 04 (mínimo). Los textos, estados y mensajes salen de `pantallas.md` y `design-system.md` (EventManageCard, EventPreview, TicketTypeEditor, Field dropzone, Tag, ProgressBar) y están en [rutas-front.md](contracts/rutas-front.md). Lo que el diseño no definía (edición con ventas, archivos, Detalle mínimo) se resolvió con `/speckit-clarify`. Los estados y textos que el diseño no tenía (Organizadores 03 en modo Editar con **Guardar cambios** y sin **Guardar borrador**, tipo de entrada con ventas, Dropzone con imagen y sus errores, Organizadores 04 mínimo con **Consultas del evento** deshabilitado, cuándo se muestran los errores) se documentan primero en `pantallas.md` y `design-system.md` (tarea T003), antes de cualquier tarea de front. | ✅ (con T003) |
| **II. Test-First en el backend** | En las tareas, los tests van antes que el código. Unitarios de cada regla de `reglasEvento` (cada mensaje), del estado derivado con reloj fijo, del orden, de `eventosService.crear` y de `eventosService.editar` (ajeno, Finalizado, despublicar y conservación de vendidas). Integración de los 6 endpoints con 400, 401, 404 ajeno, 409 Finalizado, 409 despublicar, 413 y 415. | ✅ (lo hace cumplir `/speckit-tasks`) |
| **III. Backend monolito por capas** | `routes/eventosOrganizador.js` e `imagenes.js` → controllers → `eventosService`, `imagenesService`, `reglasEvento`, `reloj` → `eventosRepository`, `imagenesRepository` → `models/Evento`, `Imagen`. DTO en `dto/eventoDto.js`, forma en `schemas/eventoSchema.js`, errores nuevos en `errors/`. Se reutilizan `middlewares/validar` (ajustado, R5) y `requiereSesion`. No hay capas ni procesos nuevos: Finalizado se deriva (R1), sin timers. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/eventos.openapi.yaml](contracts/eventos.openapi.yaml) se copia a `@openapi` en las rutas; un test de `/docs.json` verifica que estén los paths. Se ajusta `swagger.js` solo si hace falta registrar archivos nuevos (ya toma `routes/*.js`). | ✅ |
| **V. Español** | Las entidades se llaman Evento, TipoDeEntrada, MaterialMultimedia e Imagen; los campos `nombre`, `fechaHora`, `ubicacion`, `cupo`, `precio`, `vendidas`; los estados Publicado, Borrador y Finalizado; las rutas `/organizadores/eventos` y `/organizadores/imagenes`. Los términos técnicos en inglés se limitan a `url`, `Buffer` y `Content-Type`. | ✅ |
| **Stack y persistencia** | Persistencia en memoria en `repository/`, con seed al iniciar y `reiniciar()`. Las dependencias nuevas son solo de front y están justificadas (R10, R11). | ✅ |
| **Flujo** | Rama `Feature/002-eventos-organizador`. Quality gates: tests, lint y `/docs`. | ✅ |

**Re-check post-diseño (Phase 1)**: sin violaciones nuevas. La única modificación de código existente con impacto compartido es `validar.js`, que ahora une la ruta completa del campo (R5); mantiene el mismo resultado para los campos planos de la feature 001, y sus tests lo cubren.

## Project Structure

### Documentation (this feature)

```text
specs/002-eventos-organizador/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── eventos.openapi.yaml
│   └── rutas-front.md
├── checklists/requirements.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
aiTicketIt-back/
├── app.js                              # + routers de eventos e imágenes
├── routes/
│   ├── eventosOrganizador.js           # NUEVO: /organizadores/eventos[/:id], con @openapi
│   └── imagenes.js                     # NUEVO: POST /organizadores/imagenes (express.raw 5mb), GET /imagenes/:id
├── controllers/
│   ├── eventosOrganizadorController.js # NUEVO
│   └── imagenesController.js           # NUEVO
├── services/
│   ├── eventosService.js               # NUEVO: listar, obtener, crear, editar (dueño, estado, vendidas)
│   ├── reglasEvento.js                 # NUEVO: validarParaPublicar, validarCambiosConVentas → campos[]
│   ├── imagenesService.js              # NUEVO: firma JPG/PNG, dueño
│   └── reloj.js                        # NUEVO: ahora(), fijarAhora() (R2)
├── repository/
│   ├── eventosRepository.js            # NUEVO: Map por id, contadores evt-N / tip-N
│   ├── imagenesRepository.js           # NUEVO
│   ├── imagenes-seed/*.png             # NUEVO: 8 imágenes 1600×900 (R8)
│   ├── seed.js                         # + eventosSeed (R18)
│   └── index.js                        # reiniciarRepositorios() suma eventos e imágenes
├── models/
│   ├── Evento.js                       # NUEVO (incluye TipoDeEntrada y MaterialMultimedia)
│   └── Imagen.js                       # NUEVO
├── dto/
│   └── eventoDto.js                    # NUEVO: aEventoResumenDto, aEventoDto (estado derivado, totales, imagenUrl)
├── schemas/
│   └── eventoSchema.js                 # NUEVO: forma (R4)
├── errors/
│   └── ErrorDeDominio.js               # + EventoNoEncontrado, EventoFinalizado, NoSePuedeDespublicar,
│                                       #   ImagenInvalida, ImagenMuyGrande, ImagenNoEncontrada
├── middlewares/
│   └── validar.js                      # campo = issue.path.join(".") (R5)
└── tests/
    ├── helpers/estado.js               # + vuelve el reloj al real
    ├── helpers/sesion.js               # NUEVO: tokenDeOrganizador(email)
    ├── unit/
    │   ├── reglasEvento.test.js
    │   ├── eventosService.test.js
    │   ├── eventoSchema.test.js
    │   ├── imagenesService.test.js
    │   └── validar.test.js
    └── integration/
        ├── misEventos.test.js          # US1
        ├── crearEvento.test.js         # US2
        ├── borradorEvento.test.js      # US3
        ├── editarEvento.test.js        # US4
        ├── imagenes.test.js            # FR-009
        └── docs.test.js                # + paths nuevos

aiTicketIt-front/src/
├── app/organizadores/
│   ├── _layout.tsx                     # + eventos/nuevo, eventos/[id]/index, eventos/[id]/editar en Stack.Protected
│   ├── mis-eventos.tsx                 # completa Organizadores 02
│   └── eventos/
│       ├── nuevo.tsx                   # Organizadores 03 · Crear evento
│       └── [id]/
│           ├── index.tsx               # Organizadores 04 mínimo
│           └── editar.tsx              # Organizadores 03 · Editar evento
├── api/
│   ├── cliente.ts                      # + métodos PUT y body binario (Blob) para la imagen
│   └── eventos.ts                      # NUEVO: listarMisEventos, obtenerEvento, crearEvento, editarEvento, subirImagen
├── lib/
│   ├── validacionEvento.ts             # NUEVO: mismas reglas y mensajes que reglasEvento (R13)
│   └── formato.ts                      # NUEVO: plata, fechaCorta, "N de M entradas vendidas"
└── components/ds/
    ├── DesktopNav.tsx                  # "Mis eventos" pasa a ser link real
    ├── Tag.tsx                         # NUEVO: variantes de estado de evento y categoría
    ├── ProgressBar.tsx                 # NUEVO: fina
    ├── EventManageCard.tsx             # NUEVO (+ tile Nuevo evento)
    ├── Select.tsx / Select.web.tsx     # NUEVO (R12)
    ├── CampoFechaHora.tsx / .web.tsx   # NUEVO (R11)
    ├── Dropzone.tsx / Dropzone.web.tsx # NUEVO: imagen del evento (R10)
    ├── MaterialMultimedia.tsx          # NUEVO: tags + Agregar foto o video
    ├── TicketTypeEditor.tsx            # NUEVO
    ├── EventPreview.tsx                # NUEVO
    └── FormularioEvento.tsx            # NUEVO: compartido por Crear y Editar
```

**Structure Decision**: se mantienen los dos proyectos existentes. El backend agrega un módulo de eventos y uno de imágenes con las mismas capas que sesiones. El front agrega las rutas bajo `organizadores/eventos/` y un único `FormularioEvento` reutilizado por Crear y Editar, como indica `pantallas.md`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `GET /imagenes/{id}` sin sesión | `<Image>` en web no puede mandar el header `Authorization`; las imágenes de eventos publicados también las va a ver el comprador. | Mandar el token en la query (queda en logs e historial); base64 dentro del JSON (pesado y sin caché). Se mitiga con ids UUID no adivinables (R7). |
| Archivos `.web.tsx` por plataforma (Select, CampoFechaHora, Dropzone) | Los controles nativos del navegador (select, datetime-local, drag & drop) no existen en React Native y viceversa. | Un solo componente JS para todo (calendario y drag & drop propios: más código y peor accesibilidad). |
