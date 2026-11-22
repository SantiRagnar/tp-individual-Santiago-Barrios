# Implementation Plan: Consultas (chat de la compra)

**Branch**: `Feature/007-consultas-chat` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-consultas-chat/spec.md`

## Summary

La feature agrega un **chat por compra** entre el comprador y el organizador del evento, que cubre los dos casos de uso de mensajes del enunciado:

- **Comprador**: **Compradores 10 · Chat de la compra**, al que se llega con **Tengo una consulta**.
- **Organizador**: **Organizadores 05 · Consultas del evento**, con la lista de conversaciones a la izquierda y el chat a la derecha. Se llega con **Consultas del evento {no leídas}** o con el botón de chat de cada fila de Ventas.
- Los mensajes nuevos aparecen solos en menos de 5 s.
- El organizador ve qué conversaciones tiene sin leer.
- El comprador ve un punto de no leído en Mis compras y en el Detalle, más un toast cuando le responden mientras usa la app.

Enfoque técnico:

- **Backend**:
  - Repositorio nuevo `consultasRepository`: una `Consulta` por número de compra, con `mensajes[]` y los contadores `vistosPorOrganizador` y `vistosPorComprador` (research R1 y R2).
  - `consultasService` + `reglasConsulta` (no leída para cada lado) y el schema zod `mensajeSchema`.
  - Endpoints anidados bajo los routers existentes, que ya resuelven la propiedad (R5). Leer es `PUT …/lectura`, explícito e idempotente (R4). `aCompraDto` suma `consultaNoLeida`.
  - El seed trae 4 conversaciones.
- **Tiempo real**: sondeo cada 3 s con `despuesDe` (cursor = id del último mensaje), solo con la pantalla enfocada y la app en primer plano. No hay dependencias nuevas (R3).
- **Front**:
  - Dos rutas nuevas.
  - Componentes `ChatMensajes`, `CompositorChat`, `ListaConversaciones` y `Toast`, el hook `useSondeo` y el `AvisosDeConsultasProvider` para el toast (R9).
  - El punto de no leído en `PurchaseCard` y `Button`, y el contador en **Consultas del evento**.
  - Antes de implementar, el Toast y los puntos nuevos se documentan en `design-system.md` y `pantallas.md` (R10).
- **Entorno de desarrollo**: backend en el **3007** y front en el **8087** (R13).

## Technical Context

**Language/Version**: JavaScript (Node.js, ES modules) en el backend; TypeScript (Expo SDK 58, React Native, expo-router) en el front

**Primary Dependencies**: Express 5, zod 4, swagger-jsdoc + swagger-ui-express; Expo / expo-router, phosphor-react-native (ícono de chat). **Sin dependencias nuevas** (R3: polling en lugar de WebSocket/SSE).

**Storage**: En memoria, detrás de `repository/` (constitución). Repositorio nuevo `consultasRepository` con `reiniciar()` desde `consultasSeed`, llamado desde `reiniciarRepositorios()`.

**Testing**: `node:test` + `node:assert/strict` + supertest (backend, R12). Front: `npm run lint` y `npx tsc --noEmit`, más la verificación manual del [quickstart](quickstart.md).

**Target Platform**: Backend Node en localhost. Compradores en mobile (390 × 844; Expo Go o web). Organizadores en web desktop (1280 × 800).

**Project Type**: Aplicación web/mobile: backend monolito + front Expo único.

**Performance Goals**:

- Mensaje propio visible en < 1 s (SC-002).
- Mensaje de la otra parte visible en < 5 s con la conversación abierta (FR-021, SC-002).
- Toast en < 5 s (FR-024, SC-007).
- El sondeo de 3 s devuelve `[]` casi siempre; con ~10 conversaciones por evento, todo se resuelve en memoria en milisegundos.

**Constraints**:

- `enviar` y `marcarLeida` son sincrónicos (sin `await` entre verificar y escribir), como el resto de los servicios.
- Ningún `GET` tiene efectos (R4).
- Mensaje de 1 a 1000 caracteres, recortado (R7).
- Hora de Argentina para mostrar (R11).
- El sondeo se detiene sin foco o con la app en segundo plano, y nunca hay dos sondeos en curso en la misma pantalla.
- No romper los tests de las features 001 a 005: `aCompraDto` solo suma un campo.

**Scale/Scope**:

- 4 conversaciones en el seed.
- Backend: 8 endpoints nuevos, 1 modelo, 1 repositorio, 2 servicios, 1 schema y 1 DTO.
- Front: 2 pantallas nuevas, 3 pantallas tocadas, 4 componentes nuevos, 1 hook y 1 provider.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Compradores 08, 09 y 10 y Organizadores 04 y 05. Se usan los componentes definidos en `design-system.md` § Chat y § ConversationList, `dot-unread`, `tag-count`, Avatar y Tag. Lo que el diseño no tenía (Toast, punto en Mis compras y en **Tengo una consulta**, textos de estados vacíos, contador "N/1000") salió de `/speckit-clarify` y **se documenta en `design-system.md` y `pantallas.md` como primera tarea, antes del código de UI** (R10). | ✅ (con tarea previa de diseño) |
| **II. Test-First en el backend** | R12 lista los tests unitarios (reglasConsulta, repositorio, servicio, schema, DTO, seed) y los de integración, uno por historia (US1 a US6). En `tasks.md` van antes que su implementación. | ✅ |
| **III. Monolito por capas** | `routes/compras.js`, `routes/consultas.js` (nuevo, para `no-leidas`) y `routes/eventosOrganizador.js` → `controllers/consultasController.js` → `services/consultasService.js` + `reglasConsulta.js` → `repository/consultasRepository.js` → `models/Consulta.js`. `schemas/mensajeSchema.js` con `validar` y `validarQuery`, `dto/consultaDto.js`. No hay errores nuevos (se reusan los de 404 y 400). No hay procesos, sockets ni capas nuevas. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/consultas.openapi.yaml](contracts/consultas.openapi.yaml) se copia a `@openapi` en los tres routers. `docs.test.js` verifica los paths nuevos. El campo nuevo `consultaNoLeida` se agrega al schema `Compra` de `routes/compras.js` en el mismo cambio. | ✅ |
| **V. Un dominio, un idioma** | Consulta, mensaje, comprador, organizador, compra; autor `comprador`/`organizador`; endpoints `mensajes`, `consultas`, `lectura`, `no-leidas`. Textos con voseo. | ✅ |
| Stack y restricciones | Persistencia en memoria, seed ampliado, reinicio por test con `reiniciarEstado()`. Sin dependencias nuevas. | ✅ |
| Flujo y quality gates | Branch `Feature/007-consultas-chat`. Antes de mergear: tests del backend, `npm run lint`, `/docs` y la verificación del [quickstart](quickstart.md). | ✅ |

**Re-check post-diseño (Phase 1)**: sin cambios. El diseño suma un repositorio y un servicio siguiendo el patrón de las features 003 a 005. El sondeo vive en el front (hook y provider) y no agrega procesos al backend. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/007-consultas-chat/
├── plan.md              # Este archivo
├── research.md          # Phase 0: decisiones R1–R13
├── data-model.md        # Phase 1: Consulta, Mensaje, repositorio, vistas, seed
├── quickstart.md        # Phase 1: cómo levantar (3007/8087) y validar
├── contracts/
│   ├── consultas.openapi.yaml   # 8 endpoints nuevos + campo consultaNoLeida en Compra
│   └── rutas-front.md           # Compradores 10, Organizadores 05, Toast y cambios en 04, 08 y 09
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
Diseño de AI Ticket It/
├── design-system.md                 # + Toast, dot-unread en PurchaseCard/Button, contador N/1000 del compositor
└── pantallas.md                     # + Compradores 08/09 (punto), 10 (vacío, sondeo), Toast; Organizadores 04 (contador, botón chat), 05 (vacíos)

aiTicketIt-back/
├── app.js                           # + /compradores/consultas
├── models/Consulta.js               # nuevo: Consulta, Mensaje
├── repository/
│   ├── consultasRepository.js       # nuevo
│   ├── index.js                     # + consultasRepository.reiniciar()
│   └── seed.js                      # + consultasSeed (4 conversaciones, FR-018)
├── services/
│   ├── consultasService.js          # nuevo: mensajesDeComprador, enviarComoComprador, marcarLeidaComprador, noLeidasDeComprador,
│   │                                #        consultasDelEvento, consultaDeCompra, enviarComoOrganizador, marcarLeidaOrganizador
│   ├── reglasConsulta.js            # nuevo: ultimoMensaje, noLeidaPara
│   └── comprasService.js            # conContexto suma consultaNoLeida (el DTO no lee repositorios)
├── schemas/mensajeSchema.js         # nuevo: body { texto } y query { despuesDe }
├── dto/
│   ├── consultaDto.js               # nuevo: aMensajeDto, aConsultaResumenDto, aConsultaNoLeidaDto
│   └── compraDto.js                 # + consultaNoLeida
├── controllers/consultasController.js  # nuevo
├── routes/
│   ├── compras.js                   # + /:numero/mensajes (GET, POST), /:numero/mensajes/lectura (PUT), @openapi
│   ├── consultas.js                 # nuevo: GET /no-leidas
│   └── eventosOrganizador.js        # + /:id/consultas, /:id/consultas/:numero (+ /mensajes, /lectura), @openapi
└── tests/
    ├── helpers/consultas.js         # nuevo: enviar mensajes de prueba por servicio
    ├── unit/{reglasConsulta,consultasRepository,consultasService,mensajeSchema,consultaDto}.test.js, seed.test.js (+), compraDto.test.js (+)
    └── integration/{consultasComprador,consultasOrganizador,consultasNoLeidas,consultasDesdeVentas,consultasPropiedad}.test.js, docs.test.js (+)

aiTicketIt-front/src/
├── app/(compradores)/
│   ├── _layout.tsx                  # + compras/[numero]/consulta, AvisosDeConsultasProvider
│   ├── compras/[numero]/consulta.tsx   # nuevo: Compradores 10
│   ├── compras/[numero]/index.tsx   # Tengo una consulta → chat, con punto
│   └── mis-compras.tsx              # recarga con version de avisos
├── app/organizadores/
│   ├── _layout.tsx                  # + eventos/[id]/consultas
│   └── eventos/[id]/
│       ├── consultas.tsx            # nuevo: Organizadores 05
│       └── index.tsx                # Consultas del evento habilitado con tag-count
├── api/
│   ├── consultas.ts                 # nuevo: tipos Mensaje, ConsultaResumen, ConsultaNoLeida y las llamadas
│   └── compras.ts                   # + consultaNoLeida en Compra
├── consultas/AvisosDeConsultasProvider.tsx   # nuevo: sondeo global, línea de base, toast, version
├── hooks/useSondeo.ts               # nuevo: intervalo con foco + AppState, sin solapamiento
├── components/ds/
│   ├── ChatMensajes.tsx             # nuevo: burbujas, hora, auto-scroll condicional
│   ├── CompositorChat.tsx           # nuevo: variantes mobile/desktop, Enter envía, contador
│   ├── ListaConversaciones.tsx      # nuevo
│   ├── Toast.tsx                    # nuevo
│   ├── PurchaseCard.tsx             # + punto de no leído
│   ├── Button.tsx                   # + prop `noLeido` (dot) y `contador` (tag-count)
│   └── TablaVentas.tsx              # + botón ícono de chat por fila
└── lib/formato.ts                   # + horaDeMensaje

CLAUDE.md                            # + endpoints de la feature 007, sondeo y puertos
```

