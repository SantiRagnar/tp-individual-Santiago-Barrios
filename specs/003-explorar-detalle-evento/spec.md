# Feature Specification: Explorar y detalle de evento (compradores)

**Feature Branch**: `Feature/003-explorar-detalle-evento`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "explorar y detalle de evento, Como comprador quiero poder explorar y ver los detalle de un evento"

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Compradores 02 · Explorar** (mobile, 390 × 844): saludo, búsqueda, chips de categoría, ordenar, contador, lista de EventCard y estado vacío.
- **Compradores 04 · Detalle del evento** (mobile, 390 × 844): AppBar, imagen, categoría, facts, descripción, opiniones sobre el organizador y ActionFooter.
- **Compradores 11 · Favoritos** (mobile, 390 × 844): lista de favoritos, quitar con el corazón y estado vacío.
- BottomNav (Explorar / Favoritos).

**Fuera de esta feature**: el Recordatorio de calificación de Explorar (llega con la feature de calificaciones), 03 · Menú de perfil (incluida su fila Favoritos), 05 · Elegir entradas y el resto del flujo de compra.

## Clarifications

### Session 2026-11-22

- Q: ¿Marcar/desmarcar favoritos entra en esta feature? → A: Sí, entra todo: el corazón en EventCard y en el Detalle, y la pantalla 11 · Favoritos con la BottomNav (User Story 5, FR-019 a FR-023).
- Q: ¿Qué hace **Comprar** mientras no existe Elegir entradas? → A: En esta feature es un botón que se ve habilitado pero no hace nada, en la EventCard y en el Detalle; la feature de compra le da su acción (FR-009). **Agotado** sigue viéndose deshabilitado.
- Q: ¿Con qué reseñas de ejemplo arranca la app para que los organizadores tengan puntaje? → A: La de Sofía (Edipo Rey, 4★) más reseñas de otros compradores de ejemplo, cada una respaldada por una compra Utilizada de ese comprador, para que los 3 organizadores tengan entre 2 y 4 reseñas con puntajes distintos.
- Q: ¿Qué ve el comprador si abre el Detalle de un evento que no existe, es Borrador o ya terminó? → A: Una pantalla con AppBar (Volver), el mensaje "Este evento no está disponible." y un botón **Volver a Explorar** (FR-016).
- Q: ¿Cómo se ve un organizador sin reseñas en la tarjeta y en el Detalle? → A: En la tarjeta, solo el nombre del organizador, sin puntaje; en el Detalle, la sección de opiniones muestra el nombre y "Todavía no tiene reseñas."; al ordenar por Puntaje, sus eventos van al final (FR-008, FR-013).
- Q: En el Detalle, ¿se muestran todas las reseñas del organizador o solo algunas? → A: Las 5 más recientes y un botón **Ver más** que agrega abajo las 5 siguientes, de a 5, hasta mostrarlas todas; pensado para que escale con muchas reseñas (FR-013, FR-024).
- Q: ¿La lista de Explorar también se carga por partes? → A: Sí: trae 10 eventos y carga los 10 siguientes automáticamente al llegar al final; búsqueda, categoría y orden se resuelven en el servicio y el contador muestra el total de resultados (FR-007, FR-025).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador explora los eventos disponibles (Priority: P1)

Sofía ingresa a la app y llega a Explorar. Ve "Hola, Sofía", "¿Qué querés ver?", el contador "5 eventos" y una lista de tarjetas: imagen, categoría, título, fecha corta, sala, "Desde $ X", puntaje · organizador y **Comprar**. Los eventos están ordenados por fecha, el más próximo primero.

**Why this priority**: es la pantalla raíz de la app de compradores y la puerta de entrada a cualquier compra. Sin ella, los eventos publicados por los organizadores no llegan a nadie.

**Independent Test**: ingresar con `sofia.gomez@correo.com` (con "hoy" = 2026-11-09) y verificar que se ven exactamente los 5 eventos publicados y futuros del seed (Risas a Domicilio, Hamlet en el Galpón, Cartas a Julieta, Bodas de sangre, Impro Express), en ese orden, y ningún Borrador ni Finalizado.

