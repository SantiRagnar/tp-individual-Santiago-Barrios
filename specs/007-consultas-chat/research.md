# Research: Consultas (chat de la compra)

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Fecha**: 2026-11-22

El Technical Context no tiene ningún NEEDS CLARIFICATION: el stack ya está fijado por la constitución y por las features 001 a 005. Este documento registra las decisiones de diseño que abre esta feature.

---

## R1. Dónde vive la conversación

- **Decision**: un repositorio nuevo, `repository/consultasRepository.js`, indexado por número de compra (`Map<numero, Consulta>`). La consulta se crea **la primera vez que alguien escribe**. Mientras no existe, el servicio se comporta como si hubiera una conversación vacía, y así se cumple FR-001 ("existe desde la compra") sin crear miles de objetos vacíos. Además, el repositorio mantiene un índice `eventoId → Set<numero>` con las compras que tienen mensajes, para armar la lista de Consultas del evento sin recorrer todas las compras.
- **Rationale**: la conversación es de la compra (1:1), pero tiene su propio ciclo de vida, que se escribe muy seguido. Guardarla dentro de `Compra` obligaría a tocar `comprasRepository.guardar` y sus índices en cada mensaje. Además, `Compra` ya la están modificando en paralelo la 004 y la 006, así que agrandarla aumentaría los conflictos de merge.
- **Alternatives considered**:
  - Un array `mensajes` dentro de `Compra`. Se descartó por los conflictos y por mezclar responsabilidades.
  - Un repositorio de mensajes sueltos con `compraNumero`. Se descartó porque para saber el último mensaje o si está leída habría que filtrar todos los mensajes.

## R2. Cómo se representa "leída"

- **Decision**: cada `Consulta` guarda `vistosPorOrganizador` y `vistosPorComprador`: cuántos mensajes había cuando cada parte la abrió por última vez. Con eso:
  - **No leída para el organizador** = el último mensaje es del comprador **y** `vistosPorOrganizador < mensajes.length` (FR-015).
  - **No leída para el comprador** = el último mensaje es del organizador **y** `vistosPorComprador < mensajes.length` (FR-022).
  - Marcar como leída = `vistosPor… = mensajes.length`.
  - Cuando alguien envía un mensaje, también se actualiza su propio contador: escribir implica haber visto la conversación.
- **Rationale**: es determinístico y no depende de comparar timestamps. Dos mensajes en el mismo milisegundo, o el reloj fijado en los tests, no lo rompen. Además cumple tal cual la regla de `pantallas.md` ("el último mensaje es del comprador y el organizador todavía no la abrió").
- **Alternatives considered**: guardar `leidaEn` como fecha y comparar con `enviadoEn`. Es frágil con `fijarAhora()` en los tests y con mensajes del mismo instante.

## R3. Mensajes nuevos sin tocar nada (FR-021, FR-024)

- **Decision**: **sondeo (polling) cada 3 segundos** desde el front, con pedidos incrementales:
  - Chat abierto (los dos lados): `GET …/mensajes?despuesDe={idDelÚltimoMensaje}`. Devuelve solo lo nuevo, casi siempre `[]`.
  - Consultas del evento: además se vuelve a pedir la lista `GET /organizadores/eventos/{id}/consultas`, que es chica.
  - App de compradores (toast): `GET /compradores/consultas/no-leidas`.
  - El sondeo corre solo con la pantalla enfocada (`useFocusEffect`) y la app en primer plano (`AppState`). Hay un único sondeo en curso por pantalla: no se dispara otro si el anterior no terminó.
- **Rationale**: 3 s + la latencia local queda holgado bajo los 5 s de FR-021 y FR-024. No hace falta ninguna dependencia nueva (WebSocket, socket.io o SSE), algo que la constitución pide justificar. Además mantiene el monolito sin conexiones de larga duración y se testea con supertest como el resto. Con 1 a 3 usuarios locales, la carga es despreciable.
- **Alternatives considered**:
  - **WebSocket (socket.io)**: suma una dependencia y un segundo protocolo, y los tests de integración son más difíciles. Es una mejora natural si el TP creciera; queda anotado.
  - **Server-Sent Events**: no hay `EventSource` nativo en React Native sin un polyfill (otra dependencia).
  - **Long polling**: el `await` de una request colgada no rompe nada, pero complica los tests y no aporta nada a esta escala.

## R4. Leer marca como leída: verbo explícito

