# Feature Specification: Consultas (chat de la compra)

**Feature Branch**: `Feature/007-consultas-chat`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "consultas, en esta feature vamos a desarrollar la seccion de consultas, donde un comprador o un organizador van a poder escribir en un chat para dejar consultas, tal como lo indica el enunciado del tp @\"Diseño de AI Ticket It/DDS UTN Trabajo Práctico Individual de Desarrollo con IA - 2C 2026 - Público (1).md\""

**Casos de uso del enunciado que cubre**:

- "Como comprador, quiero poder enviar mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma."
- "Como organizador, quiero poder responder mensajes en cualquier momento relacionados a una compra mediante un chat dentro de la misma."

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Compradores 10 · Chat de la compra** (mobile, 390 × 844).
- **Compradores 08 · Mis compras**: la tarjeta de una compra con respuestas sin leer muestra el punto de no leído.
- **Compradores 09 · Detalle de compra**: el botón **Tengo una consulta** pasa a tener acción (→ Chat de la compra) y muestra el punto de no leído si corresponde.
- **Toast de mensaje nuevo** (app Compradores): componente nuevo, a agregar en `design-system.md` y `pantallas.md` antes de implementarlo (Principio I).
- **Organizadores 05 · Consultas del evento** (desktop, 1280 × 800).
- **Organizadores 04 · Detalle del evento**: **Consultas del evento** se habilita y muestra el contador de no leídas; cada fila de Ventas suma el botón de chat (→ Consultas en esa conversación).

**Fuera de esta feature**: notificaciones fuera de la app (push, email), adjuntar archivos o imágenes, editar o borrar mensajes, chat entre compradores o con soporte de la plataforma, y la pantalla Calificar experiencia (feature de calificaciones).

## Clarifications

### Session 2026-11-22

- Q: ¿Los mensajes nuevos de la otra parte tienen que aparecer solos mientras el chat está abierto? → A: Sí. Con el Chat de la compra o Consultas del evento abiertos, los mensajes nuevos aparecen solos en menos de 5 segundos, sin tocar nada (FR-021, SC-002).
- Q: Cuando el organizador responde, ¿el comprador tiene que ver algún aviso de mensaje nuevo fuera del chat? → A: Sí: punto de no leído (`dot-unread`) en la tarjeta de Mis compras y en **Tengo una consulta** del Detalle de compra, más un toast "Nuevo mensaje de {organizador}" cuando llega una respuesta mientras el comprador usa la app (US6, FR-022 a FR-025). El Toast no existe en el design system: se agrega al diseño antes de implementar.
- Q: ¿Qué textos usan los estados vacíos que el diseño no define? → A: Chat del comprador sin mensajes: "Todavía no hay mensajes — Escribí tu consulta y {organizador} te va a responder acá."; Consultas sin conversaciones: "Todavía no hay consultas — Cuando un comprador escriba, vas a verla acá."; conversación sin mensajes abierta desde Ventas: "Todavía no hay mensajes con {comprador}."; sin conversación elegida: "Elegí una conversación para ver los mensajes." (FR-026).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador hace una consulta sobre su compra (Priority: P1)

Sofía Gómez compró dos plateas para Hamlet en el Galpón y quiere saber si puede entrar con un cochecito. Desde Mis compras abre la compra #A-1042, toca **Tengo una consulta** y llega al chat de esa compra: arriba ve "Hamlet en el Galpón" y "Compañía La Trama · Compra #A-1042". Escribe "¿Se puede entrar con cochecito?" y lo envía; el mensaje aparece a la derecha con la hora.

**Why this priority**: es el primer caso de uso del enunciado sobre mensajes y el punto de entrada de toda conversación; sin esto el organizador no tiene nada que responder.

**Independent Test**: ingresar con `sofia.gomez@correo.com`, abrir #A-1042 desde Mis compras, tocar **Tengo una consulta**, enviar un mensaje y verificar que aparece a la derecha con su hora y que sigue ahí al salir y volver a entrar al chat.

**Acceptance Scenarios**:

1. **Given** un comprador con sesión en el Detalle de una de sus compras, **When** toca **Tengo una consulta**, **Then** se abre el Chat de esa compra, con AppBar (Volver) que dice el nombre del evento y, en la línea inferior, "{organizador} · Compra #{número}".
2. **Given** el Chat de una compra con mensajes, **Then** se ven todos los mensajes de esa compra en orden cronológico (el más viejo arriba), los propios a la derecha y los del organizador a la izquierda, cada uno con su hora debajo, y la vista arranca mostrando el último mensaje.
3. **Given** el Chat, **When** el comprador escribe en el compositor ("Escribí tu consulta") y toca enviar (o presiona Enter), **Then** el mensaje aparece al final a la derecha con la hora del envío y el compositor queda vacío.
4. **Given** el compositor vacío o solo con espacios, **Then** el botón enviar está deshabilitado y Enter no envía nada.
5. **Given** una compra en cualquier estado (Pendiente de pago, Confirmada, Utilizada, Cancelada o Reembolsada) y con el evento futuro o ya realizado, **Then** el comprador puede abrir el chat y enviar mensajes ("en cualquier momento", según el enunciado).
6. **Given** una compra sin mensajes, **When** el comprador abre el chat, **Then** ve "Todavía no hay mensajes — Escribí tu consulta y {organizador} te va a responder acá." y el compositor listo para usar.
7. **Given** el chat, **When** el comprador toca **Volver**, **Then** vuelve al Detalle de compra.

---

### User Story 2 - El organizador responde las consultas de un evento (Priority: P1)

Un integrante de Compañía La Trama abre el panel de Hamlet en el Galpón y ve **Consultas del evento** con un contador "1". Hace clic y entra a Consultas del evento: a la izquierda, la lista de conversaciones (una por compra con mensajes); a la derecha, el chat de la conversación elegida. Abre la de Sofía Gómez, lee "¿Se puede entrar con cochecito?" y responde "Sí, hay lugar para dejarlo en el hall." en el compositor "Responder a Sofía Gómez".

**Why this priority**: es el segundo caso de uso del enunciado sobre mensajes; completa el ida y vuelta de la consulta.

**Independent Test**: con `produccion@latrama.com.ar`, abrir el panel de Hamlet en el Galpón, entrar a **Consultas del evento**, abrir la conversación de la compra #A-1042, enviar una respuesta y verificar que el comprador la ve a la izquierda en su chat.

**Acceptance Scenarios**:

1. **Given** el panel de un evento propio, **Then** el botón **Consultas del evento** está habilitado y, si hay conversaciones no leídas, muestra su cantidad como contador; con 0 no leídas se muestra sin contador.
2. **Given** el organizador hace clic en **Consultas del evento**, **Then** ve Volver (→ panel del evento), el título "Consultas del evento" y el nombre del evento, con la lista de conversaciones a la izquierda.
3. **Given** la lista de conversaciones, **Then** hay una fila por compra del evento que tenga al menos un mensaje, ordenadas por el último mensaje (la más reciente arriba), cada una con avatar con iniciales del comprador, nombre, hora del último mensaje, "Compra #{número} · {tipo} × {cantidad}", el texto del último mensaje (recortado si es largo) y el punto de no leído si corresponde.
4. **Given** el organizador elige una conversación, **Then** la fila queda marcada como seleccionada y a la derecha se ve la cabecera con el comprador, "Compra #{número} · {tipo} × {cantidad} · $ {total}" y el Tag de estado de la compra, los mensajes (los del organizador a la derecha, los del comprador a la izquierda, con hora) y el compositor "Responder a {comprador}" + **Enviar**.
5. **Given** una conversación abierta, **When** el organizador escribe y hace clic en **Enviar** (o presiona Enter), **Then** el mensaje aparece al final a la derecha, el compositor queda vacío y la conversación pasa a ser la primera de la lista con ese mensaje como último.
6. **Given** el compositor vacío o solo con espacios, **Then** **Enviar** está deshabilitado y Enter no envía nada.
7. **Given** un evento sin ninguna conversación, **Then** Consultas del evento muestra "Todavía no hay consultas — Cuando un comprador escriba, vas a verla acá." en lugar de la lista y del chat.
9. **Given** Consultas del evento con conversaciones y ninguna elegida, **Then** el panel derecho dice "Elegí una conversación para ver los mensajes.".
8. **Given** una compra en cualquier estado y un evento en cualquier estado (Publicado o Finalizado), **Then** el organizador puede leer y responder sus mensajes.

