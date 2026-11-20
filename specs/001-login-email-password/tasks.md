---

description: "Tareas de la feature 001: ingreso con email y contraseña"
---

# Tasks: Ingreso con email y contraseña (compradores y organizadores)

**Input**: documentos de diseño en `specs/001-login-email-password/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **obligatorios en el backend** (constitución, Principio II: TDD no negociable). Cada tarea de test va antes de la implementación que cubre y **tiene que fallar (rojo) antes de implementar**. En el front no hay tests automáticos; la calidad se controla con `npm run lint`, `npx tsc --noEmit` y [quickstart.md](quickstart.md).

**Organization**: las tareas están agrupadas por historia de usuario, así cada una se puede implementar y probar por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin depender de tareas pendientes de la misma fase)
- **[Story]**: historia de usuario de la spec (US1–US4)
- Rutas relativas a la raíz del repositorio: `aiTicketIt-back/` (API) y `aiTicketIt-front/` (Expo)


---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencias, scripts y limpieza del template

- [X] T001 Agregar `zod` (4.x) como dependencia y `supertest` (7.x) como devDependency; definir los scripts `"test": "node --test"` y `"start": "node index.js"` en aiTicketIt-back/package.json (research R1, R3)
- [X] T002 [P] Crear los directorios de capas `routes/`, `controllers/`, `services/`, `repository/`, `models/`, `dto/`, `schemas/`, `errors/`, `middlewares/`, `tests/unit/`, `tests/integration/` y `tests/helpers/` en aiTicketIt-back/ (plan, Project Structure)
- [X] T003 [P] Instalar con `npx expo install` `expo-secure-store`, `expo-font`, `@expo-google-fonts/inter`, `react-native-svg` y `phosphor-react-native` en aiTicketIt-front/package.json. Si `phosphor-react-native` no es compatible con RN 0.88, aplicar el plan B de research R12 (SVG de Phosphor con `react-native-svg`) y dejarlo anotado en research.md
- [X] T004 [P] Borrar los archivos de demo del template de Expo listados en plan.md (`src/app/index.tsx` —si queda, choca con `(compradores)/index.tsx` en `/`—, `src/app/explore.tsx`, `src/components/app-tabs*`, `animated-icon*`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `ui/collapsible.tsx`, `themed-*`, `src/constants/theme.ts`, `src/hooks/use-theme*`) en aiTicketIt-front/src/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura que necesitan todas las historias: app testeable, errores, validación, contraseñas, repositorios, seed y la base del front

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase

### Backend: tests primero

- [X] T005 [P] Escribir tests unitarios de `ingresoSchema` en aiTicketIt-back/tests/unit/ingresoSchema.test.js: recorta y pasa a minúsculas el email, **no** recorta la contraseña, y devuelve los mensajes por campo de data-model.md § "Validaciones de entrada" (vacío, formato inválido, contraseña vacía)
- [X] T006 [P] Escribir tests unitarios de `contrasenas` en aiTicketIt-back/tests/unit/contrasenas.test.js: `hashear` produce el formato de data-model.md `Comprador.contrasenaHash` con salt distinto en cada llamada; `verificar` devuelve true/false; `verificarContraHashFicticio` existe y siempre devuelve false (research R4, R5)
- [X] T007 [P] Escribir tests unitarios de los repositorios en aiTicketIt-back/tests/unit/repositorios.test.js: `buscarPorEmail` y `buscarPorId` de compradores y organizadores; `reiniciar()` vuelve al seed; `sesionesRepository` guarda, busca por `tokenHash` y elimina (data-model.md `Sesion.tokenHash`)

### Backend: implementación

- [X] T008 Separar la app: crear aiTicketIt-back/app.js, que exporta `app` con `express.json`, CORS y `/health` (el comentario `@openapi` se mueve con la ruta), y dejar aiTicketIt-back/index.js solo con la carga del seed y `listen`; sumar `./app.js` a `apis` en aiTicketIt-back/swagger.js (research R2)
- [X] T009 [P] Crear `ErrorDeDominio` (codigo, mensaje, status, campos opcionales) y sus subclases `CredencialesInvalidas` (401 `CREDENCIALES_INVALIDAS`, "El email o la contraseña no son correctos."), `SesionInvalida` (401 `SESION_INVALIDA`, "Tu sesión no es válida. Ingresá de nuevo.") y `DatosInvalidos` (400 `DATOS_INVALIDOS`, "Revisá los datos enviados.") en aiTicketIt-back/errors/ErrorDeDominio.js (research R8, contracts/sesiones.openapi.yaml `components.responses`)
- [X] T010 Crear el manejador de errores en aiTicketIt-back/errors/manejadorDeErrores.js, que traduce `ErrorDeDominio` al formato `{ error: { codigo, mensaje, campos? } }` y cualquier otro error a 500 `ERROR_INTERNO` sin detalles, sin registrar nunca el body del request; montarlo al final en aiTicketIt-back/app.js (research R8, FR-012)
- [X] T011 [P] Implementar `ingresoSchema` con zod en aiTicketIt-back/schemas/ingresoSchema.js, según data-model.md § "Validaciones de entrada" (campos `email` y `contrasena`), hasta que T005 pase
- [X] T012 Implementar el middleware `validar(schema)` en aiTicketIt-back/middlewares/validar.js: reemplaza `req.body` por los datos normalizados o lanza `DatosInvalidos` con `campos[]` (depende de T009 y T011)
- [X] T013 [P] Implementar `hashear`, `verificar` (con `crypto.scrypt` y `timingSafeEqual`) y `verificarContraHashFicticio` en aiTicketIt-back/services/contrasenas.js hasta que T006 pase (research R4, R5)
- [X] T014 [P] Crear los modelos en aiTicketIt-back/models/Comprador.js, aiTicketIt-back/models/Organizador.js y aiTicketIt-back/models/Sesion.js con los campos de data-model.md (`Comprador.id`, `Comprador.nombre`, `Comprador.apellido`, `Comprador.email`, `Comprador.contrasenaHash`; `Organizador.id`, `Organizador.nombre`, `Organizador.email`, `Organizador.contrasenaHash`; `Sesion.tokenHash`, `Sesion.tipo`, `Sesion.usuarioId`, `Sesion.creadaEn`)
- [X] T015 Generar una vez el hash de la contraseña de desarrollo `Entradas2026` con `hashear` (por ejemplo, con `node -e`) y crear aiTicketIt-back/repository/seed.js con las 4 cuentas de data-model.md § "Seed" usando ese hash. La contraseña en claro **no** queda en el código (depende de T013 y T014; research R4, R14)
- [X] T016 Implementar aiTicketIt-back/repository/compradoresRepository.js y aiTicketIt-back/repository/organizadoresRepository.js (`buscarPorEmail`, `buscarPorId`, `reiniciar`; email único y normalizado según data-model.md `Comprador.email` y `Organizador.email`) cargando desde seed.js, hasta que pase la parte de T007 que les corresponde
- [X] T017 [P] Implementar aiTicketIt-back/repository/sesionesRepository.js (`guardar`, `buscarPorTokenHash`, `eliminar`, `reiniciar`) con `Map` indexado por data-model.md `Sesion.tokenHash`, hasta que T007 pase
- [X] T018 Crear el helper `reiniciarEstado()`, que llama a `reiniciar()` de los tres repositorios, en aiTicketIt-back/tests/helpers/estado.js, y llamar a los `reiniciar()` al iniciar en aiTicketIt-back/index.js
- [X] T019 [P] Crear `aCompradorDto` y `aOrganizadorDto` en aiTicketIt-back/dto/sesionDto.js, que devuelven solo los campos de contracts/sesiones.openapi.yaml `Comprador`/`Organizador` y excluyen data-model.md `Comprador.contrasenaHash` y `Organizador.contrasenaHash` (FR-012)

### Front: base compartida

- [X] T020 [P] Crear aiTicketIt-front/src/theme/tokens.ts con los tokens de color, tipografía, espaciado, radios, alturas (`touch-target`, `cta-height`, `control-height`) y sombras de `Diseño de AI Ticket It/design-system.md` (research R12)
- [X] T021 [P] Crear `validarEmail` y `validarContrasena` en aiTicketIt-front/src/lib/validacionIngreso.ts, con las mismas reglas y mensajes que data-model.md § "Validaciones de entrada"
- [X] T022 [P] Crear el cliente HTTP en aiTicketIt-front/src/api/cliente.ts: base `EXPO_PUBLIC_API_URL` (por defecto `http://localhost:3000`), header `Authorization: Bearer` opcional, errores de la API como `{ codigo, mensaje }` y fallas de red como `codigo: "RED"` (research R13)
- [X] T023 [P] Crear el componente `BrandMark` (escenario con telón y haces en la rampa de acento, tamaño normal de 200px y compacto de 150px, wordmark "AI Ticket It") en aiTicketIt-front/src/components/ds/BrandMark.tsx
- [X] T024 [P] Crear el componente `Button` (variantes `primary`/`secondary`/`cta`; `disabled` al 45% sin esconderse; estado `enviando`; foco visible en acento en web; `accessibilityState`) en aiTicketIt-front/src/components/ds/Button.tsx
- [X] T025 [P] Crear el componente `TextField` (label arriba, fondo `surface`, borde `divider`, foco en acento, 44px en mobile y 36px en desktop, `aria-invalid` con borde `accent-400` y `FieldError` con ícono `warning-circle` en 12px `accent-300`, `secureTextEntry` opcional) en aiTicketIt-front/src/components/ds/TextField.tsx
- [X] T026 [P] Crear el separador con texto "o" en aiTicketIt-front/src/components/ds/DividerText.tsx
- [X] T027 Crear el componente `FormularioIngreso` en aiTicketIt-front/src/components/ds/FormularioIngreso.tsx: campos Email (placeholder `nombre@correo.com`) y Contraseña, este último con `secureTextEntry` (FR-005); validación mientras se escribe, con mensaje solo en campos ya tocados; **Ingresar** deshabilitado con la nota "Revisá los campos marcados para ingresar."; un solo envío a la vez; Enter envía; muestra un error general y conserva lo escrito. Usa los textos de contracts/rutas-front.md y depende de T021, T024 y T025. Traduce el `codigo` del error a los mensajes de contracts/rutas-front.md: `CREDENCIALES_INVALIDAS` → "El email o la contraseña no son correctos."; `RED` u otro error → "No pudimos conectarnos. Probá de nuevo en un rato."
- [X] T028 Crear `SesionProvider` en aiTicketIt-front/src/sesion/SesionProvider.tsx, con estado en memoria para `comprador` y `organizador` (data-model.md § "Estado de sesión en el front") y las acciones `iniciar(tipo, datos)` y `limpiar(tipo)`. La persistencia llega en US4
- [X] T029 Reescribir aiTicketIt-front/src/app/_layout.tsx: `Stack` raíz sin header, carga de Inter, `SesionProvider`, fondo `color-bg` y ocultar la splash cuando cargan las fuentes (depende de T020 y T028)

