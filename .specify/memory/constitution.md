<!--
Sync Impact Report (1.1.0)
- Version change: 1.0.0 → 1.1.0 (MINOR: guía ampliada)
- Sección modificada: "Stack y restricciones técnicas" — se fija la persistencia en memoria
  detrás de repository/, con seed al iniciar y reinicio de estado para tests (requerimiento
  del enunciado). Antes la persistencia se elegía en el primer plan.md.
- Principios: sin cambios. Secciones agregadas/eliminadas: ninguna. TODOs: ninguno.

Sync Impact Report (1.0.0)
- Version change: (template sin completar) → 1.0.0
- Principios definidos (antes: placeholders del template):
  - [PRINCIPLE_1_NAME] → I. El diseño es la especificación
  - [PRINCIPLE_2_NAME] → II. Test-First en el backend (NO NEGOCIABLE)
  - [PRINCIPLE_3_NAME] → III. Backend monolito por capas
  - [PRINCIPLE_4_NAME] → IV. Contratos de API documentados con OpenAPI
  - [PRINCIPLE_5_NAME] → V. Un dominio, un idioma: español
- Secciones agregadas: "Stack y restricciones técnicas", "Flujo de desarrollo y calidad"
- Secciones eliminadas: ninguna
- Templates revisados (no modificados, leen la constitución en runtime):
  - .specify/templates/plan-template.md ✅ (el "Constitution Check" se completa por feature)
  - .specify/templates/spec-template.md ✅
  - .specify/templates/tasks-template.md ✅ (los tests de backend dejan de ser opcionales: Principio II)
- TODOs diferidos: ninguno
-->

# AI Ticket It Constitution

## Core Principles

### I. El diseño es la especificación

- Toda spec y toda implementación de UI MUST respetar el design system
  (`Diseño de AI Ticket It/design-system.md`) y las pantallas
  (`Diseño de AI Ticket It/pantallas.md`).
- Cada spec MUST referenciar las pantallas que cubre por su número y nombre
  (p. ej. "Compradores 05 · Elegir entradas") y adoptar las reglas de negocio
  documentadas en `pantallas.md`.
- La UI MUST usar únicamente tokens del design system (color, tipografía, espaciado,
  radios, sombras, tamaños); no se permiten valores sueltos que ya existan como token.
- Los textos MUST seguir la voz del sistema: voseo rioplatense, sentence case,
  formato de plata (`$ 18.000`) y fechas (`Sáb 21 nov · 21:00`).
- Lo que el diseño no define (registro, datos personales, etc.) MUST quedar marcado
  como aclaración en la spec y resolverse con `/speckit-clarify`, no inventarse en
  la implementación.
- Si una feature necesita un componente o pantalla nueva, primero se actualiza el
  diseño (artifact y archivos `.md`) y después se implementa.

**Rationale:** los wireframes y el design system son el acuerdo sobre el producto;
mantenerlos como fuente de verdad evita divergencias entre lo diseñado y lo construido.

### II. Test-First en el backend (NO NEGOCIABLE)

- Toda feature del backend MUST desarrollarse con TDD: primero se escriben los tests,
  se verifica que fallen (rojo), después se implementa lo mínimo para que pasen (verde)
  y por último se refactoriza.
- En `tasks.md`, las tareas de tests de backend MUST aparecer antes que las de
  implementación que cubren y no son opcionales.
- Cada endpoint MUST tener tests de integración (request HTTP → respuesta, incluyendo
  casos de error y validaciones). Cada regla de negocio en `services/` MUST tener tests
  unitarios.
- Una feature de backend no se considera terminada si algún test falla o si hay
  lógica nueva sin test.

**Rationale:** el backend concentra las reglas de negocio (cupos, estados de compra,
cancelaciones, calificaciones); los tests escritos antes las fijan como contrato
verificable.

### III. Backend monolito por capas

- El backend es un único servicio Node.js + Express (ES modules) que sirve a las dos
  apps del front.
- El código MUST respetar las capas existentes y su dirección de dependencias:
  `routes` → `controllers` → `services` → `repository` → `models`. Además:
  `dto/` para entrada/salida, `schemas/` para validación y `errors/` para errores
  de dominio.
- Las reglas de negocio MUST vivir en `services/`. Los controllers solo traducen
  HTTP ↔ servicio. El acceso a datos MUST pasar por `repository/`.
- Toda entrada MUST validarse contra un schema antes de llegar al servicio. Los errores
  MUST responder con un formato JSON consistente y el código HTTP correcto.
- No se agregan nuevos servicios, procesos ni capas sin justificarlo en el plan
  (sección "Complexity Tracking").

**Rationale:** una estructura predecible por capas mantiene el monolito simple de
testear y de recorrer en un trabajo práctico individual.

### IV. Contratos de API documentados con OpenAPI

- Todo endpoint MUST estar documentado con comentarios `@openapi` (swagger-jsdoc) en
  su archivo de `routes/`, incluyendo request, respuestas exitosas y respuestas de error.
- La documentación MUST coincidir con el comportamiento real y quedar visible en `/docs`
  (`/docs.json` para la especificación).
- Cada `plan.md` MUST definir los contratos en `contracts/` antes de implementar. El
  front consume la API según esos contratos.