---

### User Story 3 - El organizador sabe qué consultas tiene sin leer (Priority: P2)

Cuando un comprador escribe, la conversación queda marcada como no leída para el organizador hasta que la abre. Así, desde el panel del evento sabe cuántas consultas le faltan atender y, dentro de Consultas, cuáles son.

**Why this priority**: ordena el trabajo del organizador cuando hay muchas compras, pero el ida y vuelta de mensajes ya funciona sin esto.

**Independent Test**: con el seed, verificar que el panel de Hamlet en el Galpón muestra el contador de no leídas; abrir esa conversación en Consultas y verificar que el punto desaparece y que, al volver al panel, el contador bajó en 1.

**Acceptance Scenarios**:

1. **Given** una conversación cuyo último mensaje es del comprador y que el organizador todavía no abrió desde ese mensaje, **Then** la conversación está **no leída**: su fila muestra el punto de no leído y cuenta en el contador de **Consultas del evento**.
2. **Given** una conversación no leída, **When** el organizador la abre, **Then** queda leída: desaparece el punto y el contador baja en 1 al volver al panel.
3. **Given** una conversación leída, **When** el comprador envía un mensaje nuevo, **Then** la conversación vuelve a quedar no leída.
4. **Given** una conversación cuyo último mensaje es del organizador, **Then** nunca está no leída.
5. **Given** al entrar a Consultas del evento, **Then** no se abre ninguna conversación automáticamente (salvo que se llegue desde el botón de chat de una fila de Ventas, US4), para no marcar como leída una consulta que el organizador todavía no eligió ver.

---

### User Story 4 - El organizador abre el chat desde una venta (Priority: P2)

En la tabla de Ventas del panel, el organizador ve una compra y quiere escribirle al comprador (por ejemplo, para avisarle un cambio de horario). Hace clic en el botón de chat de esa fila y llega a Consultas del evento con esa conversación abierta, aunque todavía no tenga mensajes.

**Why this priority**: conecta el panel con las consultas y permite que el organizador escriba primero, pero no es imprescindible para responder.

**Independent Test**: en el panel de Hamlet en el Galpón, hacer clic en el botón de chat de una compra sin mensajes, verificar que se abre su conversación vacía, enviar un mensaje y verificar que la conversación aparece en la lista y que el comprador la ve en su chat.

**Acceptance Scenarios**:

1. **Given** la tabla de Ventas, **Then** la columna Acciones de cada fila (en cualquier estado) tiene un botón ícono de chat con nombre accesible "Consultas de la compra #{número}".
2. **Given** el organizador hace clic en ese botón, **Then** llega a Consultas del evento con la conversación de esa compra seleccionada y abierta (y, si estaba no leída, queda leída).
3. **Given** una compra sin mensajes abierta desde Ventas, **Then** el panel de chat muestra la cabecera de la compra, "Todavía no hay mensajes con {comprador}." y el compositor; la compra no aparece en la lista hasta que se envíe el primer mensaje.
4. **Given** el organizador envía el primer mensaje de esa compra, **Then** la conversación aparece primera en la lista y el comprador la ve en el Chat de su compra.

---

### User Story 5 - Cada uno ve solo sus conversaciones (Priority: P1)

Un comprador solo ve los chats de sus propias compras y un organizador solo los de compras de sus propios eventos. Nadie puede leer ni escribir en una conversación ajena, aunque escriba la dirección a mano.

**Why this priority**: los mensajes pueden tener datos personales; mostrarlos a otra persona sería una fuga de datos.

**Independent Test**: con la sesión de Sofía, abrir a mano la dirección del chat de una compra de otro comprador y verificar "No encontramos esta compra."; con la sesión de La Trama, abrir las consultas de un evento de Club del Chiste y verificar "No encontramos el evento.".

**Acceptance Scenarios**:

1. **Given** un comprador con sesión, **When** abre el chat de una compra de otro comprador o de un número inexistente, **Then** ve AppBar con Volver, "No encontramos esta compra." y **Volver a Mis compras** (secundario), igual que el Detalle de compra, sin ningún mensaje.
2. **Given** un organizador con sesión, **When** abre Consultas de un evento de otra compañía o inexistente, **Then** ve "No encontramos el evento." + link a **Mis eventos**, sin ningún dato.
3. **Given** un organizador, **When** intenta leer o escribir en la conversación de una compra que no es de un evento suyo, **Then** se rechaza igual que si la compra no existiera.
4. **Given** alguien sin sesión del lado correspondiente, **When** abre la dirección de un chat o de Consultas, **Then** se lo lleva al Ingreso de su lado.

---

### User Story 6 - El comprador se entera de que le respondieron (Priority: P2)

Sofía está mirando Explorar cuando Compañía La Trama le responde la consulta de la compra #A-1042. Arriba aparece un toast "Nuevo mensaje de Compañía La Trama" con el nombre del evento; lo toca y llega al chat de esa compra. Si no lo toca, el toast desaparece solo, pero en Mis compras la tarjeta de #A-1042 sigue con el punto de no leído, y en el Detalle de compra también lo tiene **Tengo una consulta**, hasta que abre el chat.

**Why this priority**: sin aviso, el comprador no sabe que tiene una respuesta salvo que vuelva a abrir el chat; pero el ida y vuelta ya funciona sin esto (US1 y US2).

**Independent Test**: con Sofía en Explorar y La Trama en Consultas del evento, responder la conversación de #A-1042 desde el organizador y verificar que a Sofía le aparece el toast en menos de 5 segundos; ir a Mis compras sin tocarlo y verificar el punto en la tarjeta; abrir el chat y verificar que el punto desaparece de Mis compras y del Detalle.

**Acceptance Scenarios**:

1. **Given** una conversación cuyo último mensaje es del organizador y que el comprador no abrió después de ese mensaje, **Then** está **no leída para el comprador**: su tarjeta en Mis compras y el botón **Tengo una consulta** del Detalle de esa compra muestran el punto de no leído.
2. **Given** una conversación no leída para el comprador, **When** el comprador abre el chat de esa compra, **Then** queda leída y el punto desaparece de Mis compras y del Detalle.
3. **Given** el comprador con sesión en cualquier pantalla interna de la app de compradores, **When** el organizador le envía un mensaje, **Then** en menos de 5 segundos aparece un toast "Nuevo mensaje de {organizador}" con la línea "{evento} · Compra #{número}".
4. **Given** el toast visible, **When** el comprador lo toca, **Then** se abre el chat de esa compra (y queda leída); **When** no lo toca, **Then** el toast desaparece solo a los 5 segundos.
5. **Given** el comprador con el chat de esa misma compra abierto, **When** llega el mensaje, **Then** no aparece el toast: el mensaje se ve directamente en el chat (FR-021).
6. **Given** mensajes del organizador que llegaron mientras el comprador no tenía la app abierta o no tenía sesión, **Then** no se muestra un toast por ellos al entrar; se ven solo como puntos de no leído.

---

### Edge Cases

- **Mensaje muy largo**: el compositor no acepta más de 1000 caracteres; al acercarse al límite se muestra el contador "N/1000". Un mensaje largo se muestra completo en la burbuja (que ocupa hasta el 78% del ancho), con saltos de línea respetados.
- **Espacios al principio o al final**: se recortan antes de enviar; un mensaje que queda vacío no se envía.
- **Doble envío**: mientras un mensaje se está enviando, el botón queda deshabilitado; tocar dos veces no crea dos mensajes.
- **Error de conexión al enviar**: el mensaje no se agrega como enviado, el texto queda en el compositor y se muestra "No pudimos conectarnos. Probá de nuevo en un rato."; el usuario puede reintentar.
- **Error de conexión al abrir el chat o Consultas**: "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**.
- **Mensajes de otros días**: la hora de un mensaje de hoy se muestra "21:04"; la de otro día, con fecha corta ("Sáb 21 nov · 21:04"). En la lista de conversaciones, la hora del último mensaje sigue la misma regla.
- **Mensaje nuevo mientras el chat está abierto**: aparece solo, sin tocar nada, en menos de 5 segundos (FR-021). Si el usuario está leyendo mensajes anteriores (no está al final), no se lo mueve de lugar.
- **Error de conexión durante la actualización automática**: lo ya cargado queda en pantalla y se sigue intentando en silencio; el aviso de conexión solo se muestra al abrir o al enviar.
- **Compra que cambia de estado con el chat abierto** (p. ej. el comprador la cancela): el Tag de la cabecera del organizador se actualiza junto con los mensajes nuevos; los mensajes anteriores se conservan.
- **Sesión vencida** mientras se usa el chat: se cierra la sesión y se vuelve al Ingreso, como en el resto de la app.
- **Comprador sin nombre cargado**: la lista y el compositor usan su email ("Responder a {email}") y el avatar la primera letra del email.
- **Evento Finalizado**: el chat sigue abierto para ambas partes (p. ej. reclamos o consultas después del evento).
- **Varias respuestas a la vez**: si llegan mensajes nuevos en más de una compra en la misma actualización, se muestra un solo toast "Tenés N mensajes nuevos" que lleva a Mis compras; si son varios mensajes de la misma compra, un solo toast de esa compra.
- **Toast repetido**: cada mensaje dispara a lo sumo un toast; volver a una pantalla o recargar no vuelve a mostrarlo.
- **Compra cancelada o reembolsada con respuesta sin leer**: la tarjeta de Mis compras muestra igual el punto de no leído (la imagen atenuada no lo oculta).