**Acceptance Scenarios**:

1. **Given** un comprador con sesión iniciada, **When** abre Explorar, **Then** ve solo los eventos Publicados cuya fecha y hora todavía no pasaron, de todos los organizadores.
2. **Given** el seed, **Then** no aparecen La gaviota (Borrador), Edipo Rey (Finalizado) ni Tango en el Conventillo (fecha pasada).
3. **Given** la tarjeta de Hamlet en el Galpón, **Then** muestra imagen, Tag "Teatro", título, "Sáb 21 nov · 21:00", "Galpón de Guevara, Chacarita", "Desde $ 12.000", el puntaje de Compañía La Trama con un decimal y "Compañía La Trama".
4. **Given** 5 eventos visibles, **Then** el contador dice "5 eventos"; con uno, "1 evento".
5. **Given** una tarjeta, **When** el comprador la toca (fuera del botón **Comprar**), **Then** se abre el Detalle de ese evento.

---

### User Story 2 - El comprador busca, filtra y ordena (Priority: P1)

Sofía quiere ver algo de comedia. Toca el chip "Comedia" y quedan dos eventos. Después borra el filtro, escribe "galpón" en la búsqueda y aparece Hamlet en el Galpón. Por último elige ordenar por Precio y ve primero el evento más barato.

**Why this priority**: con varios eventos, encontrar el que interesa es la razón de ser de Explorar; el wireframe pone búsqueda y categorías en primer plano.

**Independent Test**: sobre el seed, combinar chip "Comedia" + orden Precio y verificar que se ven Impro Express ($ 8.000) y luego Risas a Domicilio ($ 9.000); buscar "lumbre" y verificar que aparece solo Cartas a Julieta.

**Acceptance Scenarios**:

1. **Given** Explorar, **When** el comprador escribe en "Buscar evento, sala u organizador", **Then** la lista se filtra al instante por título, sala/ubicación o nombre del organizador, sin distinguir mayúsculas ni tildes ("galpon" encuentra "Galpón").
2. **Given** los chips Todos, Teatro, Comedia, Drama, Amor, **When** elige uno, **Then** quedan solo los eventos de esa categoría; "Todos" (seleccionado por defecto) quita el filtro. Solo puede haber un chip activo.
3. **Given** búsqueda y chip a la vez, **Then** se muestran los eventos que cumplen las dos condiciones, y el contador refleja la cantidad resultante.
4. **Given** el control Ordenar, **Then** ofrece Fecha (por defecto, más próxima primero), Precio (menor "desde" primero) y Puntaje (mejor puntaje del organizador primero); cambiar el orden no cambia el filtro.
5. **Given** más de 10 resultados, **When** el comprador llega al final de la lista, **Then** se cargan solos los 10 siguientes debajo, sin perder la posición; cuando ya están todos, no se carga nada más. El contador muestra siempre el total de resultados, no solo los cargados.
6. **Given** una lista con varias partes cargadas, **When** cambia la búsqueda, el chip o el orden, **Then** la lista vuelve a empezar desde los primeros 10 resultados del nuevo criterio.
7. **Given** una búsqueda o filtro sin resultados, **Then** se ve "No encontramos eventos — Probá con otra búsqueda o categoría." y el contador dice "0 eventos".

---

### User Story 3 - El comprador ve el detalle de un evento (Priority: P1)

Sofía toca Hamlet en el Galpón. Ve la imagen, el Tag "Teatro", "Sábado 21 de noviembre", "21:00 h", "Galpón de Guevara, Chacarita", "$ 12.000 a $ 26.000" y la descripción. Más abajo, las opiniones sobre Compañía La Trama: el puntaje promedio, "N reseñas de eventos anteriores" y la lista de reseñas. Abajo de todo, "Desde $ 12.000" y **Comprar**.

**Why this priority**: es lo que pide la historia ("ver los detalles de un evento") y el paso previo a comprar: horario, precio, ubicación y la reputación del organizador son lo que decide la compra.

