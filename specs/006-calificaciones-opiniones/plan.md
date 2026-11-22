# Implementation Plan: Calificaciones y opiniones (compradores)

**Branch**: `Feature/006-calificaciones-opiniones` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-calificaciones-opiniones/spec.md`

## Summary

El comprador califica una compra **Utilizada**, una sola vez, con un puntaje de 1 a 5 y un comentario opcional de hasta 500 caracteres. Puede hacerlo desde **Compradores 12 · Calificar experiencia**, a la que se llega desde Mis compras o desde el Detalle de compra, o desde el **recordatorio de Explorar**. La calificación se publica en el momento como reseña del organizador: cambia su puntaje, el contador de reseñas, el orden por Puntaje y la lista de opiniones del Detalle del evento.

Enfoque técnico:

- **Endpoints nuevos**:
  - `POST /compradores/compras/{numero}/calificacion` (201 `{ compra }`).
  - `GET /compradores/calificaciones/pendiente` (`{ compra | null }`).
- **Backend**:
  - `comprasService.calificar` es sincrónica, sin `await` entre verificar y escribir. Usa las reglas puras de `reglasCalificacion.js` y una función nueva, `comprasRepository.calificar`, que actualiza el índice por organizador que ya existe (feature 003). Por eso Explorar y el Detalle no cambian.
  - El DTO de Compra suma `acciones.calificar` y `motivoNoCalificable`.
- **Front**:
  - Ruta nueva `compras/[numero]/calificar.tsx`.
  - Componentes nuevos `SelectorEstrellas` y `RecordatorioCalificacion`.
  - Se conectan las acciones que la feature 004 dejó sin efecto.

## Technical Context

**Language/Version**: JavaScript (Node.js, ES modules) en el backend; TypeScript (Expo, React Native, expo-router) en el front.

**Primary Dependencies**: Express 5, zod 4, swagger-jsdoc + swagger-ui-express; Expo / expo-router. Sin dependencias nuevas.

**Storage**: En memoria, detrás de `repository/` (constitución). La calificación vive en `Compra.calificacion`. El seed no cambia: A-0871 queda Utilizada sin calificar.

**Testing**: `node:test` + `node:assert/strict` + supertest. En el front, `npm run lint` y `npx tsc --noEmit`, sin tests automáticos.

**Target Platform**: Backend Node en localhost. App de compradores mobile (390 × 844), también usable en web.

**Project Type**: Aplicación web/mobile: backend monolito + front Expo único.

**Performance Goals**: Calificar en < 30 s y ≤ 3 toques (SC-001). La reseña aparece en la request siguiente (SC-002). Todo se resuelve en memoria y el índice se actualiza en O(n) por organizador.

**Constraints**:

- Una sola calificación por compra, aun con pedidos simultáneos (SC-003).
- Sin condición de fecha ni plazo (Clarifications).
- El front no recalcula reglas: usa `acciones.calificar` y `motivoNoCalificable`.
- No romper los tests de las features 003 a 005, que leen reseñas y compras del seed.

**Scale/Scope**: 1 pantalla nueva, 3 pantallas ampliadas, 2 componentes del design system, 2 endpoints, 1 router nuevo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Compradores 02, 04, 08, 09 y 12. Se usan los textos de `pantallas.md` y de design-system § Rating: estrellas de 36 px, palabras del puntaje, "N/500" y el texto del recordatorio. Los dos mensajes nuevos y la regla "sin plazo" se agregan a `pantallas.md` antes de implementar (research R11). | ✅ |
| **II. Test-First en el backend** | research R12 lista los unitarios (reglas, schema, repositorio, servicio, DTO) y los de integración, uno por historia, más el de concurrencia y docs. En `tasks.md` van antes que su implementación. | ✅ |
| **III. Monolito por capas** | `routes/compras.js` y `routes/calificaciones.js` (nuevo) → `comprasController` → `comprasService` + `reglasCalificacion.js` → `comprasRepository.calificar`. `schemas/calificacionSchema.js` con `validar`; errores nuevos en `errors/`. El router nuevo es solo un archivo de rutas, no una capa nueva. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/calificaciones.openapi.yaml](contracts/calificaciones.openapi.yaml) se copia a `@openapi`. Se actualiza el schema `Compra` con los dos campos nuevos. `docs.test.js` verifica los paths. | ✅ |
| **V. Un dominio, un idioma** | Calificación, reseña, puntaje, comentario, organizador, compra Utilizada. Códigos de error en español (`COMPRA_YA_CALIFICADA`, `CALIFICACION_NO_PERMITIDA`). | ✅ |
| Stack y restricciones | Persistencia en memoria, sin dependencias nuevas; `reiniciarEstado()` en cada test. | ✅ |
| Flujo y quality gates | Branch `Feature/006-calificaciones-opiniones`. Antes de mergear: tests, lint, `/docs` y el [quickstart](quickstart.md). | ✅ |

**Re-check post-diseño (Phase 1)**: sin cambios. El diseño suma una función a un repositorio existente, un archivo de reglas puras y un router. No hay violaciones que justificar, así que Complexity Tracking queda vacío.

## Project Structure

### Documentation (this feature)

```text
specs/006-calificaciones-opiniones/
├── plan.md              # Este archivo
├── research.md          # Phase 0: decisiones R1–R12
├── data-model.md        # Phase 1: transición calificar, reglas, DTO, errores
├── quickstart.md        # Phase 1: cómo levantar y validar
├── contracts/
│   ├── calificaciones.openapi.yaml   # Endpoints nuevos y campos nuevos de Compra
│   └── rutas-front.md                # Compradores 12 y recordatorio de Explorar
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
aiTicketIt-back/
├── app.js                            # + app.use("/compradores/calificaciones", crearRouterCalificaciones())
├── routes/
│   ├── compras.js                    # + POST /:numero/calificacion, @openapi (Compra + acciones.calificar, motivoNoCalificable)
│   └── calificaciones.js             # nuevo: GET /pendiente, @openapi
├── controllers/comprasController.js  # + calificar, pendienteDeCalificar
├── services/
│   ├── comprasService.js             # + calificar (SINCRÓNICA), pendienteDeCalificar
│   └── reglasCalificacion.js         # nuevo: motivoNoCalificable, puedeCalificar
├── repository/comprasRepository.js   # + calificar(numero, calificacion, { organizadorId })
├── dto/compraDto.js                  # + acciones.calificar, motivoNoCalificable
├── schemas/calificacionSchema.js     # nuevo
├── errors/ErrorDeDominio.js          # + CompraYaCalificada, CalificacionNoPermitida
└── tests/
    ├── unit/{reglasCalificacion,calificacionSchema}.test.js (nuevos);
    │   comprasRepository, comprasService, compraDto (+)
    └── integration/{calificarCompra,resenaPublicada,recordatorioCalificacion}.test.js (nuevos);
        concurrencia, docs (+)

