# Implementation Plan: Compra, pago simulado y Mis compras (compradores)

**Branch**: `Feature/004-compra-pago-mis-compras` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-compra-pago-mis-compras/spec.md`

## Summary

El comprador toca **Comprar**, elige tipo de entrada y cantidad (Compradores 05), elige un medio de pago y toca **Pagar $ X** (06). El pago es simulado: no se piden datos ni se contacta a nadie. La compra se crea Confirmada y se ve "¡Compra confirmada!" (07). Desde el Menú de perfil (03) llega a Mis compras (08) y al Detalle de compra (09), donde puede **Completar pago** de una compra Pendiente o **Cancelar compra** (Reembolsada / Cancelada, con liberación de lugares).

Backend: router nuevo `/compradores/compras` con 5 endpoints (crear/pagar, listar, detalle, completar pago, cancelar).

- **Concurrencia**: la verificación de visibilidad, precio y lugares y el descuento de `vendidas` ocurren en una función sincrónica, sin `await`. En Node, con persistencia en memoria, eso la hace atómica y nunca se vende más que el cupo (R2).
- **Precio**: el cliente envía el precio que vio y el servidor rechaza si cambió (R3).
- **Copia de datos**: la compra guarda una copia del nombre y precio del tipo (R6).
- **Reglas en el servidor**: las acciones permitidas y la cuenta regresiva se calculan en el servidor con `reloj.js` (R7).

Front: 5 rutas nuevas dentro del Stack protegido de compradores, un BottomSheet para el Menú de perfil y los componentes del design system que faltan (RadioCard, QuantityStepper, PurchaseCard, DetailList, Dialog, BottomSheet, TagCompra). Decisiones en [research.md](research.md).

## Technical Context

**Language/Version**:
- Backend: JavaScript (ES modules) sobre Node.js 26.
- Front: TypeScript ~6.0, React 19.3 / React Native 0.88 (Expo SDK 58).

Sin cambios respecto de las features 001 a 003.

**Primary Dependencies**:
- Backend: Express 5, zod 4, swagger-jsdoc, supertest.
- Front: expo-router (`dismissTo`, `useFocusEffect`) y `phosphor-react-native` (íconos `check-circle`, `clock`, `ticket`, `x-circle`, `arrow-counter-clockwise`, `minus`, `plus`).

**Sin dependencias nuevas** en ninguno de los dos.

**Storage**: en memoria, en `repository/`.
- `comprasRepository` suma un índice por comprador, el contador de números (`siguienteNumero`) y `listarPorComprador`.
- `TipoDeEntrada.vendidas` sigue siendo la fuente de los lugares ocupados (R5).
- El seed suma las 4 compras de Sofía (R9).

Todo vuelve al seed con `reiniciarRepositorios()`.

**Testing**: backend con `node:test` + supertest y TDD obligatorio.
- **Unitarios**: `reglasCompra`, `comprasService`, `comprasRepository` (número, índice por comprador), `compraDto` y `compraSchema`.
- **Integración**, un archivo por historia: `comprar.test.js` (US1), `misCompras.test.js` (US2), `detalleCompra.test.js` (US3), `completarPago.test.js` (US4), `cancelarCompra.test.js` (US5) y `concurrencia.test.js` (SC-003, 50 pagos en paralelo sobre 10 lugares). Más `docs.test.js` con los paths nuevos (R14).
- **Front**: `npm run lint` + `npx tsc --noEmit` y la validación manual de [quickstart.md](quickstart.md).

**Target Platform**: app de compradores para mobile (390 × 844, iOS/Android con Expo), usable en web sin scroll horizontal. Backend Node en local.

**Project Type**: app mobile + web (un front Expo con dos apps) más una API REST monolítica.

**Performance Goals**:
- Pagar, completar pago y cancelar responden en menos de 200 ms con el seed.
- Mis compras usa un índice por comprador y no recorre todas las compras.
- El flujo completo se puede hacer en menos de 1 minuto y 5 toques (SC-001).

**Constraints**:
- Nunca se vende más que el cupo, ni con pagos simultáneos (FR-010, SC-003).
- Nunca se cobra un monto distinto del mostrado (FR-030).
- Ningún comprador ve ni opera compras ajenas: responden 404 igual que una inexistente (SC-004).
- Ningún paso pide datos de pago reales (FR-008, SC-006).
- UI solo con tokens y componentes del design system.
- Los elementos de features futuras se ven pero no tienen acción (FR-029).

**Scale/Scope**:
- Backend: 5 endpoints, 1 router, 1 controller, 2 servicios (`comprasService`, `reglasCompra`), 1 DTO, 1 schema, 5 errores nuevos y cambios en `Compra`, `comprasRepository`, `seed.js` e `index.js` (R15).
- Front: 5 pantallas nuevas, 1 BottomSheet, unos 9 componentes del design system nuevos, `api/compras.ts` y formatos nuevos.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Compradores 03, 05, 06, 07, 08 y 09. Textos, formatos (`$ 36.000`, `#A-1042`, `Platea × 2`, "Faltan N días") y componentes salen de `pantallas.md` y `design-system.md` y quedan en [rutas-front.md](contracts/rutas-front.md). Lo que el diseño no definía se resolvió con `/speckit-specify` y `/speckit-clarify`: los avisos de lugares y de precio, el estado vacío de Mis compras, la compra no encontrada y los elementos sin acción. Esos textos se agregan **primero** a `pantallas.md` (R12), como tarea previa a cualquier tarea de front. Todos los componentes nuevos ya están definidos en el design system (R11). | ✅ (con la tarea de diseño) |
| **II. Test-First en el backend** | Cada regla de `reglasCompra.js` y `comprasService.js` tiene tests unitarios, incluido uno que asegura que `comprar()` no es `async`. Cada endpoint tiene tests de integración con 200/201, 400, 401 (sin sesión y con token de organizador), 404 (evento oculto, compra inexistente o ajena) y 409 (`PRECIO_CAMBIADO`, `LUGARES_INSUFICIENTES`, `PAGO_NO_PERMITIDO`, `CANCELACION_NO_PERMITIDA`). La concurrencia tiene su propio test. En `tasks.md`, los tests van antes que el código. | ✅ (lo hace cumplir `/speckit-tasks`) |
| **III. Backend monolito por capas** | La cadena es `routes/compras.js` → `controllers/comprasController.js` → `services/comprasService.js` + `services/reglasCompra.js` → `repository/comprasRepository.js` y `eventosRepository.js` → `models/Compra.js`. A eso se suman `dto/compraDto.js`, `schemas/compraSchema.js` (con `validar`) y los errores nuevos en `errors/ErrorDeDominio.js`. Las reglas de estado y de lugares viven solo en `services/`. No hay procesos ni capas nuevas. | ✅ |
| **IV. Contratos OpenAPI** | [contracts/compras.openapi.yaml](contracts/compras.openapi.yaml) se copia a `@openapi` en `routes/compras.js`, y `docs.test.js` verifica los 4 paths nuevos. | ✅ |
| **V. Español** | Entidad `Compra` con los estados exactos de la constitución (Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada). Campos `tipoDeEntradaNombre`, `precioUnitario`, `medioDePago`, `diasParaEvento`, `motivoNoCancelable`, `acciones`. Rutas `/compradores/compras`, `…/pago` y `…/cancelacion`. Errores `PRECIO_CAMBIADO`, `LUGARES_INSUFICIENTES`, etc. | ✅ |
| **Stack y persistencia** | En memoria, en `repository/`, con seed y `reiniciar()`. Pagos simulados, como exige la constitución. Sin dependencias nuevas. | ✅ |
| **Flujo** | Rama `Feature/004-compra-pago-mis-compras`. Quality gates: tests del backend, lint, `tsc` y `/docs`. | ✅ |