**Checkpoint**: `npm test` del backend pasa (T005–T007 en verde) y el front compila sin pantallas del template

---

## Phase 3: User Story 1 - El comprador ingresa con email y contraseña (Priority: P1) 🎯 MVP

**Goal**: Sofía ingresa en Compradores 01 · Ingreso y llega a Explorar con su sesión

**Independent Test**: con `sofia.gomez@correo.com` / `Entradas2026`, ingresar desde `/` y ver "Hola, Sofía" en Explorar (quickstart, escenarios 1–4)

### Tests for User Story 1 ⚠️ (escribir primero, tienen que fallar)

- [X] T030 [P] [US1] Escribir tests unitarios de `ingresar("comprador", email, contrasena)` en aiTicketIt-back/tests/unit/autenticacionService.test.js: con datos correctos devuelve un token y el comprador; acepta el email con mayúsculas y espacios; con contraseña incorrecta o email inexistente lanza `CredencialesInvalidas` y en el segundo caso llama a `verificarContraHashFicticio`; guarda la sesión con el SHA-256 del token y no el token en claro (data-model.md `Sesion.tokenHash`, `Sesion.tipo`, `Sesion.usuarioId`)
- [X] T031 [P] [US1] Escribir tests de integración de `POST /compradores/sesiones` en aiTicketIt-back/tests/integration/sesionesCompradores.test.js: 201 con `token` y `comprador` según el contrato, sin `contrasenaHash`; " Sofia.Gomez@correo.com " ingresa; una contraseña con espacios extra se rechaza; 401 `CREDENCIALES_INVALIDAS` con el mensaje exacto para contraseña incorrecta y email inexistente; 400 `DATOS_INVALIDOS` con `campos` para email inválido o campos vacíos. El ingreso correcto responde en menos de 500 ms, medido en el test (deja margen para el < 2 s de SC-001 en la experiencia completa). Usa `reiniciarEstado()` en `beforeEach`