## Requirements *(mandatory)*

### Functional Requirements

**Conversación y mensajes**

- **FR-001**: Cada compra MUST tener exactamente una conversación entre su comprador y el organizador del evento; la conversación existe desde la compra, aunque no tenga mensajes.
- **FR-002**: Un mensaje MUST tener texto (1 a 1000 caracteres después de recortar espacios al principio y al final), autor (comprador u organizador) y fecha y hora de envío. Los mensajes no se editan ni se borran.
- **FR-003**: El sistema MUST rechazar mensajes vacíos o de solo espacios y mensajes de más de 1000 caracteres, sin guardar nada.
- **FR-004**: El comprador y el organizador MUST poder enviar mensajes en una compra en cualquier estado (Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada) y con el evento en cualquier estado.
- **FR-005**: Los mensajes de una conversación MUST mostrarse en orden cronológico, los propios a la derecha y los de la otra parte a la izquierda, con la hora debajo ("21:04" si es de hoy; "{fecha corta} · 21:04" si es de otro día).

**Lado comprador**

- **FR-006**: **Tengo una consulta** del Detalle de compra MUST abrir el Chat de esa compra (Compradores 10), con AppBar (Volver → Detalle de compra), nombre del evento y "{organizador} · Compra #{número}".
- **FR-007**: El Chat de la compra MUST tener el compositor fijo abajo con placeholder "Escribí tu consulta" y botón enviar circular (deshabilitado si el texto está vacío o se está enviando); Enter envía.
- **FR-008**: El comprador MUST poder ver y escribir solo en los chats de sus propias compras; una compra ajena o inexistente MUST mostrar "No encontramos esta compra." + **Volver a Mis compras**, igual que una compra ajena en el Detalle.

**Lado organizador**

- **FR-009**: En el panel del evento (Organizadores 04), **Consultas del evento** MUST estar habilitado y mostrar un contador con la cantidad de conversaciones no leídas del evento cuando sea mayor a 0.
- **FR-010**: Consultas del evento (Organizadores 05) MUST mostrar Volver (→ panel del evento), "Consultas del evento" + nombre del evento, una lista de conversaciones (solo compras con al menos un mensaje, la del último mensaje más reciente primero) y, a la derecha, el chat de la conversación seleccionada.
- **FR-011**: Cada fila de la lista MUST mostrar avatar con iniciales del comprador, nombre del comprador, hora del último mensaje, "Compra #{número} · {tipo} × {cantidad}", el último mensaje (en una línea, recortado) y el punto de no leído si corresponde.
- **FR-012**: El panel de chat del organizador MUST mostrar la cabecera con el comprador, "Compra #{número} · {tipo} × {cantidad} · $ {total}" y el Tag de estado de la compra; los mensajes; y el compositor "Responder a {comprador}" + **Enviar** (deshabilitado si el texto está vacío o se está enviando); Enter envía.
- **FR-013**: Cada fila de la tabla Ventas del panel MUST tener un botón ícono de chat que lleve a Consultas del evento con la conversación de esa compra abierta, aunque no tenga mensajes; así el organizador puede escribir primero.
- **FR-014**: El organizador MUST poder ver y escribir solo en conversaciones de compras de sus propios eventos; un evento ajeno o inexistente MUST mostrar "No encontramos el evento." + link a Mis eventos, y una compra que no es de ese evento (p. ej. un `?compra=` escrito a mano) MUST ignorarse: la pantalla queda sin conversación elegida y sin revelar si la compra existe.

