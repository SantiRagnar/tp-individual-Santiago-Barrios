# Feature Specification: Calificaciones y opiniones (compradores)

**Feature Branch**: `Feature/006-calificaciones-opiniones`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Calificaciones y opiniones. Al finalizar un evento como menciona el enunciado (`Diseño de AI Ticket It/DDS UTN Trabajo Práctico Individual de Desarrollo con IA - 2C 2026 - Público (1).md`) quiero que el comprador pueda calificar el evento y poner su opinión"

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Compradores 12 · Calificar experiencia** (mobile, 390 × 844), pantalla nueva.
- **Compradores 02 · Explorar**: el **Recordatorio de calificación**.
- **Compradores 08 · Mis compras**: la acción "Calificá tu experiencia", que la feature 004 dejó sin acción.
- **Compradores 09 · Detalle de compra**: la tarjeta "Tu entrada fue utilizada" con **Calificar experiencia**, que la feature 004 dejó sin acción, y la tarjeta "Tu calificación".
- **Compradores 04 · Detalle del evento**: la sección **Opiniones sobre el organizador** (feature 003) ya muestra las reseñas; en esta feature tiene que reflejar las calificaciones nuevas.

**Casos de uso del enunciado que cubre**:

- "Como organizador, quiero que una vez utilizada una entrada el comprador pueda puntuar el Evento de forma numérica y dejar un comentario escrito."
- "Como comprador, quiero que las reseñas de eventos anteriores se visualicen en los Eventos de cada organizador para conocer experiencias previas antes de comprar." (la visualización ya existe desde la feature 003; acá se alimenta con calificaciones reales).

**Fuera de esta feature**: editar o borrar una calificación ya enviada, responder reseñas, moderarlas o denunciarlas, y cualquier pantalla del organizador para ver sus calificaciones (el diseño no la tiene). **Tengo una consulta** (chat) sigue sin acción hasta su feature.

## Clarifications

### Session 2026-11-22

- Q: ¿Alcanza con que la entrada esté marcada como Utilizada para poder calificar, o además hay que esperar a que el evento haya terminado? → A: Alcanza con que la compra esté Utilizada; no se exige que haya pasado la fecha y hora del evento (FR-002).
- Q: ¿Hay un plazo máximo para calificar una compra utilizada, o se puede calificar en cualquier momento? → A: Sin plazo: se puede calificar en cualquier momento mientras no esté calificada (FR-002).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador califica su experiencia desde su compra (Priority: P1)