- **Decision**: marcar como leída es una operación aparte e idempotente, `PUT …/lectura` → 204, que el front llama al abrir la conversación y cada vez que el sondeo trae mensajes nuevos de la otra parte con la conversación abierta (FR-016, FR-021, FR-022). Los `GET` no tienen efectos.
- **Rationale**: un `GET` con efectos rompe la regla de US3, escenario 5 ("entrar a Consultas no marca ninguna"). Además, el sondeo marcaría como leída una conversación que el usuario no está mirando. Con el verbo explícito, el que decide es el front, que sabe qué conversación está abierta.
- **Alternatives considered**: que el `GET` de mensajes marque como leída. Se descartó por lo anterior y porque el toast de la app de compradores también consulta mensajes.

## R5. Endpoints: anidados bajo lo que ya existe

- **Decision**:
  - **Comprador**, bajo `/compradores/compras/{numero}/mensajes` (`GET`, `POST`, `PUT …/lectura`), en el router de compras, que ya exige sesión de comprador y resuelve "compra ajena = 404". Además, `GET /compradores/consultas/no-leidas` para el toast.
  - **Organizador**, bajo `/organizadores/eventos/{id}/consultas` (lista) y `/organizadores/eventos/{id}/consultas/{numero}` (detalle, `POST …/mensajes`, `PUT …/lectura`), en el router de eventos del organizador, que ya resuelve "evento ajeno = 404".
  - Contrato completo: [contracts/consultas.openapi.yaml](contracts/consultas.openapi.yaml).
- **Rationale**: reusa los controles de propiedad que ya existen (`comprasService.obtener`/`compraDe` y `eventosService.obtener`). Las URLs dicen de quién es cada recurso, como en las features 004 y 005.
- **Alternatives considered**: un `/consultas/{numero}` único para los dos tipos de cuenta. Mezclaría dos reglas de propiedad en un mismo endpoint y rompería la convención de prefijos por lado.

## R6. Datos de contexto del chat

- **Decision**:
  - El chat del comprador obtiene la cabecera (evento, organizador, número) del `GET /compradores/compras/{numero}` que ya existe. `aCompraDto` suma un campo `consultaNoLeida: boolean`, que también alimenta el punto de Mis compras y el de **Tengo una consulta** (FR-023) sin pedidos extra.
  - Del lado del organizador, `GET …/consultas/{numero}` devuelve la cabecera de la conversación (comprador, tipo × cantidad, monto, estado) junto con los mensajes, porque Consultas puede abrir una compra que no está en la página de Ventas cargada.
  - El contador del botón **Consultas del evento** sale de `noLeidas` en `GET …/consultas`, que el panel pide al enfocarse.
- **Rationale**: no se duplican datos que ya viajan, y Mis compras sigue siendo un solo pedido.
- **Alternatives considered**: sumar `consultasNoLeidas` al `resumen` de Ventas. Mezcla dos features en un DTO ya testeado, y el resumen se recalcula en cada página de ventas.

## R7. Validación del texto

- **Decision**: `schemas/mensajeSchema.js` (zod, estricto): `{ texto: string }`, se aplica `trim`, mínimo 1 y máximo 1000 caracteres. Mensajes:
  - Vacío: "Escribí un mensaje".
  - Largo: "El mensaje puede tener hasta 1000 caracteres".
  - Fallo: 400 `DATOS_INVALIDOS` con `campos`.

  El backend guarda el texto ya recortado y conserva los saltos de línea internos. `despuesDe` se valida con `validarQuery`: tiene que ser el id de un mensaje de esa conversación. Uno desconocido → 400 con `campo: "despuesDe"`.
- **Rationale**: sigue el patrón de `validar(schema)` de las features anteriores (FR-002, FR-003, SC-006).

## R8. Identidad y orden de los mensajes

- **Decision**: `id` = `msj-{n}` con un contador global del repositorio (como `A-NNNN`). `enviadoEn` = `ahora().toISOString()`. El orden es el de inserción en el array (cronológico); el id solo identifica el mensaje y sirve de cursor de `despuesDe`. La lista de conversaciones se ordena por `enviadoEn` del último mensaje, desc, con desempate por número de compra desc.
- **Rationale**: `POST` es sincrónico (sin `await` entre validar y escribir), así que el orden de inserción es el orden real. El cursor por id es estable aunque dos mensajes tengan la misma hora.

## R9. Toast y avisos del comprador (FR-024, FR-025)