### Implementation for User Story 1

- [X] T032 [US1] Implementar `ingresar(tipo, email, contrasena)` para `comprador` en aiTicketIt-back/services/autenticacionService.js: busca en `compradoresRepository`, verifica con `contrasenas` (o con el hash ficticio si no existe), genera el token con `crypto.randomBytes(32)` en base64url y guarda una `Sesion` con data-model.md `Sesion.tokenHash` (SHA-256), `Sesion.tipo`, `Sesion.usuarioId` y `Sesion.creadaEn`. Tiene que hacer pasar T030 (research R5, R6)
- [X] T033 [US1] Implementar el handler `ingresar` en aiTicketIt-back/controllers/sesionesController.js: llama al servicio y responde 201 `{ token, comprador: aCompradorDto(...) }`
- [X] T034 [US1] Crear `crearRouterSesiones(tipo)` con `POST /` (más `validar(ingresoSchema)`) y su comentario `@openapi` copiado de contracts/sesiones.openapi.yaml en aiTicketIt-back/routes/sesiones.js; montarlo en `/compradores/sesiones` en aiTicketIt-back/app.js. Tiene que hacer pasar T031
- [X] T035 [P] [US1] Crear `ingresar(tipo, email, contrasena)` en aiTicketIt-front/src/api/sesiones.ts, según contracts/sesiones.openapi.yaml
- [X] T036 [US1] Crear aiTicketIt-front/src/app/(compradores)/_layout.tsx (Stack sin header, todavía sin guards) y aiTicketIt-front/src/app/(compradores)/index.tsx como Compradores 01 · Ingreso: `BrandMark`, "AI Ticket It", "Ingresá para descubrir eventos y comprar entradas.", `FormularioIngreso` y, debajo, "o" + **Ingresar con Google** + **Ingresar con Apple** + "¿No tenés cuenta? Registrate", todos deshabilitados al 45% (FR-002). Al ingresar bien llama a `iniciar("comprador", …)` y hace `router.replace("/explorar")`; los errores los muestra `FormularioIngreso` (T027)
- [X] T037 [US1] Crear aiTicketIt-front/src/app/(compradores)/explorar.tsx como destino mínimo: saludo "Hola, {nombre}" con el avatar de iniciales (contracts/rutas-front.md)

