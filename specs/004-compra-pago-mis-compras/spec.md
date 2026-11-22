# Feature Specification: Compra, pago simulado y Mis compras (compradores)

**Feature Branch**: `Feature/004-compra-pago-mis-compras`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Compra y pago, Mis compras. Realmente la parte del pago debe ser un boton que simule que se pago y avance el flujo ya que no vamos a integrar nada de pago."

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Compradores 03 · Menú de perfil** (BottomSheet): es el acceso a Mis compras desde el Avatar de Explorar.
- **Compradores 05 · Elegir entradas** (mobile, 390 × 844): tipo de entrada (RadioCard), cantidad (QuantityStepper) y ActionFooter con el total.
- **Compradores 06 · Pago (simulado)**: Resumen, medio de pago, nota de pago simulado y **Pagar $ X**.
- **Compradores 07 · Compra confirmada**: confirmación con número de compra y cuenta regresiva.
- **Compradores 08 · Mis compras**: lista de PurchaseCard.
- **Compradores 09 · Detalle de compra**: estado, DetailList, **Completar pago** y **Cancelar compra** con su Dialog.
- Se activa el botón **Comprar** de la EventCard (Compradores 02) y del ActionFooter del Detalle del evento (Compradores 04), que en la feature 003 no hacía nada.

**Fuera de esta feature**: 10 · Chat de la compra (**Tengo una consulta**), 12 · Calificar experiencia (crear calificaciones), Datos personales, el recordatorio de calificación de Explorar y todo el lado organizadores (disponibilidad, tabla de ventas, **Marcar utilizada**), que llega con su propia feature.

## Clarifications

### Session 2026-11-22

- Q: ¿La cancelación de compras entra en esta feature? → A: Sí, entra completa: **Cancelar compra** con su Dialog, Confirmada → Reembolsada, Pendiente → Cancelada y liberación de lugares (User Story 5, FR-023 y FR-024).
- Q: ¿Qué ve el comprador si los lugares se agotan entre que eligió la cantidad y tocó **Pagar $ X**? → A: El mensaje "Ya no quedan suficientes entradas de {tipo}." y vuelve a Elegir entradas con los lugares actualizados, para elegir otra cantidad u otro tipo (FR-028). El servicio resuelve la concurrencia: verificar lugares y descontarlos es una sola operación indivisible, así que nunca se vende más que el cupo (FR-009, FR-010, SC-003).
- Q: ¿Cómo se ven **Tengo una consulta**, "Calificá tu experiencia" / **Calificar experiencia** y la fila **Datos personales** mientras no existen sus features? → A: Visibles y con aspecto habilitado, pero sin acción, como **Comprar** en la feature 003 (FR-029).
- Q: Si el organizador cambia el precio de un tipo de entrada (o lo elimina) mientras el comprador está en Pago, ¿qué pasa al tocar **Pagar $ X**? → A: Se rechaza el pago con "El precio de {tipo} cambió. Revisá tu compra." y vuelve a Elegir entradas con los precios actualizados; si el tipo ya no existe, mismo mensaje y se preselecciona el primer tipo con lugares. Nunca se cobra un monto distinto del mostrado (FR-009, FR-030).
- Q: ¿En qué orden se listan las compras en Mis compras? → A: Por fecha de compra, la más nueva primero, como en el prototipo (A-1042, A-1037, A-0871, A-0790, A-0655); una compra recién hecha queda arriba (FR-013).
- Q: Desde el Detalle de compra abierto con **Ver mi compra**, ¿adónde lleva Volver? → A: A la pantalla donde se tocó **Comprar** (Explorar o el Detalle del evento); nunca vuelve al flujo de compra (Compra confirmada, Pago, Elegir entradas) (US3-5).
- Q: ¿Un comprador puede hacer varias compras del mismo evento o hay un tope total por comprador y evento? → A: Sin tope por comprador: puede hacer todas las compras que quiera del mismo evento, cada una de 1 a 10 entradas (FR-005).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador compra entradas para un evento (Priority: P1)