- **Decision**:
  - Un `AvisosDeConsultasProvider` (en `src/consultas/`) montado en `(compradores)/_layout.tsx`, activo solo con sesión de comprador, hace el sondeo de `GET /compradores/consultas/no-leidas` cada 3 s.
  - **Primer resultado = línea de base**: guarda los ids de los últimos mensajes sin avisar, así lo que llegó antes de abrir la app no dispara toasts (FR-025, US6 escenario 6).
  - En cada sondeo siguiente, las consultas cuyo `ultimoMensaje.id` no se había visto son novedades:
    - Se descarta la compra cuyo chat está abierto (`usePathname()` = `/compras/{numero}/consulta`).
    - Si queda una sola compra, el toast dice "Nuevo mensaje de {organizador}" con "{evento} · Compra #{número}" y al tocarlo hace `router.push` al chat.
    - Si quedan varias, el toast dice "Tenés N mensajes nuevos" y lleva a Mis compras.
  - El toast se oculta a los 5 s. El conjunto de ids ya avisados vive en memoria del provider y se reinicia al cambiar de comprador (`key`, como `FavoritosProvider`).
  - El provider también expone un contador de cambios (`version`): Mis compras y el Detalle de compra lo escuchan y se recargan para que el punto aparezca sin salir de la pantalla.
- **Rationale**: un solo sondeo global, sin endpoints de "notificaciones" con estado en el servidor. Que cada mensaje avise una sola vez se resuelve en el cliente, que es quien muestra el toast.
- **Alternatives considered**: guardar "avisado" en el servidor. Agrega estado por dispositivo y no aporta nada en un TP sin push.

## R10. Componentes nuevos del design system

- **Decision**: primero se documentan en `design-system.md` y `pantallas.md` (Principio I), después se implementan en `src/components/ds/`:
  - **Toast** (nuevo): tarjeta `color-surface`, `shadow-lg`, `radius-lg`, ícono de chat en acento, título `type-body-sm` 500 y línea `type-caption` muted. Va arriba, debajo del safe area, con `pad-page` de margen y ancho máximo de 390. `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"`; todo el toast es un botón.
  - **Burbujas y compositor** (`ChatMensajes`, `CompositorChat`): se implementa lo que ya define el design system (§ Chat). El compositor sabe si está en mobile (botón circular) o en desktop (**Enviar**). En web, Enter envía y Shift+Enter agrega un salto de línea. El contador "N/1000" aparece desde los 900 caracteres.
  - **ListaConversaciones**: § ConversationList.
  - **Punto de no leído** en `PurchaseCard` y en `Button`: `dot-unread`, 8 px en acento, con `accessibilityLabel` "Tenés mensajes sin leer".
  - **Contador del botón**: `tag-count`.
- **Rationale**: lo exige la constitución. El Toast y el punto en Mis compras y Detalle son las únicas piezas que no estaban en el diseño.

## R11. Formato de la hora

- **Decision**: `horaDeMensaje(iso, ahora)` en `lib/formato.ts`:
  - Mismo día en hora de Argentina: "21:04".
  - Otro día: `fechaCorta(iso) + " · " + hora(iso)` → "Sáb 21 nov · 21:04".

  Se usa igual en las burbujas y en la lista de conversaciones.
- **Rationale**: es lo que pide la spec (FR-005) y reusa `fechaCorta` y `hora`, que ya existen.

## R12. Tests (Principio II)

- **Unitarios**:
  - `reglasConsulta`: `noLeidaPara(consulta, "organizador" | "comprador")`.
  - `consultasRepository`: agregar, listar con `despuesDe`, índice por evento, `marcarVista`, reiniciar desde el seed.
  - `consultasService`: propiedad, envío, lectura, lista ordenada, `noLeidas`, compra sin mensajes.
  - `mensajeSchema`.
  - `consultaDto`.
  - `seed`: las consultas del seed apuntan a compras existentes y cumplen los estados leído/no leído que pide FR-018.
- **Integración**, un archivo por historia:
  - `consultasComprador.test.js` (US1)
  - `consultasOrganizador.test.js` (US2)
  - `consultasNoLeidas.test.js` (US3 y US6, incluye `no-leidas` y `consultaNoLeida` en el DTO de compra)
  - `consultasDesdeVentas.test.js` (US4)
  - `consultasPropiedad.test.js` (US5)
  - `docs.test.js` (+ paths nuevos)
- El sondeo, el toast y el auto-scroll son del front, que no tiene tests automáticos: se verifican a mano con el [quickstart](quickstart.md).

## R13. Entorno de desarrollo

- **Decision**: la feature 006 (calificaciones) se desarrolla en paralelo en otro worktree. Para no pisarse, esta feature se levanta con el backend en el **3007** y el front en el **8087** (`PORT=3007`, `EXPO_PUBLIC_API_URL=http://localhost:3007`, `npx expo start --port 8087`). El código no cambia sus puertos por defecto.
- **Rationale**: es el mismo criterio que usó la feature 005.