**Checkpoint**: US1 funciona sola. Pasar los escenarios 1–4 de quickstart y `npm test` en verde

---

## Phase 4: User Story 2 - El organizador ingresa al panel de organizadores (Priority: P1)

**Goal**: el organizador ingresa en `/organizadores` y llega a Mis eventos con el nombre de su compañía

**Independent Test**: con `produccion@latrama.com.ar` / `Entradas2026`, ingresar con Enter desde `/organizadores`, también con la ventana a 390px (quickstart, escenarios 7, 9 y 10)

### Tests for User Story 2 ⚠️

- [X] T038 [P] [US2] Agregar tests unitarios de `ingresar("organizador", …)` en aiTicketIt-back/tests/unit/autenticacionService.test.js: ingreso correcto con los organizadores del seed y `CredencialesInvalidas` con contraseña incorrecta
- [X] T039 [P] [US2] Escribir tests de integración de `POST /organizadores/sesiones` en aiTicketIt-back/tests/integration/sesionesOrganizadores.test.js: 201 con `organizador` según el contrato (sin `contrasenaHash`) para las 3 cuentas del seed; 401 y 400 igual que en T031

### Implementation for User Story 2

- [X] T040 [US2] Extender `ingresar` en aiTicketIt-back/services/autenticacionService.js con un mapa `tipo → repositorio` que incluya `organizadoresRepository` (data-model.md `Organizador.email`), y en aiTicketIt-back/controllers/sesionesController.js responder con `aOrganizadorDto` según el tipo, hasta que T038 pase
- [X] T041 [US2] Montar `crearRouterSesiones("organizador")` en `/organizadores/sesiones` en aiTicketIt-back/app.js y agregar su `@openapi` en aiTicketIt-back/routes/sesiones.js, hasta que T039 pase
- [X] T042 [P] [US2] Crear el componente `DesktopNav` (marca, link "Mis eventos", nombre de la compañía y avatar de iniciales de 36px en `accent-900`/`accent-200`) en aiTicketIt-front/src/components/ds/DesktopNav.tsx
- [X] T043 [P] [US2] Crear aiTicketIt-front/src/app/organizadores/_layout.tsx (Stack sin header, todavía sin guards) y aiTicketIt-front/src/app/organizadores/index.tsx como Organizadores 01 · Ingreso: tarjeta con `shadow-md`, `BrandMark` compacto, "AI Ticket It", "Panel de organizadores" y `FormularioIngreso` con controles de 36px; sin Google, Apple ni registro; Enter envía (FR-008); ancho máximo de tarjeta que se adapta desde 390px con `pad-screen-x`, sin scroll horizontal (FR-003). Al ingresar bien llama a `iniciar("organizador", …)` y hace `router.replace("/organizadores/mis-eventos")`. Los errores de credenciales y de red los muestra `FormularioIngreso` (T027); cubre US2-2
- [X] T044 [US2] Crear aiTicketIt-front/src/app/organizadores/mis-eventos.tsx como destino mínimo: `DesktopNav` con el nombre de la compañía y el título "Mis eventos" (depende de T042)