- Un cambio de contrato que rompa compatibilidad MUST actualizar en el mismo cambio la
  documentación, los tests y el front que lo consume.

**Rationale:** las dos apps dependen del mismo backend; un contrato explícito permite
desarrollar front y back por separado sin sorpresas.

### V. Un dominio, un idioma: español

- Los textos de la interfaz, las specs y la documentación MUST estar en español.
- Los nombres del dominio MUST ser los del diseño y del CLAUDE.md: evento, tipo de
  entrada, cupo, compra, comprador, organizador, consulta, calificación, favorito.
  Los estados MUST usar exactamente los nombres definidos (compra: Pendiente de pago,
  Confirmada, Utilizada, Cancelada, Reembolsada; evento: Publicado, Borrador, Finalizado).
- El mismo concepto MUST llamarse igual en la spec, en los modelos y endpoints del
  backend y en el front. Las palabras técnicas propias del framework o del lenguaje
  pueden quedar en inglés.

**Rationale:** un vocabulario único entre diseño, specs y código reduce errores de
traducción y hace que el código se lea igual que el dominio.

## Stack y restricciones técnicas

- **Backend:** Node.js + Express 5, ES modules (`"type": "module"`), en
  `aiTicketIt-back/`. Documentación con swagger-jsdoc + swagger-ui-express en `/docs`.
  CORS configurable con `ALLOWED_ORIGINS`, puerto con `PORT` (por defecto 3000).
- **Front:** un único proyecto Expo (React Native + TypeScript, expo-router con rutas
  basadas en archivos en `src/app/`), en `aiTicketIt-front/`. Contiene dos apps:
  - **Compradores:** pensada para mobile (390 × 844).
  - **Organizadores:** pensada para web/desktop (1280 × 800).
  Las dos comparten tokens y componentes del design system. Cada lado MUST tener sus
  propias rutas y su propio flujo de autenticación.
- **Autenticación:** flujos separados para compradores y organizadores. El login con
  Google/Apple es solo para compradores.
- **Pagos:** son simulados; no se integra ningún procesador de pago real.
- **Persistencia:** en memoria, como exige el enunciado del TP ("persistencia en memoria
  para el almacenamiento de datos"). No se usa ninguna base de datos externa (ni Docker,
  ni archivos, ni servicios en la nube).
  - Los datos viven en estructuras en memoria (`Map`/arrays) encapsuladas en
    `repository/`; ninguna otra capa MUST acceder a ellas directamente.
  - Al iniciar, el backend MUST cargar un seed con los datos de ejemplo de
    `Diseño de AI Ticket It/pantallas.md`, para que la app siempre arranque con datos.
  - Los repositorios MUST exponer una forma de reiniciar su estado, para que cada test
    arranque desde un estado conocido.
  - Reiniciar el backend vuelve al estado del seed; es el comportamiento esperado.
- El framework de tests y cualquier dependencia nueva se eligen y
  justifican en el `plan.md` de la feature que los introduce por primera vez, y desde
  ahí son el estándar del proyecto.

## Flujo de desarrollo y calidad

- **Branches:** `{TipoDeDesarrollo}/{nombre-de-desarrollo}` en kebab-case, con
  `TipoDeDesarrollo` ∈ {`Feature`, `Fix`, `HotFix`}. Los branches de features creados por
  Spec Kit llevan además el número de la spec: `Feature/001-nombre-feature`.
- **Spec-driven:** toda feature pasa por `/speckit-specify` → `/speckit-clarify` →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
  Una spec cubre una feature chica e independiente.
- **Specs:** describen el qué y el por qué, sin detalles técnicos, con escenarios de
  aceptación verificables y referencias a las pantallas del diseño.
- **Quality gates antes de mergear a `main`:**
  - Todos los tests del backend pasan.
  - `npm run lint` del front pasa sin errores.
  - Los endpoints nuevos o modificados aparecen correctamente en `/docs`.
  - Las pantallas implementadas coinciden con el diseño (tokens, textos, estados vacío,
    deshabilitado y error).
- Los cambios llegan a `main` por Pull Request; no se commitea directo a `main`.

## Governance

- Esta constitución tiene prioridad sobre cualquier otra práctica del proyecto. El
  `CLAUDE.md` de la raíz es la guía operativa y MUST mantenerse consistente con ella.
- Cada `plan.md` MUST completar el "Constitution Check" contra estos principios. Toda
  excepción MUST justificarse en "Complexity Tracking"; sin justificación, el plan no
  avanza.
- **Enmiendas:** se proponen con `/speckit-constitution`, explicando el motivo, y se
  commitean en un branch propio. Si la enmienda cambia el flujo o las capas, se
  actualizan en el mismo cambio el `CLAUDE.md` y los artefactos afectados.
- **Versionado (semver):** MAJOR cuando se elimina o redefine un principio de forma
  incompatible; MINOR cuando se agrega un principio o sección o se amplía una guía;
  PATCH para aclaraciones y redacción.
- **Cumplimiento:** cada PR se revisa contra esta constitución, con especial atención a
  TDD en backend (II), documentación OpenAPI (IV) y fidelidad al diseño (I).

**Version**: 1.1.0 | **Ratified**: 2026-11-18 | **Last Amended**: 2026-11-18