Sofía está en el Detalle de Hamlet en el Galpón y toca **Comprar**. Llega a "Elegí tus entradas": la VIP figura "Agotada", la General está preseleccionada con "Quedan 84". Elige Platea, sube la cantidad a 2 y ve "Total $ 36.000". Toca **Continuar al pago**, revisa el Resumen, elige "Tarjeta de crédito" y toca **Pagar $ 36.000**. No se le pide ningún dato de tarjeta: el pago se da por hecho y llega a "¡Compra confirmada!" con su número de compra y "Faltan 13 días para el evento.".

**Why this priority**: es el corazón del producto: sin compra no hay venta de entradas. Todo el resto (Mis compras, cancelación, calificaciones, ventas del organizador) depende de que existan compras.

**Independent Test**: con "hoy" = 2026-11-09, comprar Platea × 2 de Hamlet en el Galpón pagando con Tarjeta de crédito y verificar la pantalla de confirmación, que la Platea pasa de "Quedan 12" a "Quedan 10" al volver a entrar a Elegir entradas, y que la compra aparece Confirmada en Mis compras.

**Acceptance Scenarios**:

1. **Given** el Detalle o la EventCard de un evento con lugares, **When** el comprador toca **Comprar**, **Then** se abre Elegir entradas con AppBar "Elegí tus entradas" y subtítulo "{evento} · {fecha corta}".
2. **Given** Elegir entradas, **Then** cada tipo de entrada se ve como RadioCard con nombre, precio y "Quedan N", o "Agotada" y deshabilitada si no tiene lugares; viene preseleccionado el primer tipo con lugares y la cantidad en 1.
3. **Given** un tipo elegido, **Then** la cantidad va de 1 a `min(lugares disponibles, 10)`, con la ayuda "Máximo N"; al cambiar de tipo, la cantidad se ajusta al nuevo máximo si lo supera.
4. **Given** tipo y cantidad, **Then** el ActionFooter muestra "Total $ {precio × cantidad}" y **Continuar al pago**.
5. **Given** Pago, **Then** se ve AppBar "Pago", la tarjeta Resumen (evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}", total), los cuatro medios de pago (Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia), la nota "Pago simulado: no se realiza ningún cobro." y el botón **Pagar $ X**.
6. **Given** que no eligió medio de pago, **Then** **Pagar $ X** está deshabilitado.
7. **Given** un medio de pago elegido, **When** toca **Pagar $ X**, **Then** sin pedir más datos ni contactar a ningún procesador de pago se crea la compra en estado **Confirmada**, con un número nuevo `A-NNNN`, se descuentan los lugares del tipo elegido y se va a Compra confirmada.
8. **Given** Compra confirmada, **Then** se ve la marca de éxito, "¡Compra confirmada!", "{evento} · {tipo} × {cantidad}", "Compra #A-NNNN", "Faltan N días para el evento." ("Falta 1 día…" si es uno), "Vas a encontrar tus entradas en Mis compras." y los botones **Ver mi compra** (→ Detalle de compra) y **Volver a explorar**.
9. **Given** Compra confirmada, **When** el comprador vuelve atrás, **Then** no regresa a Pago ni puede pagar dos veces la misma compra.

---

### User Story 2 - El comprador ve sus compras en Mis compras (Priority: P1)

Sofía toca su Avatar en Explorar, se abre el Menú de perfil y elige **Mis compras**. Ve sus compras: Hamlet en el Galpón (Platea × 2, Confirmada, "Faltan 13 días"), Risas a Domicilio (Pendiente de pago), Tango en el Conventillo (Utilizada), Cartas a Julieta (Reembolsada, con la imagen atenuada) y Edipo Rey (Utilizada, "Calificaste ★★★★☆").

**Why this priority**: es donde el comprador encuentra lo que compró; sin esta pantalla la compra recién hecha "desaparece". Es la otra mitad del pedido.

**Independent Test**: ingresar con `sofia.gomez@correo.com` y verificar que Mis compras muestra las 5 compras del seed con su tipo, cantidad, estado y cuenta regresiva correctos; comprar una entrada nueva y verificar que aparece en la lista.