**Independent Test**: abrir el Detalle de Hamlet en el Galpón y verificar todos los datos contra el seed, incluidas las reseñas del organizador; abrir el de Impro Express (un solo tipo) y verificar que el precio se ve como "$ 8.000", sin rango.

**Acceptance Scenarios**:

1. **Given** el Detalle de un evento, **Then** se ven: AppBar con Volver y el título del evento, imagen, Tag de categoría, facts (fecha larga, hora "HH:MM h", sala, precios), descripción, Opiniones sobre el organizador y ActionFooter con "Desde $ X" + **Comprar**.
2. **Given** un evento con varios tipos de entrada de precios distintos, **Then** el fact de precio dice "$ {mínimo} a $ {máximo}"; con un solo tipo o todos al mismo precio, un único precio.
3. **Given** las opiniones, **Then** muestran el puntaje promedio del organizador con un decimal, su nombre, "N reseñas de eventos anteriores" ("1 reseña de eventos anteriores" si es una) y cada reseña con autor (nombre + inicial del apellido, "Sofía G."), estrellas en texto (★★★★☆), evento y comentario ("Sin comentario." si no tiene).
4. **Given** las reseñas, **Then** son de todos los eventos del organizador, no solo del evento abierto, y se listan de la más reciente a la más antigua.
5. **Given** un organizador con 12 reseñas, **When** se abre el Detalle, **Then** se ven las 5 más recientes, el contador dice "12 reseñas de eventos anteriores" y abajo está **Ver más**; al tocarlo se agregan abajo las 5 siguientes (10 en total), y al tocarlo otra vez las 2 restantes y **Ver más** desaparece.
6. **Given** un organizador con 5 reseñas o menos, **Then** se ven todas y no aparece **Ver más**.
7. **Given** el Detalle, **When** toca Volver, **Then** regresa a Explorar con la búsqueda, el chip y el orden que tenía.

---

### User Story 4 - El comprador ve qué eventos están agotados (Priority: P2)

Un evento vendió todo su cupo en todos los tipos de entrada. En Explorar y en el Detalle, el botón dice **Agotado** y está deshabilitado, para que el comprador no inicie una compra imposible.

**Why this priority**: evita frustración y es una regla explícita del diseño, pero solo ocurre cuando un evento se queda sin lugares.

**Independent Test**: con un evento cuyos tipos tienen vendidas = cupo, verificar que la tarjeta y el ActionFooter del Detalle muestran **Agotado** deshabilitado y que el evento sigue apareciendo en Explorar.

**Acceptance Scenarios**:

1. **Given** un evento con al menos un tipo de entrada con lugares (aunque otros estén agotados, como el VIP de Hamlet), **Then** el botón dice **Comprar** y está habilitado.
2. **Given** un evento sin lugares en ningún tipo, **Then** sigue apareciendo en Explorar, y tanto la tarjeta como el Detalle muestran **Agotado** deshabilitado.
3. **Given** un evento agotado, **Then** "Desde $ X" se calcula igual, con el menor precio entre todos sus tipos.

---

### User Story 5 - El comprador guarda eventos en Favoritos (Priority: P2)

Sofía ve Bodas de sangre en Explorar, todavía no se decide y toca el corazón de la tarjeta. Más tarde va a la pestaña **Favoritos** de la BottomNav y lo encuentra ahí con su fecha y "Desde $ 15.000". Toca la tarjeta para ver el Detalle; ya no le interesa, así que toca el corazón del AppBar y el evento deja de ser favorito.

**Why this priority**: ayuda a decidir la compra sin perder los eventos que interesan, y la BottomNav del diseño ya tiene la pestaña. Depende de Explorar y del Detalle (historias 1 y 3).

**Independent Test**: marcar dos eventos como favoritos desde Explorar y desde el Detalle, abrir Favoritos y verificar que están los dos; quitar uno desde Favoritos y verificar que desaparece de la lista y que su corazón se ve vacío en Explorar. Cerrar sesión, volver a ingresar y verificar que el otro sigue en Favoritos.