**No leídas**

- **FR-015**: Una conversación MUST considerarse **no leída** para el organizador cuando su último mensaje es del comprador y el organizador no abrió la conversación después de ese mensaje.
- **FR-016**: Abrir una conversación (desde la lista o desde Ventas) MUST marcarla como leída para el organizador. Entrar a Consultas del evento sin elegir una conversación no marca ninguna.
- **FR-017**: El contador de **Consultas del evento** y los puntos de no leído MUST calcularse con la regla de FR-015 sobre todas las conversaciones del evento.

**Datos de ejemplo**

- **FR-018**: Los datos de ejemplo con los que arranca la app MUST incluir conversaciones para poder probar la feature sin escribir primero: al menos una en la compra #A-1042 de Sofía Gómez (Hamlet en el Galpón) con mensajes de las dos partes y el último del comprador (no leída), y algunas más en otras compras de eventos de La Trama, con conversaciones leídas y no leídas; y al menos otra compra de Sofía Gómez (p. ej. #A-1037 de Risas a Domicilio) cuyo último mensaje sea del organizador y esté no leída para ella, para probar el punto de Mis compras.

**Actualización automática**

- **FR-021**: Mientras el Chat de la compra (comprador) o Consultas del evento (organizador) está abierto, los mensajes nuevos de la otra parte MUST aparecer solos en menos de 5 segundos, sin que el usuario toque nada. En Consultas del evento también MUST actualizarse la lista de conversaciones (orden, último mensaje y puntos de no leído). Si la conversación que llega es la que el organizador tiene abierta, queda leída. Al salir de la pantalla, la actualización se detiene.

**Avisos al comprador**

- **FR-022**: Una conversación MUST considerarse **no leída para el comprador** cuando su último mensaje es del organizador y el comprador no abrió el chat de esa compra después de ese mensaje. Abrir el chat la marca como leída para el comprador.
- **FR-023**: La tarjeta de una compra en Mis compras y el botón **Tengo una consulta** de su Detalle MUST mostrar el punto de no leído (`dot-unread`) mientras su conversación esté no leída para el comprador, en cualquier estado de la compra.
- **FR-024**: Mientras el comprador tiene sesión y está en cualquier pantalla interna de la app de compradores (salvo el chat de esa misma compra), un mensaje nuevo del organizador MUST mostrar en menos de 5 segundos un toast "Nuevo mensaje de {organizador}" con "{evento} · Compra #{número}"; tocarlo abre el chat de esa compra y el toast desaparece solo a los 5 segundos. Si en la misma actualización llegan mensajes de más de una compra, MUST mostrarse un solo toast "Tenés N mensajes nuevos" que lleva a Mis compras.
- **FR-025**: Cada mensaje MUST disparar a lo sumo un toast, y solo los que llegan mientras la app está abierta con sesión; los anteriores se avisan únicamente con el punto de no leído.

**Errores, voz y design system**

- **FR-019**: Ante un error de conexión al cargar MUST mostrarse "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**; al enviar, el mismo texto, conservando lo escrito en el compositor.
- **FR-026**: Los estados vacíos MUST usar estos textos: chat del comprador sin mensajes "Todavía no hay mensajes — Escribí tu consulta y {organizador} te va a responder acá."; Consultas del evento sin conversaciones "Todavía no hay consultas — Cuando un comprador escriba, vas a verla acá."; conversación sin mensajes abierta desde Ventas "Todavía no hay mensajes con {comprador}."; Consultas sin conversación elegida "Elegí una conversación para ver los mensajes.".
- **FR-020**: Todos los textos MUST seguir la voz del design system (voseo, sentence case, plata "$ 36.000", fechas "Sáb 21 nov · 21:00") y usar solo tokens y componentes del design system (Chat, ConversationList, Avatar, Tag, `tag-count`, `dot-unread` y el Toast nuevo, que se agrega antes al diseño).

