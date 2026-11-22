# Implementation Plan: Panel del evento (organizadores)

**Branch**: `Feature/005-panel-evento` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-panel-evento/spec.md`

## Summary

Completar **Organizadores 04 · Detalle del evento**: además de la cabecera de la feature 002, el panel muestra la **Disponibilidad por tipo de entrada** (barra `progress-lg`, "Quedan N"/"Agotada", "vendidas / cupo"), la StatCard **Recaudado** ("$ X" · "N entradas vendidas · M compras activas") y la tabla de **Ventas** con chips por estado y contador, cargada de a 20 con **Ver más**. Desde la tabla, el organizador puede **Marcar utilizada** una compra Confirmada a partir de las 00:00 (hora de Argentina) del día del evento.

Enfoque técnico:

- La cabecera y la disponibilidad reutilizan `GET /organizadores/eventos/{id}`.
- Dos endpoints nuevos en el mismo router:
  - `GET …/{id}/ventas?estado=&cursor=` devuelve resumen + página.
  - `POST …/{id}/ventas/{numero}/utilizacion` marca la compra como utilizada.
- Backend:
  - `ventasService` y `reglasVenta` con la regla de fecha usando `reloj.js`.
  - Un índice de compras por evento en `comprasRepository`, con cursor opaco (`cursor.js`).
  - El seed se completa con ~300 compras generadas en forma determinística, que suman exactamente las vendidas de cada tipo.
- Front:
  - La pantalla `[id]/index.tsx` se amplía con StatCard, DisponibilidadTipo, TablaVentas y TagEstadoCompra.
  - Usa `useListaPaginada` con **Ver más**.
- En esta sesión, el backend se levanta en el **3005** y el front en el **8085**.

## Technical Context

**Language/Version**: JavaScript (Node.js, ES modules) en el backend; TypeScript (Expo SDK 58, React Native, expo-router) en el front

**Primary Dependencies**: Express 5, zod 4, swagger-jsdoc + swagger-ui-express; Expo / expo-router. Sin dependencias nuevas.

**Storage**: En memoria, detrás de `repository/` (constitución). Seed al iniciar; `reiniciarRepositorios()` en cada test.

**Testing**: `node:test` + `node:assert/strict` + supertest (backend). Front: `npm run lint` y `npx tsc --noEmit`, sin tests automáticos.

**Target Platform**: Backend Node en localhost. Panel de organizadores en web desktop (1280 × 800).

**Project Type**: Aplicación web: backend monolito + front Expo único.

**Performance Goals**: Panel visible en < 2 s (SC-001); Marcar utilizada reflejado en < 1 s sin recargar (SC-004). Con ~60 compras por evento, todo se resuelve en memoria en milisegundos.

**Constraints**:

- Paginación por cursor, de a 20.
- Ventana de marcado calculada en UTC−3 fijo.
- Sin `await` entre verificar y escribir al marcar.
- No cambiar los puertos por defecto del código; se levantan en 3005 y 8085 con variables y flags.
- No romper los tests de las features 002 y 003, ni el seed y los números de compra que asume la 004.

**Scale/Scope**: 9 eventos, ~310 compras en el seed, 15 compradores, 3 organizadores. 1 pantalla ampliada, 4 componentes del design system, 2 endpoints.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia "Organizadores 04 · Detalle del evento". Se usan los componentes del design system (StatCard, DataTable, chips `chip-sm`, `progress-lg`, Tag) y los textos de `pantallas.md` ("Quedan N", "Agotada", "No hay ventas con este estado.", "Marcar utilizada"). Hay dos agregados que el diseño no tenía: **Ver más** y la ventana de fecha. Salieron de `/speckit-clarify` y se agregan a `pantallas.md` en el mismo cambio (tarea de documentación). | ✅ |
| **II. Test-First en el backend** | research R12 lista los unitarios (reglasVenta, ventasService, repositorio, DTO, schema, seed) y los de integración, uno por historia. En `tasks.md` van antes que su implementación. | ✅ |
| **III. Monolito por capas** | `routes/eventosOrganizador.js` → `controllers/ventasController.js` → `services/ventasService.js` + `reglasVenta.js` → `repository/comprasRepository.js`. `schemas/ventasSchema.js` con `validarQuery`, `dto/ventaDto.js` y errores nuevos en `errors/`. Sin capas ni procesos nuevos. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/ventas.openapi.yaml](contracts/ventas.openapi.yaml) se copia a `@openapi` en `routes/eventosOrganizador.js`. `docs.test.js` verifica los paths nuevos. | ✅ |
| **V. Un dominio, un idioma** | Venta, compra, comprador, cupo, vendidas, recaudado. Los estados se nombran exactos ("Pendiente de pago", …) incluso en el query `estado`. Los errores tienen códigos y mensajes en español. | ✅ |
| Stack y restricciones | Persistencia en memoria; seed ampliado. Reinicio por test con `reiniciarEstado()`. Sin dependencias nuevas (la barra con degradé sale con CSS en web, R10). | ✅ |
| Flujo y quality gates | Branch `Feature/005-panel-evento`. Antes de mergear: tests del backend, `npm run lint`, `/docs` y la verificación visual del [quickstart](quickstart.md). | ✅ |

**Re-check post-diseño (Phase 1)**: sin cambios. El diseño agrega un índice en un repositorio existente y un generador puro en el seed, sin capas nuevas. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/005-panel-evento/
├── plan.md              # Este archivo
├── research.md          # Phase 0: decisiones R1–R12
├── data-model.md        # Phase 1: transición, resumen, vista Venta, seed
├── quickstart.md        # Phase 1: cómo levantar (3005/8085) y validar
├── contracts/
│   ├── ventas.openapi.yaml   # Endpoints nuevos
│   └── rutas-front.md        # Pantalla Organizadores 04 completa
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
aiTicketIt-back/
├── index.js                         # + FECHA_SIMULADA (R9; igual que la 004)
├── routes/eventosOrganizador.js     # + GET /:id/ventas, POST /:id/ventas/:numero/utilizacion, @openapi
├── controllers/ventasController.js  # nuevo
├── services/
│   ├── ventasService.js             # nuevo: resumen, pagina, marcarUtilizada
│   └── reglasVenta.js               # nuevo: inicioDelDiaEnArgentina, puedeMarcarUtilizada, esActiva
├── repository/
│   ├── comprasRepository.js         # + índice por evento, listarPorEvento, todasDelEvento
│   └── seed.js                      # + compradores cmp-6..15, compras de Sofía, generarVentasDeEjemplo
├── dto/ventaDto.js                  # nuevo
├── schemas/ventasSchema.js          # nuevo (estado, cursor)
├── errors/ErrorDeDominio.js         # + CompraNoEncontrada, CompraNoConfirmada, EventoNoComenzo
└── tests/
    ├── unit/{reglasVenta,ventasService,ventaDto,ventasSchema,seed}.test.js, comprasRepository.test.js (+)
    └── integration/{panelDisponibilidad,panelVentas,marcarUtilizada,panelPropiedad}.test.js, docs.test.js (+)

aiTicketIt-front/src/
├── app/organizadores/eventos/[id]/index.tsx   # versión completa de Organizadores 04
├── api/ventas.ts                              # nuevo: listarVentas, marcarUtilizada, tipos Venta/Resumen
├── components/ds/
│   ├── StatCard.tsx                           # nuevo
│   ├── DisponibilidadTipo.tsx                 # nuevo
│   ├── TablaVentas.tsx                        # nuevo (DataTable de ventas)
│   ├── Tag.tsx                                # + TagEstadoCompra
│   └── ProgressBar.tsx                        # + variante 'lg'
├── hooks/useListaPaginada.ts                  # + cargarMas() expuesto para "Ver más", reemplazar/quitar item
└── lib/formato.ts                             # + numeroCompra, entradasVendidasTexto, comprasActivasTexto

Diseño de AI Ticket It/pantallas.md            # + Ver más de a 20 y ventana de Marcar utilizada (feature 005)
CLAUDE.md                                      # + endpoints de la feature 005 y puertos de desarrollo
```

**Structure Decision**: es la estructura existente: backend monolito por capas en `aiTicketIt-back/` y un único front Expo en `aiTicketIt-front/`. Las piezas nuevas siguen el patrón de la feature 003 (servicio + reglas + DTO + cursor) y de la 002 (router de eventos del organizador).

## Riesgos y coordinación

- **Merge con la feature 004** (se desarrolla en paralelo y toca `seed.js`, `comprasRepository.js`, `ErrorDeDominio.js`, `index.js`, `Tag.tsx`):
  - Las compras de Sofía, `COMPRA_NO_ENCONTRADA` y `FECHA_SIMULADA` se definieron igual que en su plan.
  - Los números generados quedan por debajo de A-0540, así que el próximo número de la 004 sigue siendo A-1043.
  - Los compradores nuevos no tocan Mis compras de Sofía.
  - Al mergear hay que conciliar a mano los bloques de seed y de índices, y verificar con `seed.test.js` que las compras sigan sumando las vendidas.
- **Reloj real**: hoy (2026-11-22), Hamlet y Risas ya se ven Finalizados. Para validar la regla del día del evento a mano, usar `FECHA_SIMULADA` (quickstart, escenario 13).

## Complexity Tracking

Sin violaciones de la constitución; no aplica.