**Acceptance Scenarios**:

1. **Given** una EventCard en Explorar o el AppBar del Detalle, **When** el comprador toca el corazón vacío, **Then** el evento pasa a ser favorito y el corazón se ve lleno en todas las pantallas donde aparece ese evento.
2. **Given** un evento favorito, **When** toca el corazón lleno (en Explorar, en el Detalle o en Favoritos), **Then** deja de ser favorito; si estaba en Favoritos, desaparece de la lista.
3. **Given** la pestaña **Favoritos**, **Then** se ve el título "Favoritos" y una tarjeta por favorito con título, fecha corta, "Desde $ X" y el corazón para quitar; tocar la tarjeta abre el Detalle. La BottomNav muestra **Favoritos** activa.
4. **Given** un comprador sin favoritos, **Then** Favoritos muestra "Todavía no guardaste eventos — Tocá el corazón en un evento para encontrarlo acá.".
5. **Given** favoritos guardados, **When** el comprador cierra sesión y vuelve a ingresar (en el mismo u otro dispositivo, mientras el servicio no se reinicie), **Then** sus favoritos siguen ahí; cada comprador ve solo los suyos.

---

### Edge Cases

- Evento que se vuelve Finalizado (pasa su fecha y hora) mientras el comprador está en Explorar: desaparece al volver a cargar la lista; si estaba abierto su Detalle, al refrescar se trata como evento no disponible.
- Acceso al Detalle de un evento que no existe, es Borrador o está Finalizado (p. ej. por un link viejo): se ve "Este evento no está disponible." con el botón **Volver a Explorar** (FR-016); nunca se muestran datos de un Borrador.
- Organizador sin reseñas: ver FR-008 y FR-013 (sin puntaje en la tarjeta, "Todavía no tiene reseñas." en el Detalle, al final al ordenar por Puntaje).
- Empates al ordenar (mismo precio "desde" o mismo puntaje): se desempata por fecha, más próxima primero.
- Entrada gratuita (precio 0): se muestra "$ 0" según el formato de plata.
- Evento sin imagen: la tarjeta y el Detalle muestran un espacio de imagen neutro, no una imagen rota.
- Búsqueda con espacios alrededor o solo espacios: se ignoran los espacios; solo espacios equivale a búsqueda vacía.
- Sin conexión o error del servicio al cargar Explorar o el Detalle: se ve "No pudimos conectarnos. Probá de nuevo en un rato." con la opción de reintentar.
- Sesión vencida: se lleva al Ingreso de compradores (FR-015 de la feature 001).
- Descripción o título largos: el texto se ajusta sin cortar la pantalla ni generar scroll horizontal.
- Una reseña nueva que se publica mientras el comprador va tocando **Ver más**: no se repiten ni se saltean reseñas en la lista ya cargada; la nueva aparece al volver a abrir el Detalle.
- Error al tocar **Ver más** (sin conexión): las reseñas ya mostradas se conservan, se ve "No pudimos conectarnos. Probá de nuevo en un rato." y **Ver más** sigue disponible para reintentar.
- Cambio de búsqueda mientras se escribe: la lista muestra solo los resultados del último texto escrito; no se mezclan resultados de búsquedas anteriores que lleguen tarde.
- Un evento se publica o se finaliza mientras el comprador va cargando partes de Explorar: no se repiten eventos en la lista ya cargada; el cambio se ve al volver a abrir Explorar o al cambiar el filtro.
- Error al cargar la parte siguiente de Explorar: los eventos ya mostrados se conservan, se ve "No pudimos conectarnos. Probá de nuevo en un rato." y se puede reintentar al volver a llegar al final.
- Favorito que deja de ser visible (pasa su fecha y queda Finalizado): no se muestra en Favoritos, porque ya no se puede comprar.
- Toques rápidos repetidos en el corazón: el estado final es el del último toque y nunca se duplica un favorito.
- Error al marcar o quitar un favorito (sin conexión): el corazón vuelve a su estado anterior y se ve "No pudimos conectarnos. Probá de nuevo en un rato.".
- Tocar **Comprar** no navega, no abre el Detalle ni muestra mensajes (Clarifications); tocar la tarjeta fuera del botón sí abre el Detalle.