**Re-check post-diseño (Phase 1)**: sin violaciones. Hay cambios en código existente con impacto compartido:

1. **Seed**: suma 4 compras de Sofía. Los tests de las features 002 y 003 no cuentan compras no calificadas, y `vendidas` no cambia, pero se corre la suite completa para confirmarlo.
2. **Detalle del evento**: el archivo `eventos/[id].tsx` pasa a `eventos/[id]/index.tsx` para poder tener rutas hijas. La URL no cambia.
3. **Botón Comprar**: pierde el "sin acción" de la feature 003 (FR-009 de la 003). Navega a Elegir entradas.
4. **Avatar de Explorar**: abre el Menú de perfil.
5. **`index.js`**: lee `FECHA_SIMULADA`. Es opcional y no cambia nada si no se define (R15). Se documenta en `CLAUDE.md`.

## Project Structure

### Documentation (this feature)

```text
specs/004-compra-pago-mis-compras/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── compras.openapi.yaml
│   └── rutas-front.md
├── checklists/requirements.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
Diseño de AI Ticket It/
├── pantallas.md                        # + avisos de 05, vacío de 08, compra no encontrada de 09, elementos sin acción (R12)
└── design-system.md                    # + ResumenCompra y MarcaDeExito (§ Feedback), antes de implementarlos

CLAUDE.md                               # + endpoints de compras (feature 004) y FECHA_SIMULADA

aiTicketIt-back/
├── index.js                            # + llama a fijarAhoraDesdeEntorno(process.env.FECHA_SIMULADA) (R15)
├── app.js                              # + app.use("/compradores/compras", crearRouterCompras())
├── routes/
│   └── compras.js                      # NUEVO: POST/GET /, GET /:numero, POST /:numero/pago, POST /:numero/cancelacion (@openapi)
├── controllers/
│   └── comprasController.js            # NUEVO
├── services/
│   ├── comprasService.js               # NUEVO: comprar (sincrónico, R2), listar, obtener, completarPago, cancelar
│   ├── reloj.js                        # + fijarAhoraDesdeEntorno (R15)
│   └── reglasCompra.js                 # NUEVO: puedeCompletarPago, motivoNoCancelable, estadoTrasCancelar, diasParaEvento (R7)
├── repository/
│   ├── comprasRepository.js            # + índice por comprador, siguienteNumero, listarPorComprador (R8)
│   └── seed.js                         # + A-1042, A-1037, A-0871, A-0790 (R9)
├── models/
│   └── Compra.js                       # + tipoDeEntradaNombre, precioUnitario (R6)
├── dto/
│   └── compraDto.js                    # NUEVO: vista Compra (evento actual + copia del tipo + acciones)
├── schemas/
│   └── compraSchema.js                 # NUEVO: NuevaCompra
├── errors/
│   └── ErrorDeDominio.js               # + PrecioCambiado, LugaresInsuficientes, CompraNoEncontrada, PagoNoPermitido, CancelacionNoPermitida
└── tests/
    ├── helpers/compras.js              # NUEVO: crear evento visible con cupo chico, comprar como un comprador dado
    ├── unit/
    │   ├── reloj.test.js               # + fijarAhoraDesdeEntorno (R15)
    │   ├── reglasCompra.test.js
    │   ├── comprasService.test.js
    │   ├── comprasRepository.test.js   # + siguienteNumero, listarPorComprador
    │   ├── compraDto.test.js
    │   └── compraSchema.test.js
    └── integration/
        ├── comprar.test.js             # US1
        ├── misCompras.test.js          # US2
        ├── detalleCompra.test.js       # US3
        ├── completarPago.test.js       # US4
        ├── cancelarCompra.test.js      # US5
        ├── concurrencia.test.js        # SC-003
        └── docs.test.js                # + paths nuevos

aiTicketIt-front/src/
├── app/(compradores)/
│   ├── _layout.tsx                     # + rutas nuevas en Stack.Protected
│   ├── (pestanas)/explorar.tsx         # Avatar → MenuPerfil; Comprar → Elegir entradas
│   ├── eventos/[id]/
│   │   ├── index.tsx                   # MOVIDO desde eventos/[id].tsx; Comprar → Elegir entradas
│   │   ├── entradas.tsx                # NUEVO: Compradores 05
│   │   └── pago.tsx                    # NUEVO: Compradores 06
│   ├── compras/[numero]/
│   │   ├── index.tsx                   # NUEVO: Compradores 09
│   │   └── confirmada.tsx              # NUEVO: Compradores 07
│   └── mis-compras.tsx                 # NUEVO: Compradores 08
├── api/
│   └── compras.ts                      # NUEVO: comprar, listarCompras, obtenerCompra, completarPago, cancelarCompra
├── lib/
│   └── formato.ts                      # + cuentaRegresiva, entradas, numeroCompra, fechaYHoraLarga (R13)
└── components/ds/
    ├── MenuPerfil.tsx                  # NUEVO: contenido de Compradores 03
    ├── BottomSheet.tsx                 # NUEVO
    ├── RadioCard.tsx                   # NUEVO
    ├── QuantityStepper.tsx             # NUEVO
    ├── ResumenCompra.tsx               # NUEVO
    ├── MarcaDeExito.tsx                # NUEVO
    ├── PurchaseCard.tsx                # NUEVO
    ├── DetailList.tsx                  # NUEVO
    ├── Dialog.tsx                      # NUEVO
    └── Tag.tsx                         # + TagCompra (ícono + palabra, variante lg)
```

**Structure Decision**: se mantienen los dos proyectos.
- **Backend**: agrega un módulo `compras` con las mismas capas que los módulos de eventos y favoritos.
- **Front**: agrega las pantallas del flujo de compra y de Mis compras como pantallas del Stack de compradores, apiladas sobre las pestañas, igual que el Detalle del evento.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Copia de `tipoDeEntradaNombre` y `precioUnitario` en la compra (R6) | Después de cancelar, un tipo puede quedar sin ventas y el organizador puede borrarlo o renombrarlo; la compra tiene que seguir mostrando lo que se compró y a qué precio. | Resolver siempre contra el evento rompe Mis compras cuando el tipo ya no existe. |
| Variable `FECHA_SIMULADA` en `index.js` (R15) | Sin ella, la validación manual de Completar pago y Cancelar es imposible con las fechas del seed y el reloj real. | Mover las fechas del seed rompe `pantallas.md` y los tests de las features 002 y 003. |