**Checkpoint**: US1 y US2 funcionan por separado. Pasar los escenarios 7, 9 y 10 de quickstart

---

## Phase 5: User Story 3 - Cada app solo acepta su propio tipo de cuenta (Priority: P2)

**Goal**: una cuenta o sesión de un tipo no sirve en la otra app

**Independent Test**: `sofia.gomez@correo.com` en `/organizadores` y `produccion@latrama.com.ar` en `/` se rechazan con el mensaje genérico; un comprador con sesión que abre `/organizadores/mis-eventos` termina en Organizadores 01 (quickstart, escenarios 8 y 11)

### Tests for User Story 3 ⚠️

- [X] T045 [P] [US3] Escribir tests unitarios de `obtenerSesion(tipo, token)` en aiTicketIt-back/tests/unit/autenticacionService.test.js: con un token válido devuelve el usuario; con un token inexistente, un token de otro tipo (data-model.md `Sesion.tipo`) o un usuario que ya no existe lanza `SesionInvalida`
- [X] T046 [P] [US3] Escribir tests de integración en aiTicketIt-back/tests/integration/sesionesTipos.test.js: credenciales de comprador en `POST /organizadores/sesiones` y de organizador en `POST /compradores/sesiones` devuelven 401 con el mensaje idéntico; un token de comprador en `GET /organizadores/sesiones/actual` (y al revés) devuelve 401 `SESION_INVALIDA`; con un token de su propio tipo, `GET /compradores/sesiones/actual` devuelve 200 `{ comprador }` y `GET /organizadores/sesiones/actual` devuelve 200 `{ organizador }`, los dos según el contrato y sin `contrasenaHash`; sin header `Authorization` o con un formato que no sea `Bearer`, los dos devuelven 401; el mismo email puede existir como comprador y como organizador, y cada uno ingresa solo en su app (data-model.md `Comprador.email`, `Organizador.email`)

### Implementation for User Story 3

- [X] T047 [US3] Implementar `obtenerSesion(tipo, token)` en aiTicketIt-back/services/autenticacionService.js: hashea el token, lo busca, compara `Sesion.tipo` y carga el usuario (data-model.md "Válida"), hasta que T045 pase
- [X] T048 [US3] Implementar el middleware `requiereSesion(tipo)` en aiTicketIt-back/middlewares/requiereSesion.js: lee `Authorization: Bearer`, llama a `obtenerSesion` y deja `req.sesion = { tipo, usuario, tokenHash }`; si falta el header o tiene otro formato, lanza `SesionInvalida`
- [X] T049 [US3] Agregar `GET /actual` con `requiereSesion(tipo)` en aiTicketIt-back/routes/sesiones.js, con su `@openapi` para los dos tipos, y el handler `actual` (200 `{ comprador }` o `{ organizador }` usando los DTO) en aiTicketIt-back/controllers/sesionesController.js, hasta que T046 pase
- [X] T050 [P] [US3] Agregar `obtenerSesionActual(tipo, token)` en aiTicketIt-front/src/api/sesiones.ts
- [X] T051 [US3] Proteger las rutas con `Stack.Protected` según contracts/rutas-front.md: en aiTicketIt-front/src/app/(compradores)/_layout.tsx, `index` con `guard={!sesionComprador}` y `explorar` con `guard={!!sesionComprador}`; en aiTicketIt-front/src/app/organizadores/_layout.tsx, lo mismo con `sesionOrganizador`. Cada lado mira **solo** la sesión de su tipo (FR-016). Quitar los `router.replace` de T036 y T043: desde acá, el guard es lo único que decide la navegación (research R9)