## Requirements *(mandatory)*

### Functional Requirements

**Visibilidad**

- **FR-001**: El lado compradores MUST mostrar solo eventos **Publicados** cuya fecha y hora todavía no pasaron. Borradores y Finalizados MUST quedar ocultos tanto en Explorar como en el Detalle, también si se los pide directamente al servicio.
- **FR-002**: Explorar y el Detalle MUST requerir sesión de comprador iniciada.

**Explorar (Compradores 02)**

- **FR-003**: Explorar MUST mostrar el encabezado con Avatar de iniciales, "Hola, {nombre}" y "¿Qué querés ver?". El Avatar conserva el comportamiento actual de la feature 001 hasta que exista el Menú de perfil.
- **FR-004**: MUST ofrecer una búsqueda "Buscar evento, sala u organizador" que filtre por título, sala/ubicación y nombre del organizador, sin distinguir mayúsculas ni tildes, mientras el comprador escribe.
- **FR-005**: MUST ofrecer los chips de categoría Todos, Teatro, Comedia, Drama y Amor, con un único chip activo; "Todos" está activo por defecto.
- **FR-006**: MUST ofrecer Ordenar con las opciones Fecha (por defecto, más próxima primero), Precio (menor precio "desde" primero) y Puntaje (mayor puntaje del organizador primero; sin reseñas al final). Los empates se resuelven por fecha.
- **FR-007**: Búsqueda, categoría y orden MUST combinarse y resolverse en el servicio (no en el dispositivo), y el contador MUST mostrar la cantidad total de resultados ("N eventos" / "1 evento"), aunque todavía no estén todos cargados.
- **FR-025**: Explorar MUST cargar los resultados de a 10: al abrir o al cambiar búsqueda, categoría u orden se muestran los primeros 10, y al llegar al final de la lista se agregan automáticamente los 10 siguientes debajo, mostrando un indicador de carga mientras tanto, hasta que no queden más. El servicio MUST entregar los eventos por páginas, ya filtrados y ordenados.
- **FR-008**: Cada evento MUST verse como EventCard: imagen, Tag de categoría, corazón de favorito (FR-019), título, fecha corta ("Sáb 21 nov · 21:00"), sala, "Desde $ X" (menor precio entre sus tipos de entrada), puntaje con un decimal · nombre del organizador (si el organizador no tiene reseñas, solo su nombre, sin puntaje) y botón **Comprar** (o **Agotado** deshabilitado, FR-014).
- **FR-009**: Tocar la tarjeta MUST abrir el Detalle del evento. En esta feature, **Comprar** (en la EventCard y en el ActionFooter del Detalle) MUST verse habilitado y no hacer nada al tocarlo: no navega, no abre el Detalle y no muestra mensajes. La feature de compra le asigna su acción (ir a Elegir entradas).
- **FR-010**: Sin resultados, MUST verse "No encontramos eventos — Probá con otra búsqueda o categoría.".
- **FR-011**: Explorar y Favoritos MUST mostrar la BottomNav con **Explorar** y **Favoritos**, marcando activa la pestaña actual; tocar una pestaña lleva a su pantalla.

**Detalle del evento (Compradores 04)**

