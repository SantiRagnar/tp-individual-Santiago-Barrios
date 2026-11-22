# Feature Specification: Panel del evento (organizadores)

**Feature Branch**: `Feature/005-panel-evento`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "Panel de evento. Desde el organizador quiero ver ingresar al panel de un evento. Tene en cuenta que estoy con 2 sesiones al mismo tiempo, asi que quiero que esta la levantes el back y el front en dos puertos distintos de los default"

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Organizadores 04 · Detalle del evento (disponibilidad y ventas)** (desktop, 1280 × 800), completando la versión mínima que dejó la feature 002.

**Fuera de esta feature**: **Organizadores 05 · Consultas del evento** (lista de conversaciones y chat), el contador de consultas no leídas del botón **Consultas del evento** y el botón de chat de cada fila de Ventas. La compra desde el lado comprador (Elegir entradas, Pago, Mis compras) es la feature 004.

## Clarifications

### Session 2026-11-22

- Q: ¿La tabla de Ventas muestra todas las compras de una vez o se carga por partes? → A: Se carga de a 20, de la más reciente a la más antigua, con el botón **Ver más** (secundario) que agrega las 20 siguientes, igual que las reseñas de la feature 003. Los contadores de los chips son siempre del total (FR-011).
- Q: ¿**Marcar utilizada** entra en esta feature? → A: Sí, entra como P2 (US3, FR-012 a FR-015).
- Q: ¿El seed debe tener compras que sumen exactamente las vendidas de cada tipo? → A: Sí. El seed genera compras de ejemplo (de los compradores del seed, con varios estados y medios de pago) que suman exactamente las vendidas de cada tipo de entrada de cada evento, conservando las compras existentes (FR-018).
- Q: ¿Desde cuándo puede el organizador marcar como utilizada una compra Confirmada? → A: Desde el día del evento (00:00, hora de Argentina) en adelante, sin límite posterior; antes de ese día **Marcar utilizada** no aparece y el sistema lo rechaza (FR-012, FR-014).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El organizador ve la disponibilidad y lo recaudado de su evento (Priority: P1)

Un integrante de Compañía La Trama está en Mis eventos y hace clic en la tarjeta de Hamlet en el Galpón. Entra al panel del evento: arriba ve Volver, el título, "Sáb 21 nov · Galpón de Guevara, Chacarita" y el Tag **Publicado**, con las acciones **Editar evento** y **Consultas del evento**. Debajo ve la **Disponibilidad por tipo de entrada** (una barra por tipo, con cuántas quedan y cuántas se vendieron) y la tarjeta **Recaudado** con el total en plata, las entradas vendidas y las compras activas.

**Why this priority**: es lo que el organizador necesita para saber cómo viene la venta de su evento ("barras de vendidas vs. cupo por tipo de entrada" del wireframe). Sin esto el panel es solo una cabecera.

**Independent Test**: ingresar con `produccion@latrama.com.ar`, abrir Hamlet en el Galpón desde Mis eventos y verificar las tres barras (General 66/150, Platea 68/80, VIP 20/20 "Agotada") y el Recaudado ($ 2.536.000, 154 entradas vendidas).

**Acceptance Scenarios**:

1. **Given** un organizador con sesión iniciada en Mis eventos, **When** hace clic en la tarjeta de uno de sus eventos, **Then** se abre el panel de ese evento con Volver, título, "{fecha corta} · {sala}", Tag de estado, **Editar evento** y **Consultas del evento**.
2. **Given** el panel de Hamlet en el Galpón, **Then** la sección **Disponibilidad por tipo de entrada** muestra, por cada tipo y en el orden en que fueron cargados, nombre + precio ("Platea · $ 18.000"), una barra proporcional a vendidas/cupo, "Quedan N" y "{vendidas} / {cupo} vendidas" (p. ej. "Quedan 12" y "68 / 80 vendidas").
3. **Given** un tipo de entrada con todas sus entradas vendidas (VIP 20/20), **Then** en lugar de "Quedan 0" se muestra "Agotada" y la barra se ve completa.
4. **Given** el panel de cualquier evento, **Then** la tarjeta **Recaudado** muestra "$ X", donde X = Σ (vendidas × precio) de cada tipo, y la línea "N entradas vendidas · M compras activas", donde N es la suma de vendidas y M la cantidad de compras del evento que no están Canceladas ni Reembolsadas.
5. **Given** un evento en **Borrador** o recién publicado sin ventas, **Then** cada barra está vacía, dice "Quedan {cupo}" y "0 / {cupo} vendidas", y Recaudado muestra "$ 0" y "0 entradas vendidas · 0 compras activas".
6. **Given** el panel, **When** el organizador hace clic en **Volver**, **Then** vuelve a Mis eventos.
7. **Given** un evento Finalizado (Edipo Rey), **Then** el panel muestra disponibilidad, Recaudado y ventas igual que los demás, pero no muestra **Editar evento** (regla de la feature 002).