Sofía fue a ver "Tango en el Conventillo" y en la puerta le marcaron la entrada como utilizada. Días después abre Mis compras y, en la tarjeta de esa compra (#A-0871), ve "Calificá tu experiencia". La toca y llega a **Calificar experiencia**: arriba ve el evento y la fecha, "Compra #A-0871 · General × 2", el título "¿Cómo fue tu experiencia?" y una aclaración de que su puntaje y su comentario se publican en los eventos de Lumbre. Elige 5 estrellas (aparece "Excelente"), escribe un comentario corto y toca **Enviar calificación**. Vuelve al Detalle de compra, donde ahora ve la tarjeta "Tu calificación" con sus estrellas, su comentario y "Visible en los eventos de Lumbre".

**Why this priority**: es el caso de uso del enunciado (puntaje numérico + comentario escrito una vez utilizada la entrada) y la única forma de que existan reseñas reales del organizador. Sin esto la feature no aporta nada.

**Independent Test**: ingresar con `sofia.gomez@correo.com`, abrir Mis compras, tocar "Calificá tu experiencia" en la compra A-0871, elegir 5 estrellas, escribir un comentario, enviar y verificar la tarjeta "Tu calificación" en el Detalle de compra y "Calificaste ★★★★★" en Mis compras.

**Acceptance Scenarios**:

1. **Given** una compra propia en estado **Utilizada** y sin calificar, **When** el comprador toca "Calificá tu experiencia" en Mis compras o **Calificar experiencia** en el Detalle de compra, **Then** se abre Calificar experiencia de esa compra.
2. **Given** la pantalla Calificar experiencia, **Then** se ven el AppBar "Calificar experiencia" con subtítulo "{evento} · {fecha corta}", "Compra #A-NNNN · {tipo} × {cantidad}", el título "¿Cómo fue tu experiencia?", el texto "Tu puntaje y tu comentario se publican en los eventos de {organizador}, para que otros compradores sepan qué esperar.", cinco estrellas grandes con "Elegí de 1 a 5 estrellas", el campo de comentario opcional con su contador "0/500" y **Enviar calificación** deshabilitado.
3. **Given** ninguna estrella elegida, **When** el comprador toca la cuarta estrella, **Then** quedan llenas las cuatro primeras, se lee "Muy bueno" y **Enviar calificación** se habilita.
4. **Given** el comprador escribe en el comentario, **Then** el contador muestra los caracteres usados ("N/500") y el campo no acepta más de 500.
5. **Given** un puntaje elegido, **When** toca **Enviar calificación**, **Then** la calificación queda guardada en la compra, el comprador vuelve al Detalle de compra y ve la tarjeta "Tu calificación" con las estrellas, el comentario (o "Sin comentario.") y "Visible en los eventos de {organizador}"; ya no ve **Calificar experiencia**.
6. **Given** una compra ya calificada, **When** el comprador vuelve a Mis compras, **Then** esa tarjeta muestra "Calificaste" con las estrellas en texto (p. ej. "Calificaste ★★★★★") en lugar de "Calificá tu experiencia".
7. **Given** el envío está en curso, **Then** **Enviar calificación** queda deshabilitado y un segundo toque no crea otra calificación.

---

### User Story 2 - La calificación se publica como reseña del organizador (Priority: P1)

Martín está por comprar entradas para "Cartas a Julieta", de Lumbre. En el Detalle del evento ve "Opiniones sobre el organizador": el puntaje promedio, "N reseñas de eventos anteriores" y, primera en la lista, la reseña que acaba de dejar Sofía: "Sofía G.", ★★★★★, "Tango en el Conventillo" y su comentario. En Explorar, la tarjeta de "Cartas a Julieta" muestra el puntaje nuevo de Lumbre, y al ordenar por Puntaje el orden ya lo tiene en cuenta.

**Why this priority**: el valor de calificar es que futuros compradores conozcan la reputación del organizador (enunciado). Si la calificación no se ve en los eventos del organizador, la US1 no sirve.

**Independent Test**: después de calificar A-0871 con 5 estrellas, abrir el Detalle de "Cartas a Julieta" (Lumbre) y verificar que la reseña aparece primera, que el contador subió en 1 y que el puntaje es el nuevo promedio; volver a Explorar y verificar el puntaje en la tarjeta.

**Acceptance Scenarios**:

1. **Given** una calificación recién enviada sobre un evento de un organizador, **When** cualquier comprador abre el Detalle de cualquier evento visible de ese organizador, **Then** en Opiniones sobre el organizador ve la reseña primera (la más reciente) con autor "{Nombre} {Inicial del apellido}.", estrellas en texto, nombre del evento calificado y comentario (o "Sin comentario.").
2. **Given** ese mismo Detalle, **Then** el contador "N reseñas de eventos anteriores" incluye la nueva y el puntaje es el promedio de todas las calificaciones del organizador con un decimal.
3. **Given** un organizador que no tenía reseñas, **When** recibe su primera calificación, **Then** sus eventos dejan de mostrar "Todavía no tiene reseñas." y pasan a mostrar puntaje, contador y la reseña; en Explorar, sus tarjetas pasan a mostrar el puntaje.
4. **Given** Explorar ordenado por **Puntaje**, **Then** el orden usa los puntajes que incluyen las calificaciones nuevas.

---

### User Story 3 - El comprador califica desde el recordatorio de Explorar (Priority: P2)

Al abrir Explorar, Sofía ve arriba de la lista el recordatorio "Tu entrada fue utilizada — ¿Cómo fue tu experiencia en Tango en el Conventillo?" con cinco estrellas, un comentario opcional y **Calificar**. Toca tres estrellas y **Calificar**, sin salir de Explorar. El recordatorio se reemplaza por "Gracias, tu reseña ya es visible en los eventos del organizador."

**Why this priority**: acerca la calificación al comprador sin que tenga que ir a Mis compras, lo que aumenta la cantidad de reseñas. El flujo de la US1 ya permite calificar, así que es una mejora.

**Independent Test**: con una compra Utilizada sin calificar, abrir Explorar, calificar desde el recordatorio y verificar el mensaje de agradecimiento, la reseña en los eventos del organizador y "Calificaste ★★★☆☆" en Mis compras.

**Acceptance Scenarios**:

1. **Given** un comprador con al menos una compra Utilizada sin calificar, **When** abre Explorar, **Then** ve el recordatorio de la compra cuyo evento es el más reciente, con "Tu entrada fue utilizada", "¿Cómo fue tu experiencia en {evento}?", cinco estrellas, el comentario "Contanos qué te pareció (opcional)" y **Calificar** deshabilitado.
2. **Given** el recordatorio, **When** elige estrellas y toca **Calificar**, **Then** la calificación se guarda igual que desde Calificar experiencia y el recordatorio se reemplaza por "Gracias, tu reseña ya es visible en los eventos del organizador."
3. **Given** un comprador sin compras Utilizadas sin calificar, **When** abre Explorar, **Then** no ve ningún recordatorio.
4. **Given** un comprador con dos compras Utilizadas sin calificar, **When** califica una desde el recordatorio y vuelve a entrar a Explorar, **Then** ve el recordatorio de la otra.

---

### Edge Cases

- **Compra que no está Utilizada** (Pendiente de pago, Confirmada, Cancelada o Reembolsada): no muestra ninguna acción de calificar y el servicio rechaza cualquier intento de calificarla.
- **Compra ya calificada**: no se puede calificar de nuevo ni cambiar la calificación. Si el comprador llega a Calificar experiencia de una compra ya calificada (p. ej. con dos pestañas abiertas o desde un enlace), **Enviar calificación** queda deshabilitado; si igual se envía, el servicio lo rechaza con "Esta compra ya fue calificada." y se conserva la primera calificación.
- **Dos envíos simultáneos** de la misma compra: se guarda exactamente uno.
- **Compra ajena o inexistente**: se trata igual que en el Detalle de compra: "No encontramos esta compra." y **Volver a Mis compras**; el servicio no revela si existe.
- **Puntaje fuera de 1–5 o no entero**, o comentario de más de 500 caracteres: el servicio lo rechaza sin guardar nada.
- **Comentario solo con espacios**: se considera sin comentario y la reseña muestra "Sin comentario.". Los espacios al principio y al final se quitan antes de guardar y de contar el límite.
- **Compra de varias entradas** (p. ej. General × 2): se califica una sola vez por compra, no por entrada.
- **Evento ya finalizado o no visible en Explorar**: no impide calificar; la reseña se muestra en los eventos visibles del organizador, nombrando al evento calificado aunque ya no se pueda abrir.
- **Organizador sin eventos visibles**: la calificación se guarda y cuenta para su puntaje; se verá cuando publique un evento.
- **Sin conexión al enviar**: se muestra "No pudimos conectarnos. Probá de nuevo en un rato.", se conservan las estrellas y el comentario elegidos y el botón queda para reintentar.
- **Sesión vencida**: como en el resto de la app, se vuelve al Ingreso sin guardar la calificación.

## Requirements *(mandatory)*

### Functional Requirements

**Reglas de la calificación**

- **FR-001**: Todas las acciones de esta feature MUST requerir sesión de comprador iniciada; un comprador solo puede calificar sus propias compras. Una compra ajena o inexistente MUST tratarse igual, sin revelar datos.
- **FR-002**: Solo una compra en estado **Utilizada** MUST poder calificarse, y **una sola vez**. Alcanza con que esté Utilizada: no se exige además que haya pasado la fecha y hora del evento, y no hay plazo máximo: se puede calificar en cualquier momento mientras no esté calificada. El servicio MUST rechazar la calificación de compras en cualquier otro estado o ya calificadas, sin modificar la calificación existente, aun si llegan dos pedidos a la vez.
- **FR-003**: Una calificación MUST tener un puntaje entero de 1 a 5 (obligatorio) y un comentario opcional de hasta 500 caracteres, contados después de quitar los espacios al principio y al final. Un comentario vacío o solo con espacios MUST guardarse como "sin comentario".
- **FR-004**: La calificación MUST guardarse en la compra, con su puntaje, su comentario y la fecha y hora en que se envió. Una vez guardada no MUST poder editarse ni borrarse.
- **FR-005**: La calificación MUST ser sobre el **organizador** del evento de la compra: MUST contar para el puntaje y el contador de reseñas de ese organizador apenas se guarda.

**Calificar experiencia (Compradores 12)**

- **FR-006**: "Calificá tu experiencia" (PurchaseCard de Mis compras) y **Calificar experiencia** (tarjeta "Tu entrada fue utilizada — Contales a otros compradores cómo fue tu experiencia con {organizador}." del Detalle de compra) MUST abrir Calificar experiencia de esa compra. Desde esta feature dejan de ser botones sin acción (feature 004, FR-029).
- **FR-007**: Calificar experiencia MUST mostrar AppBar "Calificar experiencia" con Volver y subtítulo "{evento} · {fecha corta}", la línea "Compra #A-NNNN · {tipo} × {cantidad}", el título "¿Cómo fue tu experiencia?" y el texto "Tu puntaje y tu comentario se publican en los eventos de {organizador}, para que otros compradores sepan qué esperar."
- **FR-008**: El **Puntaje** MUST mostrarse como cinco estrellas grandes elegibles, llenas hasta la elegida, acompañadas de la palabra del puntaje: 1 Malo, 2 Regular, 3 Bueno, 4 Muy bueno, 5 Excelente; sin elegir, "Elegí de 1 a 5 estrellas". Cada estrella MUST anunciarse a lectores de pantalla como "N estrellas" e indicar cuál está elegida.
- **FR-009**: El **Comentario (opcional)** MUST tener el placeholder "Qué te gustó, qué mejorarías, cómo fue el ingreso…", un contador "N/500" y no aceptar más de 500 caracteres.
- **FR-010**: **Enviar calificación** MUST estar deshabilitado sin estrellas elegidas, mientras se envía y si la compra ya está calificada. Al enviarse con éxito, el comprador MUST quedar en el Detalle de compra de esa compra, y Volver desde ahí MUST llevar a donde estaba antes de abrir Calificar experiencia (nunca de nuevo a Calificar experiencia).
- **FR-011**: Si se abre Calificar experiencia de una compra que no está Utilizada o ya está calificada, MUST verse la información de la compra con **Enviar calificación** deshabilitado y una nota con el motivo ("Esta compra ya fue calificada." o "Solo podés calificar una entrada utilizada.").

**Mis compras y Detalle de compra (Compradores 08 y 09)**

- **FR-012**: Una compra Utilizada sin calificar MUST mostrar "Calificá tu experiencia" en Mis compras y la tarjeta "Tu entrada fue utilizada…" con **Calificar experiencia** en el Detalle de compra. Una compra calificada MUST mostrar "Calificaste" + estrellas en texto en Mis compras y la tarjeta "Tu calificación" (estrellas, comentario o "Sin comentario.", "Visible en los eventos de {organizador}") en el Detalle (feature 004, FR-014 y FR-019).
- **FR-013**: Al volver a Mis compras o al Detalle de compra después de calificar (desde cualquier lugar), MUST verse el estado calificado sin tener que reiniciar la app.

**Recordatorio en Explorar (Compradores 02)**

- **FR-014**: Si el comprador tiene compras Utilizadas sin calificar, Explorar MUST mostrar arriba de la lista un único recordatorio para la compra cuyo evento tiene la fecha más reciente (a igual fecha, la de número de compra mayor): "Tu entrada fue utilizada", "¿Cómo fue tu experiencia en {evento}?", cinco estrellas, el comentario "Contanos qué te pareció (opcional)" (hasta 500 caracteres) y **Calificar**, deshabilitado sin estrellas y mientras se envía. Sin compras pendientes de calificar no se muestra nada.
- **FR-015**: **Calificar** MUST guardar la calificación con las mismas reglas que Calificar experiencia (FR-002 a FR-005) y reemplazar el recordatorio por "Gracias, tu reseña ya es visible en los eventos del organizador." hasta que el comprador vuelva a entrar a Explorar; en esa próxima carga se muestra el recordatorio de la siguiente compra pendiente, si hay.
- **FR-016**: Si el recordatorio no se puede cargar, Explorar MUST seguir funcionando normalmente sin mostrarlo.

**Opiniones sobre el organizador (Compradores 04 y 02)**

- **FR-017**: Cada calificación MUST publicarse como una reseña del organizador con autor (nombre + inicial del apellido del comprador, p. ej. "Sofía G."), estrellas en texto (★★★★☆), nombre del evento calificado y comentario o "Sin comentario.". Las reseñas MUST listarse de la más reciente a la más antigua según el momento de la calificación, con la paginación "Ver más" de la feature 003.
- **FR-018**: El puntaje del organizador (promedio de todas sus calificaciones, con un decimal) y "N reseñas de eventos anteriores" MUST incluir cada calificación nueva apenas se guarda, en el Detalle del evento, en las EventCard de Explorar y en el orden por **Puntaje**.

**Mensajes y datos**

- **FR-019**: Al fallar un envío por falta de conexión MUST verse "No pudimos conectarnos. Probá de nuevo en un rato." conservando lo elegido; si el servicio responde que la compra ya fue calificada, MUST verse "Esta compra ya fue calificada." y la pantalla MUST pasar a mostrar la calificación guardada.
- **FR-020**: Textos, estrellas y formatos MUST seguir el design system (voseo, sentence case, `#A-0871`, `General × 2`, `Dom 18 oct · 21:00`), usando solo tokens y componentes existentes (AppBar, Button, campo de texto, PurchaseCard, Tag, tarjetas del Detalle de compra). Las estrellas para calificar miden 36 px en Calificar experiencia, como indica el design system.
- **FR-021**: El seed MUST conservar las compras de ejemplo de la feature 004 tal como están: A-0871 (Tango en el Conventillo, Lumbre) **Utilizada sin calificar** para poder probar el flujo, y A-0655 (Edipo Rey) **Utilizada, calificada 4★**, además de las reseñas de ejemplo de la feature 003.

### Key Entities

- **Calificación**: puntaje (entero 1–5), comentario opcional (hasta 500 caracteres) y fecha y hora de envío. Pertenece a una única compra Utilizada y no cambia después de creada.
- **Compra**: la de la feature 004; puede tener como máximo una calificación, y solo si está Utilizada.
- **Reseña del organizador**: la vista pública de una calificación en los eventos del organizador: autor abreviado, estrellas, evento calificado y comentario. No es una entidad aparte: se deriva de la compra calificada.
- **Puntaje del organizador**: promedio de las calificaciones de todas las compras de sus eventos, con la cantidad de reseñas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador califica una compra utilizada, desde Mis compras o desde el recordatorio de Explorar, en menos de 30 segundos y con no más de 3 toques sin contar el texto del comentario (abrir, elegir estrellas, enviar).
- **SC-002**: El 100 % de las calificaciones enviadas aparecen como reseña en los eventos visibles del organizador y cuentan en su puntaje la próxima vez que cualquier comprador abre Explorar o un Detalle de evento, sin reiniciar nada.
- **SC-003**: Ninguna compra termina con más de una calificación, aunque se envíe varias veces o desde dos lugares a la vez.
- **SC-004**: Ningún comprador puede calificar compras de otro comprador ni compras que no estén Utilizadas, ni siquiera pidiéndolo directamente al servicio.
- **SC-005**: Para las compras y reseñas del seed, el puntaje mostrado de cada organizador coincide con el promedio calculado a mano (con un decimal) antes y después de agregar una calificación.

## Assumptions

- **"Al finalizar el evento" = entrada utilizada**: el enunciado dice "una vez finalizado el evento" en la descripción general y "una vez utilizada una entrada" en el caso de uso; el diseño fija la regla en compras **Utilizadas**. Se adopta esa regla (confirmada en Clarifications): alcanza con que el organizador haya marcado la entrada como utilizada (feature 005, posible desde las 00:00 del día del evento); no se espera además a que pase la hora del evento. Así se garantiza que solo califica quien asistió.
- **Se califica la experiencia, se publica sobre el organizador**: el comprador califica "su experiencia en {evento}", pero el design system aclara que la reseña es del organizador, no del evento. La reseña nombra el evento y alimenta el puntaje del organizador.
- **Una calificación por compra**, aunque la compra tenga varias entradas; si el comprador hizo dos compras del mismo evento, puede calificar cada una.
- **Sin edición ni borrado**: el diseño no los contempla; queda fuera de alcance.
- **Mensajes nuevos**: "Esta compra ya fue calificada." y "Solo podés calificar una entrada utilizada." no están en el diseño; según el Principio I se agregan a `pantallas.md` (Compradores 12) antes de implementarlos.
- **Orden del recordatorio**: el design system dice "la compra utilizada más reciente sin calificar"; se toma como la de evento más reciente, porque la compra no guarda cuándo se marcó como utilizada.
- **Después de enviar**: el diseño dice que Calificar experiencia "vuelve al Detalle de compra". Cuando se llega desde Mis compras, se muestra el Detalle de esa compra y Volver lleva a Mis compras.
- **Sin vista del organizador**: el diseño no tiene una pantalla del organizador para ver sus calificaciones; las ve, como cualquier comprador, en el Detalle de sus eventos.
- Depende de la feature 001 (sesión de compradores), 003 (Opiniones sobre el organizador, puntaje en Explorar, orden por Puntaje, reseñas del seed), 004 (Mis compras, Detalle de compra, compras del seed) y 005 (Marcar utilizada).
- La app de compradores está pensada para mobile (390 × 844), pero se puede usar en web sin scroll horizontal.