**Acceptance Scenarios**:

1. **Given** Explorar, **When** el comprador toca su Avatar, **Then** se abre el Menú de perfil (BottomSheet) con Avatar grande, nombre completo, "Mi perfil" y las filas **Mis compras**, **Favoritos**, **Datos personales** y **Cerrar sesión** (ghost).
2. **Given** el Menú de perfil, **When** toca **Mis compras**, **Then** se abre Mis compras; **Favoritos** lleva a la pestaña Favoritos; **Cerrar sesión** cierra la sesión y lleva al Ingreso.
3. **Given** Mis compras, **Then** se ve AppBar "Mis compras" y una PurchaseCard por compra del comprador con sesión: evento, fecha corta, "{tipo} × {cantidad}", Tag de estado con ícono y palabra, e imagen (al 40 % de opacidad si está Cancelada o Reembolsada).
4. **Given** una compra Confirmada de un evento futuro, **Then** la tarjeta muestra la cuenta regresiva "Faltan N días" / "Falta 1 día" (días hasta el evento, redondeando hacia arriba).
5. **Given** una compra Utilizada ya calificada, **Then** la tarjeta muestra "Calificaste" con sus estrellas (p. ej. "Calificaste ★★★★☆").
6. **Given** Mis compras, **Then** las compras se ordenan por fecha de compra, la más nueva primero (con el seed: A-1042, A-1037, A-0871, A-0790, A-0655; una compra recién hecha queda arriba), y cada comprador ve solo las suyas.
7. **Given** un comprador sin compras, **Then** se ve un estado vacío que lo invita a explorar eventos.
8. **Given** una PurchaseCard, **When** la toca, **Then** se abre el Detalle de compra.

---

### User Story 3 - El comprador ve el detalle de una compra (Priority: P1)