### Key Entities *(include if feature involves data)*

- **Conversación (consulta)**: una por compra; une al comprador de la compra con el organizador del evento. Sabe cuál fue su último mensaje y hasta cuándo la leyó cada parte (organizador y comprador), para las reglas de no leída de cada lado.
- **Mensaje**: texto, autor (comprador u organizador), fecha y hora de envío; pertenece a una conversación.
- **Compra**: número, evento, tipo de entrada, cantidad, total y estado; da contexto a la conversación (cabecera del chat y fila de la lista).
- **Comprador**: nombre y apellido (o email) que se muestra en la lista, la cabecera y el compositor del organizador.
- **Organizador**: dueño del evento; nombre que ve el comprador en el chat; único que puede responder las conversaciones de sus eventos.
- **Evento**: agrupa las conversaciones que ve el organizador en Consultas del evento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde el Detalle de compra, el comprador llega al chat con un toque y envía una consulta en menos de 30 segundos.
- **SC-002**: Un mensaje enviado aparece en la conversación de quien lo envió en menos de 1 segundo, y la otra parte, si tiene la conversación abierta, lo ve sin tocar nada en menos de 5 segundos.
- **SC-003**: Desde el panel del evento, el organizador llega a la conversación de una compra con un máximo de 2 clics (Consultas del evento + conversación, o el botón de chat de la fila).
- **SC-004**: Con los datos de ejemplo, el contador de **Consultas del evento** y los puntos de no leído (del organizador y del comprador) coinciden en el 100% de los casos con el cálculo hecho a mano según la regla de no leída de cada lado.
- **SC-007**: Con la app abierta, el comprador se entera de una respuesta del organizador (toast) en menos de 5 segundos, sin estar en el chat, y llega a ella con un solo toque.
- **SC-005**: En el 100% de los intentos de leer o escribir en una conversación ajena (de otro comprador o de un evento de otra compañía), no se muestra ningún mensaje ni se guarda ninguno.
- **SC-006**: El 100% de los intentos de enviar un mensaje vacío o de más de 1000 caracteres se rechaza sin guardar nada.

## Assumptions

- Las features 004 (Mis compras y Detalle de compra) y 005 (panel del evento con Ventas) ya existen; esta feature activa **Tengo una consulta**, habilita **Consultas del evento** con su contador y agrega el botón de chat a la columna Acciones de Ventas. Al mergear con la feature 006 (calificaciones), que trabaja en paralelo, puede haber que conciliar el Detalle de compra y el seed.
- El chat es **por compra**, como dicen el enunciado y `pantallas.md`; no hay un chat general por evento ni entre compradores.
- El organizador puede escribir primero (desde el botón de chat de Ventas); el diseño lo permite porque ese botón abre la conversación de cualquier compra.
- El estado **no leído** del organizador es el que define `pantallas.md`; el del comprador (FR-022 a FR-025) es una extensión de esta feature con la regla simétrica. El punto en la tarjeta de Mis compras, el punto en **Tengo una consulta** y el componente Toast se documentan en `design-system.md` y `pantallas.md` antes de implementarlos (Principio I de la constitución).
- El toast es solo dentro de la app (no es una notificación push del sistema operativo) y solo en la app de compradores; el organizador se entera por el contador y los puntos de no leído.
- Los textos de los estados vacíos (FR-026) no están en el diseño; se acordaron en Clarifications y se agregan a `pantallas.md` junto con el Toast.
- El largo máximo de un mensaje es 1000 caracteres (el diseño no lo define; es suficiente para una consulta y evita abusos). El contador "N/1000" sigue el patrón de textos con límite del design system.
- Las conversaciones se cargan completas (sin paginar mensajes ni conversaciones): un chat por compra tiene pocos mensajes y un evento tiene pocas conversaciones con mensajes.
- La hora de los mensajes se muestra en hora de Argentina (UTC−3), como el resto de las fechas de la app.
- No hay notificaciones fuera de la app (push, email): la plataforma busca "reducir la dependencia de canales externos" y el diseño no las incluye.
- Los mensajes, como el resto de los datos, viven en memoria y vuelven a los datos de ejemplo al reiniciar el backend (requisito del enunciado).