aiTicketIt-front/src/
├── app/(compradores)/
│   ├── compras/[numero]/calificar.tsx    # nuevo: Compradores 12
│   ├── compras/[numero]/index.tsx        # Calificar experiencia navega (desde=detalle)
│   ├── mis-compras.tsx                   # "Calificá tu experiencia" navega
│   └── (pestanas)/explorar.tsx           # + RecordatorioCalificacion en el header
├── api/compras.ts                        # + calificarCompra, obtenerPendienteDeCalificar, tipos
├── components/ds/
│   ├── SelectorEstrellas.tsx             # nuevo
│   ├── RecordatorioCalificacion.tsx      # nuevo
│   └── PurchaseCard.tsx                  # + onCalificar
└── lib/
    ├── formato.ts                        # + palabraPuntaje, contadorCaracteres
    └── calificacionesRecientes.ts        # nuevo: avisa a Explorar que recargue puntajes tras calificar (SC-002)

Diseño de AI Ticket It/pantallas.md       # + mensajes de Compradores 12 y regla sin plazo (feature 006)
CLAUDE.md                                 # + endpoints de la feature 006
```

**Structure Decision**: se mantiene la estructura del monolito por capas y del front único. La única pieza nueva de enrutamiento es `routes/calificaciones.js`, que evita que `/pendiente` choque con `/compras/:numero` (research R7).

## Complexity Tracking

Sin violaciones de la constitución.