**Checkpoint**: pasar los escenarios 8 y 11 de quickstart. US1 y US2 siguen funcionando

---

## Phase 6: User Story 4 - Las pantallas internas requieren sesión (Priority: P2)

**Goal**: sin sesión no se ven pantallas internas; con una sesión guardada y válida se entra directo; una sesión inválida o cerrada lleva al Ingreso

**Independent Test**: sin sesión, `/explorar` y `/organizadores/mis-eventos` llevan al Ingreso de su app; después de ingresar y reabrir la app se entra directo; si se reinicia el backend se vuelve al Ingreso (quickstart, escenarios 5, 6 y 11)

### Tests for User Story 4 ⚠️

- [X] T052 [P] [US4] Escribir tests unitarios de `cerrarSesion(tipo, token)` en aiTicketIt-back/tests/unit/autenticacionService.test.js: después de cerrar, `obtenerSesion` lanza `SesionInvalida`; cerrar con un token de otro tipo lanza `SesionInvalida` y no borra la sesión
- [X] T053 [P] [US4] Escribir tests de integración en aiTicketIt-back/tests/integration/sesionActual.test.js: para **los dos tipos**, `DELETE /compradores/sesiones/actual` y `DELETE /organizadores/sesiones/actual` devuelven 204 y después el `GET /actual` de ese tipo devuelve 401; `DELETE` sin token devuelve 401 en los dos; `DELETE` con un token del otro tipo devuelve 401 y la sesión sigue valiendo; con dos sesiones del mismo usuario, cerrar una no afecta a la otra; `reiniciarEstado()` (que simula el reinicio del backend) invalida todas las sesiones

### Implementation for User Story 4

- [X] T054 [US4] Implementar `cerrarSesion(tipo, token)` en aiTicketIt-back/services/autenticacionService.js, que valida con `obtenerSesion` y elimina por data-model.md `Sesion.tokenHash`, hasta que T052 pase (FR-018)
- [X] T055 [US4] Agregar `DELETE /actual` (204) con `requiereSesion(tipo)` y su `@openapi` en aiTicketIt-back/routes/sesiones.js y el handler en aiTicketIt-back/controllers/sesionesController.js, hasta que T053 pase
- [X] T056 [P] [US4] Crear `leer(tipo)`, `guardar(tipo, datos)` y `borrar(tipo)` con las claves `sesion.comprador` y `sesion.organizador` en aiTicketIt-front/src/sesion/almacenamientoSesion.ts (expo-secure-store) y aiTicketIt-front/src/sesion/almacenamientoSesion.web.ts (`localStorage` con try/catch) (research R10, data-model.md § "Estado de sesión en el front")
- [X] T057 [P] [US4] Agregar `cerrarSesion(tipo, token)` (`DELETE /actual`) en aiTicketIt-front/src/api/sesiones.ts
- [X] T058 [US4] Completar aiTicketIt-front/src/sesion/SesionProvider.tsx: guardar la sesión en `iniciar`; al montar, leer las dos sesiones y validarlas con `obtenerSesionActual` (con 401 se borra; con error de red se conserva; research R11); exponer `cargando`; agregar `cerrarSesion(tipo)`, que llama a la API y limpia, sin interfaz en esta feature (FR-018) (depende de T056 y T057)
- [X] T059 [US4] En aiTicketIt-front/src/api/cliente.ts, avisar con un callback `alInvalidarSesion(tipo)` cuando una llamada autenticada recibe 401 `SESION_INVALIDA`, y conectarlo en SesionProvider.tsx para borrar esa sesión; el guard de T051 lleva al Ingreso (US4, escenario 4)
- [X] T060 [US4] En aiTicketIt-front/src/app/_layout.tsx, mantener la splash hasta que carguen las fuentes **y** `cargando` sea false, para que el Ingreso no aparezca y salte al abrir con sesión (research R9)

