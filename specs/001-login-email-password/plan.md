# Implementation Plan: Ingreso con email y contraseña (compradores y organizadores)

**Branch**: `Feature/001-login-email-password` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-login-email-password/spec.md`

## Summary

Los compradores (Compradores 01 · Ingreso, en `/`) y los organizadores (Organizadores 01 · Ingreso, en `/organizadores`) ingresan con email y contraseña. Cada uno tiene su flujo y su sesión. El backend verifica las credenciales contra cuentas en memoria cargadas desde el seed, con contraseñas protegidas con scrypt. Si son correctas, emite un token opaco de sesión que se puede cerrar y que cada operación valida según el tipo de cuenta. El front guarda la sesión en el dispositivo (secure-store en nativo, localStorage en web) y protege sus rutas con `Stack.Protected` de expo-router. Esta feature además deja armados el framework de tests, la validación, el formato de errores y los primeros componentes del design system, que pasan a ser el estándar del proyecto ([research.md](research.md)).

## Technical Context

**Language/Version**: Backend: JavaScript (ES modules) sobre Node.js 26. Front: TypeScript ~6.0 con React 19.3 / React Native 0.88 (Expo SDK 58).

**Primary Dependencies**:
- Backend: Express 5, swagger-jsdoc y swagger-ui-express (ya están). Se suman **zod** 4.x (validación, R3) y **supertest** 7.x (dev, R1).
- Front: expo-router 58 (ya está). Se suman **expo-secure-store** (R10), **@expo-google-fonts/inter** (R12), **phosphor-react-native** + **react-native-svg** (R12). Todo con `npx expo install`.

**Storage**: en memoria, encapsulada en `repository/` (constitución). Del lado del cliente, la sesión se guarda en secure-store o localStorage.

**Testing**: backend con `node:test` + `node:assert/strict` + supertest, con TDD obligatorio. Front: `npm run lint` + `npx tsc --noEmit` (la constitución no exige tests de front) y la validación manual de [quickstart.md](quickstart.md).

**Target Platform**: el backend corre en Node local. El front corre en Android/iOS (Expo Go o development build) y en web.

**Project Type**: app mobile + web (un único front Expo con dos apps) más una API REST monolítica.

**Performance Goals**: la respuesta del ingreso tarda menos de 2 s (SC-001). Con scrypt y parámetros por defecto, cada verificación toma unos 50–100 ms.

**Constraints**:
- No se revela si un email existe, ni por el mensaje ni por el tiempo de respuesta (R5).
- Nunca aparecen contraseñas, hashes ni tokens en claro en respuestas o logs.
- Las pantallas usan solo tokens del design system.
- Reiniciar el backend invalida todas las sesiones.

**Scale/Scope**: 4 cuentas de seed, 6 endpoints, 4 rutas del front (2 Ingresos y 2 pantallas mínimas de destino) y unos 5 componentes del design system.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple | Estado |
|---|---|---|
| **I. El diseño es la especificación** | La spec referencia Compradores 01 y Organizadores 01. Los textos y estados están en [rutas-front.md](contracts/rutas-front.md), con voseo y sentence case. Los errores van sin rojo y los botones deshabilitados quedan al 45% sin esconderse. Los tokens salen de `design-system.md` (R12). Lo que el diseño no define se resolvió con `/speckit-clarify`: los botones fuera de alcance, el cierre de sesión, las direcciones de cada app y el panel en pantallas chicas. Los textos de error que el diseño no trae se redactan con la voz del sistema; no son pantallas nuevas. | ✅ |
| **II. Test-First en el backend** | En las tareas, los tests van antes que el código que cubren: unitarios de `contrasenas` y `autenticacionService`, e integración de los 6 endpoints, incluyendo 400, 401, otro tipo de cuenta, sesión cerrada y que la respuesta no incluya el hash. | ✅ (lo hace cumplir `/speckit-tasks`) |
| **III. Backend monolito por capas** | `routes → controllers → services → repository → models`, más `dto/`, `schemas/` y `errors/`. La lógica (verificar credenciales, crear, validar y cerrar sesiones) vive en `services/`. Se agrega `middlewares/` (ver Complexity Tracking). | ✅ con justificación |
| **IV. Contratos OpenAPI** | El contrato está en [contracts/sesiones.openapi.yaml](contracts/sesiones.openapi.yaml) y se copia a `@openapi` en `routes/`. Se verifica en `/docs` (quickstart). | ✅ |
| **V. Español** | Las entidades se llaman Comprador, Organizador y Sesión; las rutas, `/compradores/sesiones` y `/organizadores/sesiones`; los campos, `contrasena`, `nombre`, `apellido`. El único término técnico en inglés es `token`. | ✅ |
| **Stack y persistencia** | Express 5 + ESM, Expo SDK 58. Persistencia en memoria en `repository/`, con seed al iniciar y `reiniciar()` para los tests. Las dependencias nuevas se justifican en research. | ✅ |
| **Flujo** | Rama `Feature/001-login-email-password`. Quality gates: tests, lint y `/docs`. | ✅ |

**Re-check post-diseño (Phase 1)**: sin cambios. El modelo de datos, los contratos y el quickstart respetan los cinco principios. No hay violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/001-login-email-password/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── sesiones.openapi.yaml
│   └── rutas-front.md
├── checklists/requirements.md
└── tasks.md             # lo genera /speckit-tasks
```