Sofía abre la compra de Hamlet en el Galpón. Ve la imagen, el Tag "Confirmada" grande con "Faltan 13 días" y la lista de datos: Fecha, Lugar, Entradas (Platea × 2), Total ($ 36.000), Pago (Tarjeta de crédito) y Compra (#A-1042).

**Why this priority**: es lo que el comprador necesita para ir al evento (cuándo, dónde, cuántas entradas) y la base de las acciones sobre la compra.

**Independent Test**: abrir el Detalle de cada compra del seed de Sofía y verificar los seis datos y el estado contra el seed.

**Acceptance Scenarios**:

1. **Given** el Detalle de compra, **Then** se ve AppBar con Volver y el nombre del evento, la imagen, el Tag de estado grande (con cuenta regresiva si está Confirmada) y la DetailList con **Fecha** (fecha larga y hora), **Lugar**, **Entradas** ("{tipo} × {cantidad}"), **Total**, **Pago** (medio de pago) y **Compra** ("#A-NNNN").
2. **Given** una compra Utilizada ya calificada, **Then** se ve la tarjeta "Tu calificación" con estrellas, comentario (o "Sin comentario.") y "Visible en los eventos de {organizador}".
3. **Given** una compra que no se puede cancelar, **Then** se ve la nota que explica por qué: "No se puede cancelar: la entrada ya fue utilizada." / "No se puede cancelar: el evento ya se realizó." / "Compra cancelada. El reembolso ya fue acreditado." / "Compra cancelada.".
4. **Given** el Detalle de una compra que no existe o es de otro comprador, **Then** no se muestra ningún dato de esa compra.
5. **Given** el Detalle de compra, **When** toca Volver, **Then** regresa a la pantalla anterior: a Mis compras si llegó desde ahí, o, si llegó con **Ver mi compra** desde Compra confirmada, a la pantalla donde tocó **Comprar** (Explorar o el Detalle del evento). Nunca vuelve a Compra confirmada, Pago ni Elegir entradas.

---

### User Story 4 - El comprador completa el pago de una compra pendiente (Priority: P2)

La compra de Risas a Domicilio de Sofía quedó "Pendiente de pago". En su Detalle toca **Completar pago**: el pago se simula, la compra pasa a **Confirmada** y aparece la cuenta regresiva.

**Why this priority**: el diseño lo define y el seed tiene una compra Pendiente, pero las compras nuevas nacen Confirmadas, así que es un camino secundario.

**Independent Test**: abrir A-1037 (Risas a Domicilio, Pendiente), tocar **Completar pago** y verificar que pasa a Confirmada en el Detalle y en Mis compras, sin cambiar los lugares disponibles del evento.

**Acceptance Scenarios**:

1. **Given** una compra Pendiente de pago de un evento que todavía no ocurrió, **Then** el Detalle muestra **Completar pago**.
2. **When** toca **Completar pago**, **Then** sin pedir datos de pago la compra pasa a **Confirmada**, conserva su número, monto y medio de pago, y se ve la cuenta regresiva.
3. **Given** una compra en cualquier otro estado, **Then** no aparece **Completar pago** y el servicio rechaza el pedido.

---

### User Story 5 - El comprador cancela una compra (Priority: P3)

Sofía ya no puede ir a Hamlet en el Galpón. En el Detalle de la compra toca **Cancelar compra**; un Dialog pregunta "¿Cancelar la compra?" y explica "Se reintegrarán $ 36.000 a tu Tarjeta de crédito. Esta acción no se puede deshacer.". Confirma, la compra pasa a **Reembolsada** y las 2 plateas vuelven a estar disponibles.

**Why this priority**: completa el Detalle de compra tal como está diseñado (Clarifications) y libera lugares para otros compradores, pero no es necesaria para comprar ni para ver las compras.

**Independent Test**: cancelar A-1042 (Confirmada) y verificar que queda Reembolsada y que la Platea de Hamlet vuelve a "Quedan 12"; cancelar A-1037 (Pendiente) y verificar que queda Cancelada; verificar que A-0871 (Utilizada) no ofrece cancelar.

**Acceptance Scenarios**:

1. **Given** una compra Pendiente de pago o Confirmada de un evento que todavía no ocurrió, **Then** el Detalle muestra **Cancelar compra** (ghost).
2. **When** la toca, **Then** se abre el Dialog "¿Cancelar la compra?" con, si está Confirmada, "Se reintegrarán $ X a tu {medio de pago}. Esta acción no se puede deshacer." o, si está Pendiente, "La compra se cancelará y se liberarán las entradas reservadas."; botones **Volver** y **Cancelar compra**.
3. **When** confirma, **Then** una Confirmada pasa a **Reembolsada**, una Pendiente pasa a **Cancelada**, y en los dos casos sus lugares vuelven a estar disponibles en el tipo de entrada.
4. **When** toca **Volver** en el Dialog, **Then** no cambia nada.
5. **Given** una compra Utilizada, Cancelada, Reembolsada o de un evento que ya ocurrió, **Then** no aparece **Cancelar compra** y el servicio rechaza el pedido.

---

### Edge Cases

- **Lugares que se agotan durante la compra**: entre que el comprador elige la cantidad y toca **Pagar $ X**, otro comprador compra los últimos lugares. Se ve "Ya no quedan suficientes entradas de {tipo}." y el comprador vuelve a Elegir entradas con los lugares actualizados (FR-028). La compra nunca se crea si no hay lugares suficientes y nunca se venden más entradas que el cupo.
- **Precio que cambia o tipo que se elimina durante la compra** (el organizador edita el evento mientras el comprador está en Pago): el pago se rechaza con "El precio de {tipo} cambió. Revisá tu compra." y se vuelve a Elegir entradas (FR-030).
- **Evento que deja de estar visible durante la compra** (pasa su fecha y hora, o deja de estar Publicado): el pago se rechaza y se ve "Este evento no está disponible." con **Volver a Explorar**, como en el Detalle del evento (feature 003).
- **Evento agotado**: **Comprar** sigue viéndose como **Agotado** deshabilitado (feature 003); si se llega a Elegir entradas por un link viejo, todos los tipos se ven "Agotada" y **Continuar al pago** está deshabilitado con la ayuda "Sin cupo".
- **Doble toque en Pagar o en Completar pago**: se crea una sola compra / se confirma una sola vez; el botón queda deshabilitado mientras se procesa.
- **Sin conexión o error del servicio** al pagar, completar el pago, cancelar o cargar Mis compras / Detalle de compra: se ve "No pudimos conectarnos. Probá de nuevo en un rato."; no se crea ni modifica nada a medias y se puede reintentar.
- **Entrada gratuita** (precio 0): el total es "$ 0" y el botón dice **Pagar $ 0**; el flujo es el mismo.
- **Cantidad fuera de rango** pedida directamente al servicio (0, negativa, no entera o mayor a `min(disponibles, 10)`): se rechaza.
- **Compra de otro comprador** pedida directamente al servicio: responde igual que una compra inexistente, sin revelar que existe.
- **Compras de eventos que ya no son visibles** (Finalizados, Borradores): siguen apareciendo en Mis compras y en su Detalle, con sus datos; solo se ocultan del lado de exploración.
- **Cuenta regresiva el mismo día del evento** (faltan menos de 24 h pero el evento no empezó): "Falta 1 día" (redondeo hacia arriba).
- **Sesión vencida** en cualquier pantalla del flujo: se lleva al Ingreso de compradores (FR-015 de la feature 001) y no se crea la compra.
- **Elementos de pantallas fuera de alcance** (**Tengo una consulta**, "Calificá tu experiencia" / **Calificar experiencia**, fila **Datos personales**): se ven con aspecto habilitado pero tocarlos no hace nada (FR-029).

## Requirements *(mandatory)*

### Functional Requirements

**Acceso y sesión**

- **FR-001**: Todas las pantallas y acciones de esta feature MUST requerir sesión de comprador iniciada; cada comprador solo puede ver y operar sus propias compras.
- **FR-002**: El Avatar de Explorar MUST abrir el Menú de perfil (BottomSheet) con Avatar grande, nombre completo, "Mi perfil" y las filas **Mis compras** (→ Mis compras), **Favoritos** (→ pestaña Favoritos), **Datos personales** y **Cerrar sesión** (ghost, cierra la sesión y lleva al Ingreso).

**Elegir entradas (Compradores 05)**

- **FR-003**: **Comprar** en la EventCard de Explorar y en el ActionFooter del Detalle del evento MUST abrir Elegir entradas de ese evento. **Agotado** sigue deshabilitado (feature 003).
- **FR-004**: Elegir entradas MUST mostrar AppBar "Elegí tus entradas" con subtítulo "{evento} · {fecha corta}", un RadioCard por tipo de entrada (nombre, precio, "Quedan N" o "Agotada" deshabilitada) con el primer tipo con lugares preseleccionado, y un QuantityStepper con ayuda "Máximo N" / "Sin cupo".
- **FR-005**: La cantidad MUST estar entre 1 y `min(lugares disponibles del tipo, 10)`, donde disponibles = cupo − vendidas; al cambiar de tipo MUST ajustarse al nuevo máximo. El tope de 10 es por compra: un comprador MAY hacer varias compras del mismo evento (y del mismo tipo), sin límite total por comprador, mientras haya lugares.
- **FR-006**: El ActionFooter MUST mostrar "Total $ X" (precio del tipo × cantidad) y **Continuar al pago**, deshabilitado si no hay un tipo con lugares elegido.

**Pago simulado (Compradores 06)**

- **FR-007**: Pago MUST mostrar AppBar "Pago", la tarjeta Resumen (evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}", total), los medios de pago Tarjeta de crédito, Tarjeta de débito, Mercado Pago y Transferencia (RadioCard, sin ninguno preseleccionado), la nota "Pago simulado: no se realiza ningún cobro." y el botón **Pagar $ X**, deshabilitado hasta elegir un medio.
- **FR-008**: El pago MUST ser simulado: tocar **Pagar $ X** da el pago por realizado sin pedir datos de tarjeta, cuenta ni comprobante, y sin contactar a ningún procesador de pago real.
- **FR-009**: Al pagar, el servicio MUST verificar en ese momento que el evento siga visible para compradores (Publicado y futuro), que el tipo de entrada siga existiendo con el mismo precio que vio el comprador en el Resumen y que tenga lugares suficientes; si es así, MUST crear la compra en estado **Confirmada** con comprador, evento, tipo de entrada, cantidad, monto (ese precio × cantidad), medio de pago, fecha de creación y un número nuevo y único con formato `A-NNNN`, y MUST descontar los lugares del tipo en la misma operación. Si no, MUST rechazar el pago sin crear nada.
- **FR-010**: El servicio MUST garantizar que nunca se vendan más entradas que el cupo de un tipo, aunque varios compradores paguen a la vez.
- **FR-011**: Cada toque en **Pagar $ X** MUST crear como máximo una compra: el botón queda deshabilitado mientras se procesa y, tras la confirmación, volver atrás no permite repetir el pago.

**Compra confirmada (Compradores 07)**

- **FR-012**: Tras el pago, MUST mostrarse "¡Compra confirmada!" con marca de éxito, "{evento} · {tipo} × {cantidad}", "Compra #A-NNNN", "Faltan N días para el evento." / "Falta 1 día para el evento.", "Vas a encontrar tus entradas en Mis compras." y los botones **Ver mi compra** (→ Detalle de esa compra) y **Volver a explorar** (→ Explorar).

**Mis compras (Compradores 08)**

- **FR-013**: Mis compras MUST mostrar AppBar "Mis compras" y una PurchaseCard por compra del comprador, ordenadas por fecha de compra (la más nueva primero; a igual fecha, el número de compra mayor primero): evento, fecha corta, "{tipo} × {cantidad}", Tag de estado (ícono + palabra), imagen de 104 px (al 40 % si está Cancelada o Reembolsada) y, solo si está Confirmada, la cuenta regresiva.
- **FR-014**: Una compra Utilizada ya calificada MUST mostrar "Calificaste" con sus estrellas en texto.
- **FR-015**: Tocar una PurchaseCard MUST abrir su Detalle de compra.
- **FR-016**: Sin compras, Mis compras MUST mostrar un estado vacío con un mensaje y una acción para ir a Explorar.
- **FR-017**: Mis compras MUST incluir las compras de eventos que ya no son visibles (Finalizados) y reflejar el estado actual de cada compra cada vez que se abre.

**Detalle de compra (Compradores 09)**

- **FR-018**: El Detalle de compra MUST mostrar AppBar (Volver + nombre del evento), imagen, Tag de estado grande con cuenta regresiva si está Confirmada, y la DetailList **Fecha**, **Lugar**, **Entradas**, **Total**, **Pago** y **Compra** (#A-NNNN).
- **FR-019**: Si la compra está Utilizada y calificada, MUST mostrar la tarjeta "Tu calificación" (estrellas, comentario o "Sin comentario.", "Visible en los eventos de {organizador}").
- **FR-020**: Si la compra no se puede cancelar, MUST mostrar la nota correspondiente: "No se puede cancelar: la entrada ya fue utilizada.", "No se puede cancelar: el evento ya se realizó.", "Compra cancelada. El reembolso ya fue acreditado." (Reembolsada) o "Compra cancelada." (Cancelada).
- **FR-021**: Una compra inexistente o de otro comprador MUST tratarse igual: no se muestra ningún dato y se ofrece volver a Mis compras.

**Completar pago**

- **FR-022**: Si la compra está **Pendiente de pago** y el evento todavía no ocurrió, el Detalle MUST mostrar **Completar pago**, que simula el pago (sin pedir datos) y pasa la compra a **Confirmada** conservando número, monto, medio de pago y lugares. Sobre compras en otro estado, el servicio MUST rechazarlo.

**Cancelar compra**

- **FR-023**: Si la compra está Pendiente de pago o Confirmada y el evento todavía no ocurrió, el Detalle MUST mostrar **Cancelar compra** (ghost), que abre el Dialog "¿Cancelar la compra?" con el texto de reintegro (Confirmada: "Se reintegrarán $ X a tu {medio de pago}. Esta acción no se puede deshacer.") o de liberación (Pendiente: "La compra se cancelará y se liberarán las entradas reservadas.") y los botones **Volver** y **Cancelar compra**.
- **FR-024**: Al confirmar, una Confirmada MUST pasar a **Reembolsada** y una Pendiente a **Cancelada**, y sus lugares MUST volver a estar disponibles en su tipo de entrada. En cualquier otro caso el servicio MUST rechazar la cancelación. (Reembolso simulado: no se mueve plata.)

**Formato y datos**

- **FR-025**: Montos, fechas, números de compra y textos MUST seguir el design system: `$ 36.000`, `Sáb 21 nov · 21:00`, `#A-1042`, `Platea × 2`, voseo y sentence case, usando solo tokens y componentes existentes (RadioCard, QuantityStepper, ActionFooter, PurchaseCard, DetailList, Tag, Dialog, BottomSheet).
- **FR-026**: Los lugares disponibles, el "Desde $ X", el estado Comprar/Agotado (feature 003) y la disponibilidad que verá el organizador MUST reflejar las compras nuevas y las cancelaciones apenas ocurren.
- **FR-027**: El seed MUST incluir las compras de ejemplo de Sofía del diseño (A-1042 Hamlet Platea × 2 Confirmada · A-1037 Risas General × 1 Pendiente · A-0871 Tango General × 2 Utilizada sin calificar · A-0790 Cartas Pareja × 1 Reembolsada · A-0655 Edipo General × 1 Utilizada calificada 4★), y los números nuevos MUST continuar después del mayor número existente.
- **FR-028**: Si al pagar el tipo elegido ya no tiene lugares suficientes, MUST verse "Ya no quedan suficientes entradas de {tipo}." y el comprador MUST volver a Elegir entradas con los lugares actualizados, conservando el evento; la cantidad se ajusta al nuevo máximo y, si el tipo quedó Agotada, se preselecciona el primer tipo con lugares.
- **FR-030**: Si al pagar el precio del tipo elegido es distinto del que se mostró en el Resumen, o el tipo ya no existe, el pago MUST rechazarse sin crear la compra, MUST verse "El precio de {tipo} cambió. Revisá tu compra." y el comprador MUST volver a Elegir entradas con los precios actualizados; si el tipo ya no existe, se preselecciona el primer tipo con lugares. Nunca se crea una compra por un monto distinto del que el comprador vio en **Pagar $ X**.

**Elementos de features futuras**

- **FR-029**: **Tengo una consulta** (Detalle de compra), "Calificá tu experiencia" (PurchaseCard de una Utilizada sin calificar), la tarjeta "Tu entrada fue utilizada…" con **Calificar experiencia** (Detalle de compra) y la fila **Datos personales** (Menú de perfil) MUST verse como en el diseño, con aspecto habilitado, y no hacer nada al tocarlos: no navegan ni muestran mensajes. Las features de consultas, calificaciones y datos personales les asignan su acción.

### Key Entities

- **Compra**: número (`A-NNNN`, único), comprador, evento, tipo de entrada, cantidad (1–10), monto (precio unitario al momento de comprar × cantidad), medio de pago, estado (Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada), fecha de creación y, si está Utilizada, una calificación opcional (solo se lee en esta feature).
- **Tipo de entrada**: nombre, precio, cupo y vendidas; las compras Pendientes y Confirmadas ocupan lugares, las Canceladas y Reembolsadas los liberan.
- **Medio de pago**: uno de Tarjeta de crédito, Tarjeta de débito, Mercado Pago o Transferencia. Es solo un dato de la compra; no hay cobro real.
- **Comprador**: dueño de sus compras; nombre y apellido se muestran en el Menú de perfil.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador completa una compra desde el Detalle del evento hasta "¡Compra confirmada!" en menos de 1 minuto y con no más de 5 toques (Comprar, cantidad, Continuar al pago, medio de pago, Pagar).
- **SC-002**: El 100 % de las compras confirmadas aparecen en Mis compras del comprador inmediatamente después del pago, con el estado, tipo, cantidad y total correctos.
- **SC-003**: Bajo ningún orden ni simultaneidad de pagos se venden más entradas que el cupo de un tipo: con 50 pagos simultáneos sobre un tipo con 10 lugares, se confirman compras por exactamente 10 entradas o menos y el resto se rechaza.
- **SC-004**: Ningún comprador puede ver, completar el pago ni cancelar compras de otro comprador, ni siquiera pidiéndolas directamente al servicio.
- **SC-005**: Para todas las compras del seed, el estado, la cuenta regresiva, las notas de cancelación y las acciones disponibles coinciden con las reglas de negocio de `pantallas.md` calculadas a mano.
- **SC-006**: Ningún paso del flujo pide datos de pago reales ni se comunica con un medio de pago externo.

## Assumptions

- **Fecha de referencia**: los ejemplos usan "hoy" = 2026-11-09, como el seed; Hamlet en el Galpón (2026-11-21 21:00) queda a 12 días y 9 horas del mediodía del 9/11 (la hora que fijan los tests), así que la cuenta regresiva dice "Faltan 13 días" (redondeo hacia arriba).
- **Pago simulado** (pedido explícito): **Pagar $ X** y **Completar pago** son botones que dan el pago por hecho y avanzan el flujo. El medio de pago se elige solo para registrarlo en la compra (se ve en el Detalle de compra y en la tabla de ventas del organizador).
- **Compras nuevas nacen Confirmadas**, como dice el diseño (06 · Pago). El estado Pendiente de pago solo aparece en compras del seed (A-1037) o de futuras features; su único camino en esta feature es **Completar pago** (o cancelarla).
- **Lugares ocupados**: las compras Pendientes y Confirmadas (y las Utilizadas) cuentan como vendidas; las Canceladas y Reembolsadas no. Las vendidas del seed ya incluyen las compras de ejemplo de Sofía, así que agregarlas al seed no debe contarlas dos veces.
- **Precio congelado**: el monto se fija al pagar con el precio que el comprador vio y aceptó (FR-030); si el organizador cambia el precio después, las compras existentes no cambian.
- **Mensaje de precio cambiado**: "El precio de {tipo} cambió. Revisá tu compra." no está en el diseño; se agrega a `pantallas.md` (Compradores 05) junto con el de lugares agotados.
- **Cancelar compra** se incluye en el alcance (Clarifications); el reembolso es simulado, como el pago.
- **Concurrencia**: el servicio comprueba los lugares y los descuenta en una única operación indivisible, sin pasos intermedios en los que otro pago pueda colarse; lo mismo vale para cancelar (liberar lugares) y para completar un pago. Cómo se garantiza se define en el plan.
- **Mensaje de lugares agotados al pagar**: "Ya no quedan suficientes entradas de {tipo}." no está en el diseño; según el Principio I se agrega a `pantallas.md` (Compradores 05, donde se muestra al volver de Pago) antes de implementarlo.
- **Cuenta regresiva**: días entre "ahora" y la fecha y hora del evento, redondeando hacia arriba; solo para compras Confirmadas de eventos futuros.
- **Mis compras sin paginar**: son las compras de un solo comprador, un volumen chico por definición (como Favoritos en la feature 003).
- **Estado vacío de Mis compras**: el diseño no lo define; según el Principio I se agrega a `pantallas.md` antes de implementarlo, con un mensaje y un botón secundario **Explorar eventos** usando componentes existentes.
- **Detalle de compra inexistente**: se reutiliza el patrón de "evento no disponible" de la feature 003 con el texto "No encontramos esta compra." y **Volver a Mis compras**; también se agrega a `pantallas.md`.
- **Marcar utilizada** (Confirmada → Utilizada) la hace el organizador y llega con la feature del panel de ventas; en esta feature las Utilizadas son las del seed.
- Depende de la feature 001 (sesión de compradores), 002 (eventos, tipos de entrada, imágenes, regla de Finalizado) y 003 (Explorar, Detalle del evento, botón Comprar/Agotado, compras y calificaciones del seed).
- La app de compradores está pensada para mobile (390 × 844), pero se puede usar en web sin scroll horizontal.