**Checkpoint**: las cuatro historias funcionan. Pasar los escenarios 5, 6 y 11 de quickstart

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T061 [P] Escribir un test de integración en aiTicketIt-back/tests/integration/docs.test.js que verifique que `/docs.json` tiene los 3 paths de cada tipo con los métodos y códigos de respuesta de contracts/sesiones.openapi.yaml (Principio IV)
- [X] T062 [P] Revisar que ningún `console.log` ni el manejador de errores imprima el body, contraseñas, hashes ni tokens en aiTicketIt-back/ (SC-004); corregir lo que aparezca
- [X] T063 [P] Actualizar CLAUDE.md (raíz): ahora hay tests en el backend (`npm test`, `node:test` + supertest) y existen la variable `EXPO_PUBLIC_API_URL`, las rutas `/` y `/organizadores` y la estructura `src/{api,sesion,theme,components/ds}` del front. Dejar como convención que todo endpoint que necesite un usuario usa `requiereSesion(tipo)` y que toda pantalla interna nueva va dentro del `Stack.Protected` de su lado (FR-015)
- [X] T064 Correr los quality gates: `npm test` en aiTicketIt-back/ y `npm run lint` + `npx tsc --noEmit` en aiTicketIt-front/, todos sin errores
- [ ] T065 Recorrer los 14 escenarios de specs/001-login-email-password/quickstart.md en web (1280px y 390px) y en un dispositivo o emulador mobile, y anotar cualquier diferencia con el diseño. En el escenario 4, comprobar que Explorar aparece en menos de 2 s después de tocar **Ingresar** (SC-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; **bloquea** todas las historias
- **US1 y US2 (P1)**: dependen de Foundational. El **backend** de US2 (T040, T041) extiende lo que crea US1 (T032–T034), así que va después. El **front** de US2 (T042, T043) y sus tests (T038, T039) pueden hacerse en paralelo con US1.
- **US3 (P2)**: depende de US1 y US2, porque prueba el cruce entre los dos ingresos
- **US4 (P2)**: depende de US3 (usa `obtenerSesion`, `requiereSesion` y los guards de T051)
- **Polish**: depende de todas las historias

### Within Each User Story

- Tests de backend → verificar que fallan → modelo y servicio → controller y ruta → front
- En `autenticacionService.js`, `sesionesController.js` y `routes/sesiones.js` las tareas de distintas historias tocan el mismo archivo: hacerlas en orden de fase

### Dependency Graph

```text
Setup ─▶ Foundational ─┬─▶ US1 (back) ─▶ US2 (back) ─┐
                       └─▶ US1/US2 (front) ──────────┴─▶ US3 ─▶ US4 ─▶ Polish
```

## Parallel Examples

### Foundational

```text
T005, T006, T007            # tests unitarios de backend
T009, T011, T013, T014      # después de los tests
T020–T026                   # base del front, en paralelo con todo el backend
```

### User Story 1

```text
T030 + T031                 # tests unitario e integración
T035                        # API del front, mientras se implementa el backend (T032–T034)
```

### User Story 2

```text
T038 + T039                 # tests
T042 + T043                 # DesktopNav e Ingreso de organizadores, mientras se hacen T040–T041
```

### User Story 3 / 4

```text
T045 + T046 ; T050          # US3
T052 + T053 ; T056 + T057   # US4
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1): Sofía ingresa y ve Explorar
3. **Parar y validar**: escenarios 1–4 de quickstart y `npm test`

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → el comprador ingresa (MVP)
3. US2 → el organizador ingresa
4. US3 → los tipos de cuenta quedan aislados y las rutas protegidas por tipo
5. US4 → sesión persistente, validación al abrir la app, cierre e invalidación
6. Polish → `/docs`, auditoría de logs, CLAUDE.md y quality gates

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes dentro de la fase
- Verificar que cada test falle antes de implementar (Principio II)
- Commitear después de cada tarea o grupo lógico, en la rama `Feature/001-login-email-password`
- Cada `@openapi` tiene que coincidir con contracts/sesiones.openapi.yaml; si el contrato cambia, actualizar contrato, tests y front juntos (Principio IV)