- **FR-012**: El Detalle MUST mostrar AppBar (Volver, título y corazón de favorito), imagen, Tag de categoría, facts (fecha larga "Sábado 21 de noviembre", hora "21:00 h", sala, precio o rango "$ 12.000 a $ 26.000") y la descripción.
- **FR-013**: MUST mostrar **Opiniones sobre el organizador**: puntaje promedio con un decimal, nombre del organizador, "N reseñas de eventos anteriores" y la lista de reseñas (autor "Nombre I.", estrellas en texto, evento, comentario o "Sin comentario."), de la más reciente a la más antigua, cargadas de a 5 (FR-024). El puntaje es el promedio de todas las calificaciones del organizador, en todos sus eventos. Si no tiene reseñas, la sección MUST mostrar su nombre y "Todavía no tiene reseñas.", sin puntaje ni contador.
- **FR-014**: El ActionFooter MUST mostrar "Desde $ X" y **Comprar**; si ningún tipo de entrada tiene lugares disponibles (cupo − vendidas = 0 en todos), MUST mostrar **Agotado** deshabilitado. La misma regla aplica al botón de la EventCard.
- **FR-015**: Volver MUST regresar a Explorar conservando búsqueda, categoría y orden.
- **FR-016**: Si el evento pedido no existe o no es visible (FR-001), MUST verse una pantalla con AppBar (Volver), el mensaje "Este evento no está disponible." y el botón **Volver a Explorar**, sin ningún dato del evento.

**Formato y diseño**

- **FR-017**: Montos, fechas y textos MUST seguir el design system: formato de plata `$ 18.000`, fecha corta `Sáb 21 nov · 21:00`, voseo y sentence case, usando solo tokens y componentes del design system (EventCard, Chip, SegmentedControl, Tag, facts, ActionFooter, BottomNav).
- **FR-018**: Los datos (precios, lugares disponibles, puntajes) MUST reflejar el estado actual del servicio al abrir cada pantalla: un evento editado o publicado por un organizador se ve actualizado la próxima vez que el comprador abre Explorar o el Detalle.

- **FR-024**: El Detalle MUST mostrar al principio solo las 5 reseñas más recientes. Si hay más, MUST mostrarse debajo de la lista el botón **Ver más**, que agrega abajo las 5 siguientes sin perder las ya mostradas ni mover la pantalla; el botón desaparece cuando ya están todas. El servicio MUST entregar las reseñas por páginas de 5 (no todas de una vez), y el contador "N reseñas de eventos anteriores" y el puntaje promedio MUST reflejar siempre el total, no solo las cargadas.

**Favoritos (Compradores 11)**

- **FR-019**: El comprador MUST poder marcar y desmarcar un evento visible como favorito con el corazón, desde la EventCard de Explorar, el AppBar del Detalle y la tarjeta de Favoritos. El corazón MUST verse lleno si el evento es favorito y vacío si no, de forma consistente en las tres pantallas.
- **FR-020**: Los favoritos MUST guardarse en el servicio, asociados al comprador con sesión iniciada: se conservan al cerrar sesión o cambiar de dispositivo, y cada comprador ve solo los suyos. Un evento es favorito a lo sumo una vez por comprador.
- **FR-021**: La pantalla Favoritos MUST mostrar el título "Favoritos" y una tarjeta por evento favorito visible (FR-001) con título, fecha corta, "Desde $ X" y corazón para quitar, ordenadas por fecha (más próxima primero). Tocar la tarjeta MUST abrir el Detalle.
- **FR-022**: Sin favoritos visibles, MUST verse "Todavía no guardaste eventos — Tocá el corazón en un evento para encontrarlo acá.".
- **FR-023**: Solo se MUST poder marcar como favorito un evento visible para compradores (FR-001); un pedido sobre un evento inexistente u oculto se rechaza.

### Key Entities