### Source Code (repository root)

```text
aiTicketIt-back/
├── app.js                          # NUEVO: crea y exporta la app (sin listen), monta rutas y el manejador de errores
├── index.js                        # carga el seed, importa app y llama a listen
├── swagger.js                      # apis: ./app.js, ./index.js, ./routes/*.js
├── routes/
│   └── sesiones.js                 # /compradores/sesiones y /organizadores/sesiones (+ /actual), con @openapi
├── controllers/
│   └── sesionesController.js       # traduce HTTP ↔ autenticacionService
├── services/
│   ├── autenticacionService.js     # ingresar(tipo, email, contrasena), obtenerSesion(tipo, token), cerrarSesion(tipo, token)
│   └── contrasenas.js              # hashear / verificar con scrypt (R4)
├── repository/
│   ├── compradoresRepository.js
│   ├── organizadoresRepository.js
│   ├── sesionesRepository.js
│   └── seed.js                     # cuentas de ejemplo con hashes ya calculados
├── models/
│   ├── Comprador.js
│   ├── Organizador.js
│   └── Sesion.js
├── dto/
│   └── sesionDto.js                # comprador/organizador sin contrasenaHash
├── schemas/
│   └── ingresoSchema.js            # zod (R3)
├── errors/
│   ├── ErrorDeDominio.js           # base + CredencialesInvalidas, SesionInvalida, DatosInvalidos
│   └── manejadorDeErrores.js       # formato JSON único (R8)
├── middlewares/
│   ├── validar.js                  # validar(schema) → 400 DATOS_INVALIDOS
│   └── requiereSesion.js           # requiereSesion(tipo) → req.sesion o 401 SESION_INVALIDA
└── tests/
    ├── helpers/
    │   └── estado.js               # reiniciarEstado(): reinicia los tres repositorios
    ├── unit/
    │   ├── ingresoSchema.test.js
    │   ├── contrasenas.test.js
    │   ├── repositorios.test.js
    │   └── autenticacionService.test.js
    └── integration/                # un archivo por historia
        ├── sesionesCompradores.test.js   # US1
        ├── sesionesOrganizadores.test.js # US2
        ├── sesionesTipos.test.js         # US3
        ├── sesionActual.test.js          # US4
        └── docs.test.js                  # /docs.json coincide con el contrato

aiTicketIt-front/src/
├── app/
│   ├── _layout.tsx                 # SesionProvider, fuentes, splash hasta resolver la sesión; reemplaza las tabs del template
│   ├── (compradores)/
│   │   ├── _layout.tsx             # Stack.Protected por sesión de comprador
│   │   ├── index.tsx               # Compradores 01 · Ingreso
│   │   └── explorar.tsx            # destino mínimo
│   └── organizadores/
│       ├── _layout.tsx             # Stack.Protected por sesión de organizador
│       ├── index.tsx               # Organizadores 01 · Ingreso
│       └── mis-eventos.tsx         # destino mínimo con DesktopNav
├── api/
│   ├── cliente.ts                  # fetch con EXPO_PUBLIC_API_URL, Bearer, mapeo de errores
│   └── sesiones.ts                 # ingresar / obtenerSesionActual / cerrarSesion por tipo
├── sesion/
│   ├── SesionProvider.tsx          # estado de las dos sesiones + validación al iniciar (R11)
│   ├── almacenamientoSesion.ts     # expo-secure-store
│   └── almacenamientoSesion.web.ts # localStorage
├── lib/
│   └── validacionIngreso.ts        # mismas reglas y mensajes que ingresoSchema
├── theme/
│   └── tokens.ts                   # tokens del design system (reemplaza constants/theme.ts)
└── components/ds/
    ├── BrandMark.tsx
    ├── Button.tsx
    ├── TextField.tsx               # incluye FieldError
    ├── DividerText.tsx             # separador "o"
    ├── DesktopNav.tsx              # barra del panel de organizadores
    └── FormularioIngreso.tsx       # formulario compartido por los dos Ingresos
```

Se eliminan del front los archivos de demo del template de Expo (`app/index.tsx`, que si queda choca con `(compradores)/index.tsx` en `/`; `explore.tsx`, `app-tabs*`, `animated-icon*`, `hint-row`, `web-badge`, `external-link`, `collapsible`, `themed-*`, `constants/theme.ts`, `hooks/use-theme*`) a medida que se dejan de usar.

**Structure Decision**: se mantienen los dos proyectos que ya existen (`aiTicketIt-back/` y `aiTicketIt-front/`). El backend respeta las capas de la constitución. El front separa las dos apps por grupo/carpeta de rutas y comparte la sesión, la API y los componentes del design system.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Directorio `middlewares/` (no figura entre las capas de la constitución) | `validar(schema)` y `requiereSesion(tipo)` se ejecutan antes de cualquier controller y los van a reutilizar todas las features. No pertenecen a ninguna capa: no son rutas, ni controllers, ni lógica de negocio. La lógica sigue en `services/`, porque el middleware solo extrae el token y llama a `autenticacionService.obtenerSesion`. | Repetir la validación en cada controller duplica código y es fácil de olvidar. Ponerlos en `routes/` mezcla definición de endpoints con lógica reutilizable. |
| Separar `app.js` de `index.js` | supertest necesita la app sin un puerto abierto (R2). | Levantar un servidor real por test es más lento y frágil. |