---

### User Story 2 - El organizador revisa las ventas del evento (Priority: P1)

En el mismo panel, debajo de la disponibilidad, el organizador ve la sección **Ventas**: una tabla con cada compra del evento (número, comprador, entradas, estado, medio de pago, monto) y chips para filtrar por estado, cada uno con su contador.

**Why this priority**: es la "tabla de ventas (número, comprador, estado, medio de pago, monto)" del wireframe; le permite al organizador saber quién compró y en qué estado está cada compra.

**Independent Test**: abrir el panel de Edipo Rey y verificar que la tabla lista sus compras (entre ellas #A-0655 de Sofía Gómez, "General × 1", Utilizada, Tarjeta de débito, $ 10.000); en el panel de Hamlet en el Galpón, tocar el chip **Utilizadas** y ver "No hay ventas con este estado.".

**Acceptance Scenarios**:

1. **Given** el panel de un evento con compras, **Then** la tabla **Ventas** tiene las columnas **Número, Comprador, Entradas, Estado, Medio de pago, Monto, Acciones**, con una fila por compra: "#A-NNNN", nombre y apellido del comprador, "{tipo} × {cantidad}", Tag de estado, medio de pago y monto en formato de plata ("$ 36.000").
2. **Given** la tabla, **Then** las compras aparecen de la más reciente a la más antigua.
3. **Given** la sección Ventas, **Then** arriba de la tabla se ven los chips **Todas, Confirmadas, Pendientes, Utilizadas, Canceladas, Reembolsadas**, cada uno con la cantidad de compras del evento en ese estado; **Todas** está seleccionado al entrar.
4. **Given** el chip **Utilizadas** seleccionado, **Then** la tabla muestra solo las compras Utilizadas y el contador de cada chip no cambia.
5. **Given** un chip cuyo estado no tiene compras, **When** se lo selecciona, **Then** en lugar de la tabla se ve "No hay ventas con este estado.".
6. **Given** un evento sin ninguna compra, **Then** con **Todas** seleccionado se ve "No hay ventas con este estado." y todos los contadores en 0.
7. **Given** un evento con más de 20 compras en el filtro elegido, **Then** la tabla muestra las 20 más recientes y debajo el botón **Ver más**; **When** el organizador lo toca, **Then** se agregan abajo las 20 siguientes, hasta mostrarlas todas (ahí el botón desaparece).
8. **Given** la tabla con más de una carga mostrada, **When** el organizador cambia de chip, **Then** la tabla vuelve a empezar desde las 20 más recientes de ese estado.

---

### User Story 3 - El organizador marca una entrada como utilizada (Priority: P2)

El día del evento, en el ingreso, el organizador busca la compra en la tabla de Ventas y hace clic en **Marcar utilizada**. La compra pasa a **Utilizada** y, desde ese momento, el comprador puede calificar su experiencia.

**Why this priority**: cierra el ciclo de la compra (Confirmada → Utilizada) y es la condición para que existan calificaciones nuevas, pero el panel ya aporta valor solo con la consulta de ventas.

**Independent Test**: con una compra Confirmada de un evento del organizador cuyo día ya llegó, hacer clic en **Marcar utilizada** y verificar que la fila pasa a Utilizada, los contadores de **Confirmadas** y **Utilizadas** se actualizan y el botón desaparece de esa fila.

**Acceptance Scenarios**:

1. **Given** una compra **Confirmada** de un evento cuyo día ya llegó (hoy o antes), **Then** su columna Acciones muestra **Marcar utilizada**; las compras en cualquier otro estado no lo muestran.
2. **Given** una compra Confirmada de un evento que es mañana o más adelante, **Then** su fila no muestra **Marcar utilizada**.
3. **Given** una compra Confirmada de un evento cuyo día ya llegó, **When** el organizador hace clic en **Marcar utilizada**, **Then** la compra pasa a **Utilizada**, la fila muestra el nuevo Tag, los contadores de los chips se actualizan y la cantidad de compras activas de Recaudado no cambia.
4. **Given** dos organizadores (o dos pestañas) viendo la misma compra, **When** uno la marca como utilizada y el otro intenta hacerlo después, **Then** el segundo ve un aviso de que la compra ya no está Confirmada y la tabla se actualiza con el estado real.
5. **Given** una compra marcada como utilizada, **Then** la compra queda en estado Utilizada para el comprador y cumple la condición para ser calificada (regla de calificaciones de `pantallas.md`). Ver la compra en Mis compras (feature 004) y calificarla (feature de calificaciones) quedan fuera de esta feature.

---

### User Story 4 - El organizador solo accede a los paneles de sus eventos (Priority: P1)

Un organizador que escribe a mano la dirección del panel de un evento de otra compañía, o de un evento que no existe, no ve ningún dato de ese evento.

**Why this priority**: el panel expone compradores, montos y medios de pago; mostrar los de otra compañía sería una fuga de datos.

**Independent Test**: con la sesión de La Trama, abrir la dirección del panel de Risas a Domicilio (Club del Chiste) y verificar el mensaje "No encontramos el evento." con el link a Mis eventos.

**Acceptance Scenarios**:

1. **Given** un organizador con sesión, **When** abre el panel de un evento de otra compañía o de un id inexistente, **Then** ve "No encontramos el evento." + link a **Mis eventos**, sin ningún dato del evento ni de sus ventas.
2. **Given** alguien sin sesión de organizador, **When** abre la dirección de un panel, **Then** se lo lleva al Ingreso de organizadores.
3. **Given** un organizador que intenta **Marcar utilizada** una compra de un evento ajeno, **Then** la acción se rechaza igual que si la compra no existiera.

---

### Edge Cases

- **Error de conexión al abrir el panel**: se muestra "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar** (mismo texto que el resto de la app).
- **Evento Finalizado con compras Confirmadas sin usar**: siguen pudiendo marcarse como utilizadas (registro tardío del ingreso).
- **Error de conexión al marcar utilizada**: la compra sigue como estaba y se muestra el mismo aviso; el organizador puede reintentar.
- **Tipo de entrada sin nombre o sin precio en un Borrador**: se muestra "Sin nombre" y se omite el precio; la barra usa el cupo si existe. Sin cupo se muestra solo "0 / 0 vendidas" con la barra vacía, sin "Quedan" ni "Agotada".
- **Evento Borrador sin fecha o sin ubicación**: la cabecera usa "Fecha a definir" / "Ubicación" y el título "Nombre del evento" si falta (igual que la versión mínima de la feature 002).
- **Sesión vencida** mientras se ve el panel o al marcar utilizada: se cierra la sesión y se vuelve al Ingreso, como en el resto del panel.
- **Compra de un comprador que ya no tiene nombre cargado**: se muestra su email en la columna Comprador.
- **Ventas que cambian mientras el panel está abierto** (otro comprador compra): el panel muestra lo que había al abrirlo; se actualiza al volver a entrar o al reintentar. No se exige actualización en tiempo real.
- **Consistencia entre vendidas y compras del seed**: hoy las vendidas de cada tipo del seed no salen de compras reales (Hamlet dice 154 vendidas y no tiene compras). El seed MUST completarse con compras que sumen exactamente esas vendidas (FR-018).
- **Ver más con error de conexión**: las filas ya cargadas quedan y al pie se muestra el aviso de conexión con **Reintentar**.

## Requirements *(mandatory)*

### Functional Requirements

**Acceso y cabecera**

- **FR-001**: Al hacer clic en una tarjeta de Mis eventos (o al terminar de publicar/guardar, como ya hace la feature 002) el organizador MUST llegar al panel completo del evento.
- **FR-002**: El panel MUST mostrar Volver (→ Mis eventos), título, "{fecha corta} · {sala}", Tag de estado (Publicado, Borrador o Finalizado), **Editar evento** (oculto si está Finalizado) y **Consultas del evento** (secundario, deshabilitado al 45% y sin contador hasta que exista la feature de Consultas).
- **FR-003**: Solo el organizador dueño del evento MUST poder ver su panel y sus ventas; un evento ajeno o inexistente MUST mostrar "No encontramos el evento." + link a Mis eventos, sin revelar si existe.
- **FR-004**: El panel MUST estar dentro del área con sesión de organizador; sin sesión válida MUST llevar al Ingreso de organizadores.

**Disponibilidad**

- **FR-005**: El panel MUST mostrar, por cada tipo de entrada en el orden en que fue cargado: nombre, precio con formato de plata, barra de progreso proporcional a vendidas/cupo, "Quedan N" (N = cupo − vendidas) o "Agotada" cuando N = 0, y "{vendidas} / {cupo} vendidas".

**Recaudado**

- **FR-006**: La tarjeta **Recaudado** MUST mostrar "$ X" con X = Σ (vendidas × precio) por tipo de entrada, y "N entradas vendidas · M compras activas", con N = Σ vendidas y M = compras del evento que no están Canceladas ni Reembolsadas. Usa "1 entrada vendida" y "1 compra activa" en singular.

**Ventas**

- **FR-007**: La sección **Ventas** MUST listar las compras del evento en una tabla con las columnas Número ("#A-NNNN"), Comprador (nombre y apellido), Entradas ("{tipo} × {cantidad}"), Estado (Tag), Medio de pago, Monto ("$ X") y Acciones, ordenadas de la más reciente a la más antigua.
- **FR-008**: La sección MUST ofrecer los chips de filtro **Todas, Confirmadas, Pendientes, Utilizadas, Canceladas, Reembolsadas**, cada uno con la cantidad total de compras del evento en ese estado; **Todas** está seleccionado por defecto. Los contadores MUST reflejar el total del evento, no solo lo que se ve.
- **FR-009**: Si el filtro elegido no tiene compras, MUST mostrarse "No hay ventas con este estado." en lugar de la tabla.
- **FR-010**: Los estados de compra MUST nombrarse exactamente Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada; los medios de pago, Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia.
- **FR-011**: La tabla MUST cargarse de a 20 compras (las más recientes primero) y, si hay más, mostrar **Ver más** (secundario), que agrega las 20 siguientes del mismo filtro. Cambiar de chip vuelve a empezar desde las primeras 20. Los contadores de los chips y los valores de Recaudado son siempre del total.

**Marcar utilizada**

- **FR-012**: Cada fila de una compra **Confirmada** MUST mostrar la acción **Marcar utilizada** si el día del evento ya llegó (desde las 00:00 de la fecha del evento, hora de Argentina, sin límite posterior); ninguna otra fila la muestra.
- **FR-013**: Marcar utilizada MUST pasar la compra de Confirmada a **Utilizada** y actualizar en el panel la fila, los contadores de los chips y, si corresponde, el filtro activo (una compra que deja de cumplir el filtro sale de la vista).
- **FR-014**: El sistema MUST rechazar marcar como utilizada una compra que no esté Confirmada (avisando que la compra ya no está Confirmada y refrescando su estado), una compra de un evento cuyo día todavía no llegó, o una que no pertenezca a un evento del organizador (como si no existiera).
- **FR-015**: Una compra marcada como utilizada MUST quedar guardada en estado Utilizada, que es la condición para que el comprador pueda calificarla según las reglas de calificaciones. La pantalla de calificar no es parte de esta feature.

**Errores y voz**

- **FR-016**: Ante un error de conexión al cargar el panel MUST mostrarse "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**; ante un error al marcar utilizada, el mismo texto sin cambiar la compra.
**Datos de ejemplo**

- **FR-018**: Los datos de ejemplo con los que arranca la app MUST incluir, para cada tipo de entrada de cada evento, compras cuyas cantidades sumen exactamente sus vendidas (sin contar las Canceladas ni las Reembolsadas, que liberan sus lugares). Las compras ya existentes del seed (las calificadas y las de Sofía Gómez de `pantallas.md`) se conservan y forman parte de esa suma. Las compras nuevas usan los compradores de ejemplo, montos = precio × cantidad, cantidades de 1 a 10, los cuatro medios de pago, y estados coherentes con la fecha del evento: en eventos futuros, Confirmadas y Pendientes de pago; en eventos pasados, Utilizadas (y alguna Confirmada sin usar). Además, cada evento futuro con ventas MUST tener al menos una compra Cancelada o Reembolsada, para que todos los chips se puedan probar.

**Voz y design system**

- **FR-017**: Todos los textos MUST seguir la voz del design system (voseo, sentence case, plata "$ 18.000", fechas "Sáb 21 nov · 21:00") y usar solo tokens y componentes del design system (StatCard, DataTable, chips, Tag, barra de progreso).

### Key Entities *(include if feature involves data)*

- **Evento**: el evento del organizador; aporta título, fecha y hora, ubicación, estado y sus tipos de entrada.
- **Tipo de entrada**: nombre, cupo, precio y vendidas; de él salen "Quedan N", la barra de disponibilidad y su parte del Recaudado.
- **Compra**: número (`A-NNNN`), comprador, evento, tipo de entrada, cantidad, monto, medio de pago, estado y fecha de creación. Es cada fila de Ventas y la que cambia de estado con Marcar utilizada.
- **Comprador**: nombre y apellido (o email si falta) que se muestra en la columna Comprador.
- **Organizador**: dueño del evento; solo él ve el panel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde Mis eventos, el organizador llega al panel de cualquiera de sus eventos con un solo clic y ve disponibilidad, Recaudado y Ventas en menos de 2 segundos.
- **SC-002**: Para los eventos del seed, el 100% de los valores mostrados (quedan, vendidas/cupo, Recaudado, entradas vendidas, compras activas y contadores de chips) coincide con el cálculo hecho a mano sobre los datos de ejemplo.
- **SC-003**: El organizador encuentra las compras de un estado dado (p. ej. las Pendientes) con un solo clic sobre un chip.
- **SC-004**: Marcar una entrada como utilizada toma un solo clic y el cambio se ve en el panel en menos de 1 segundo, sin recargar la pantalla.
- **SC-005**: En el 100% de los intentos de abrir el panel o marcar utilizada sobre eventos de otra compañía, no se muestra ningún dato de ese evento ni se modifica ninguna compra.

## Assumptions

- La feature 002 ya resolvió el Ingreso, Mis eventos, la navegación hacia el panel, la versión mínima de su cabecera y la regla de que un Finalizado no se edita; esta feature completa el cuerpo de Organizadores 04 sobre esa base.
- Las **vendidas** de cada tipo de entrada son las que guarda el evento (las mismas que muestra Mis eventos); el panel no las recalcula desde las compras, pero el seed queda consistente con ellas (FR-018). La feature 004 (compra desde el lado comprador) también toca compras y seed: al mergear hay que conciliar las dos versiones del seed para que la suma siga coincidiendo. Recaudado se calcula con el precio actual de cada tipo, como define `pantallas.md`.
- Las compras que muestra Ventas son las que existan para el evento: las del seed y las que cree la feature 004 (compra desde el lado comprador). Esta feature no crea compras desde la interfaz.
- **Marcar utilizada** no pide confirmación (el diseño no tiene diálogo) y no se puede deshacer.
- El botón de chat de cada fila y el contador de **Consultas del evento** quedan para la feature de Consultas; mientras tanto, la columna Acciones solo tiene **Marcar utilizada** y **Consultas del evento** sigue deshabilitado.
- El panel no se actualiza en tiempo real; muestra el estado al abrirse y después de cada acción del propio organizador.
- **Entorno de desarrollo de esta feature**: como hay otra sesión trabajando en paralelo con los puertos por defecto (backend 3000, Expo 8081), en esta feature el backend se levanta en el puerto **3005** y el front en el puerto **8085**, apuntando a ese backend (`EXPO_PUBLIC_API_URL=http://localhost:3005`).