- **Evento (vista de comprador)**: nombre (el "título" de la tarjeta), descripción, categoría, fecha y hora, sala/ubicación, imagen, organizador, tipos de entrada y estado visible. Solo los Publicados y futuros son visibles para compradores.
- **Tipo de entrada**: nombre, precio, cupo y vendidas; de ahí se derivan lugares disponibles, "Desde $ X", el rango de precios y si el evento está agotado.
- **Organizador**: nombre de la compañía/productora y puntaje promedio derivado de sus calificaciones.
- **Calificación / reseña**: puntaje 1–5, comentario opcional, autor (comprador, mostrado como "Nombre I."), evento al que corresponde y fecha. Pertenece al organizador del evento; en esta feature solo se lee.
- **Favorito**: relación entre un comprador y un evento que guardó (con la fecha en que lo marcó). Único por par comprador–evento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un comprador encuentra un evento concreto del seed (por título, sala u organizador) y abre su Detalle en menos de 30 segundos desde que llega a Explorar.
- **SC-002**: El 100 % de los eventos mostrados a compradores son Publicados y futuros; ningún Borrador ni Finalizado aparece en Explorar ni en el Detalle, ni siquiera pidiéndolo directamente.
- **SC-003**: Cambiar búsqueda, categoría u orden actualiza la lista en menos de 1 segundo percibido, sin recargar la pantalla.
- **SC-004**: En el Detalle, el comprador ve fecha, hora, sala, precios y opiniones del organizador sin salir de la pantalla, en una sola vista con scroll vertical, sin scroll horizontal en un teléfono de 390 px de ancho.
- **SC-005**: Para todos los eventos del seed, "Desde $ X", el rango de precios, el puntaje del organizador y el estado Comprar/Agotado coinciden con los calculados a mano a partir de los datos.
- **SC-006**: Un comprador guarda un evento como favorito con un solo toque y lo encuentra en la pestaña Favoritos en menos de 10 segundos; el estado del corazón coincide en Explorar, Detalle y Favoritos el 100 % de las veces.
- **SC-007**: Con un catálogo de 1.000 eventos visibles y un organizador con 1.000 reseñas, Explorar y el Detalle se abren tan rápido como con los datos del seed: el comprador ve los primeros resultados en menos de 2 segundos, porque nunca se traen más de 10 eventos o 5 reseñas por vez.

## Assumptions

- **Fecha de referencia**: los ejemplos usan "hoy" = 2026-11-09, como el seed; los eventos visibles dependen de la fecha y hora reales del servicio.
- **Reseñas de ejemplo** (Clarifications): todavía no existe la feature de calificaciones, así que esta feature agrega al seed compradores de ejemplo, cada uno con compras Utilizadas de eventos ya realizados (Edipo Rey, Tango en el Conventillo u otros eventos pasados que hagan falta) y su calificación. Junto con la de Sofía (Edipo Rey, 4★), cada organizador (La Trama, Club del Chiste, Lumbre) queda con entre 2 y 4 reseñas y los tres con puntajes promedio distintos, para poder probar el orden por Puntaje. Esta feature solo lee calificaciones; crearlas es responsabilidad de la feature de calificaciones.
- **Textos no definidos en el diseño**: "Este evento no está disponible." y **Volver a Explorar** quedaron confirmados en Clarifications. "Todavía no tiene reseñas." también (organizador sin calificaciones).
- **Favoritos en memoria**: como el resto de los datos, los favoritos viven en memoria del servicio y se pierden al reiniciarlo. El seed arranca a Sofía sin favoritos, para poder ver el estado vacío.
- La fila Favoritos del Menú de perfil llegará con la feature del Menú de perfil; en esta feature se accede a Favoritos desde la BottomNav.
- **Botón Ver más**: el diseño no lo incluye; se usa un botón existente del design system (secundario), sin componentes nuevos. Según el Principio I de la constitución, antes de implementarlo se agrega a `pantallas.md` (Compradores 04).
- La búsqueda ignora tildes además de mayúsculas, por ser lo esperable en español (el diseño solo menciona mayúsculas).
- **Escalabilidad** (Clarifications): aunque el TP tiene pocos datos, Explorar (de a 10, con carga automática) y las reseñas del Detalle (de a 5, con **Ver más**) se cargan por partes para que funcionen igual con muchos eventos y reseñas. La pantalla Favoritos no se pagina: son los eventos que guardó un solo comprador, un volumen chico por definición.
- "Desde $ X" toma el menor precio entre todos los tipos de entrada, incluidos los agotados, como en el prototipo.
- Las imágenes de los eventos son las que guardó la feature 002 (incluidas las del seed); un evento sin imagen muestra un espacio neutro.
- Depende de la feature 001 (ingreso y sesión de compradores) y de la 002 (eventos, estados, imágenes y la regla de Finalizado por fecha).
- La app de compradores está pensada para mobile (390 × 844), pero se puede usar en web sin scroll horizontal.