**Structure Decision**: es la estructura existente: backend monolito por capas en `aiTicketIt-back/` y un único front Expo en `aiTicketIt-front/`. Las piezas nuevas siguen el patrón servicio + reglas + DTO de las features 003 a 005, y los providers de `src/favoritos/`.

## Riesgos y coordinación

- **Merge con la feature 006 (calificaciones)**, que se desarrolla en paralelo en otro worktree. Probablemente toca:
  - `compraDto.js` (calificación), `seed.js`, `routes/compras.js`, `app.js`.
  - `compras/[numero]/index.tsx` (Calificar experiencia), `PurchaseCard.tsx`, `(compradores)/_layout.tsx`, `pantallas.md` y `design-system.md`.

  Los cambios de esta feature en esos archivos son aditivos (un campo, un botón, una ruta, un bloque de seed). Al mergear, conciliar a mano y correr `npm test` completo.
- **Feature 006 numerada 006**: esta feature usa 007 en carpeta y branch. Si la 006 llegara a no mergearse, no hay dependencia funcional entre las dos.
- **Sondeo en web con varias pestañas**: cada pestaña sondea por su cuenta. Es aceptable a esta escala (R3).
- **Reloj real**: la hora de los mensajes "de hoy" depende del reloj. Los tests de formato del front no existen; el backend solo guarda ISO. Para la validación manual alcanza el reloj real.

## Complexity Tracking

Sin violaciones de la constitución; no aplica.
