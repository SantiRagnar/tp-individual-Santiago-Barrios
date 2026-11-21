# Feature Specification: Mis eventos, crear y editar evento (organizadores)

**Feature Branch**: `Feature/002-eventos-organizador`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Crear editar evento y mis eventos como organizadores"

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Organizadores 02 · Mis eventos** (desktop, 1280 × 800)
- **Organizadores 03 · Crear evento (con vista previa)** (desktop, 1280 × 800), reutilizada como **Editar evento**
- DesktopNav (barra superior de todas las pantallas internas de organizadores)
- Organizadores 04 · Detalle del evento, **solo en versión mínima** (cabecera y **Editar evento**, FR-021)

**Fuera de esta feature**: el resto de Organizadores 04 (disponibilidad por tipo, Recaudado, Ventas y Marcar utilizada) y 05 · Consultas del evento.

## Clarifications

### Session 2026-11-20

- Q: ¿Qué puede cambiar el organizador al editar un evento Publicado que ya vendió entradas? → A: Se edita todo, pero un tipo de entrada con ventas no se puede quitar y su cupo no puede quedar por debajo de sus vendidas; su precio sí se puede cambiar y vale solo para compras nuevas (las compras hechas conservan su monto). Un evento Publicado no vuelve a Borrador (FR-020).
- Q: ¿La imagen del evento y el material multimedia se suben y se guardan como archivos reales, o alcanza con registrar sus nombres? → A: La imagen del evento se sube de verdad (JPG o PNG), se guarda en memoria y se ve en las tarjetas y la vista previa; del material multimedia solo se registra el nombre del archivo y se muestra como tag (FR-009).
- Q: ¿Adónde lleva tocar una tarjeta de Mis eventos (y terminar de publicar), si el Detalle del evento con ventas es otra feature? → A: Esta feature construye una versión mínima de Organizadores 04 (Volver, título, fecha · sala, Tag de estado, **Editar evento** y **Consultas del evento** deshabilitado); ventas y disponibilidad llegan con su feature (FR-021, FR-025).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El organizador ve sus eventos (Priority: P1)

Un integrante de Compañía La Trama ingresa al panel y llega a Mis eventos. Ve el título "Mis eventos", el contador "4 eventos" y una grilla con una tarjeta por cada evento de su compañía: imagen, título, fecha corta, Tag de estado (Publicado, Borrador o Finalizado), una barra de progreso y "N de M entradas vendidas". La grilla termina con el tile punteado **Nuevo evento**.

**Why this priority**: es la pantalla inicial del panel después del Ingreso y el punto de partida para crear, editar y revisar eventos. Sin ella el organizador no tiene vista de lo que publicó.

**Independent Test**: ingresar con `produccion@latrama.com.ar` y verificar que se ven exactamente los 4 eventos de La Trama del seed (Hamlet en el Galpón, Bodas de sangre, Edipo Rey, La gaviota) con su estado y sus vendidas, y ninguno de otro organizador.

**Acceptance Scenarios**:

1. **Given** un organizador con sesión iniciada, **When** abre Mis eventos, **Then** ve solo los eventos de su compañía, cada uno con imagen, título, fecha corta ("Sáb 21 nov · 21:00"), Tag de estado, barra de progreso y "N de M entradas vendidas".
2. **Given** el evento Hamlet en el Galpón del seed (vendidas 66 + 68 + 20 sobre cupos 150 + 80 + 20), **When** se ve su tarjeta, **Then** dice "154 de 250 entradas vendidas" y la barra refleja esa proporción.
3. **Given** un organizador con 4 eventos, **Then** el contador dice "4 eventos"; con uno solo dice "1 evento"; sin eventos dice "0 eventos" y solo se ve el tile **Nuevo evento**.
4. **Given** Mis eventos, **When** el organizador hace clic en **Crear evento** o en el tile **Nuevo evento**, **Then** se abre Crear evento con el formulario vacío.
5. **Given** un evento publicado cuya fecha ya pasó, **Then** su tarjeta muestra el Tag **Finalizado**.

---

### User Story 2 - El organizador crea y publica un evento (Priority: P1)

Desde Crear evento, el organizador carga la imagen, el nombre, la descripción, la categoría, la fecha y hora, la ubicación, el material multimedia y uno o más tipos de entrada (nombre, cupo, precio). Mientras escribe, la vista previa de la derecha muestra cómo lo verá el comprador. Hace clic en **Publicar evento**: el evento queda Publicado con 0 entradas vendidas.

**Why this priority**: es el caso de uso del enunciado "crear un Evento ofreciendo distintos tipos de entrada, cada uno con su precio y cupo". Sin eventos publicados, los compradores no tienen nada para comprar.

**Independent Test**: crear un evento con dos tipos de entrada y fecha futura, publicarlo y verificar que aparece en Mis eventos como Publicado con "0 de N entradas vendidas", donde N es la suma de los cupos.

**Acceptance Scenarios**:

1. **Given** Crear evento con nombre, fecha futura, ubicación y al menos un tipo de entrada válido, **When** el organizador hace clic en **Publicar evento**, **Then** el evento queda **Publicado** con 0 vendidas, pertenece a su compañía y se lo lleva al Detalle del evento (FR-021).
2. **Given** el formulario sin nombre, **Then** debajo del campo se ve "Poné un nombre al evento" una vez tocado el campo o después de tocar **Publicar evento**, y **Publicar evento** se ve deshabilitado con la nota "Revisá el campo marcado para publicar.".
3. **Given** dos o más campos con error, **Then** la nota dice "Revisá los campos marcados para publicar.".
4. **Given** el formulario sin ningún tipo de entrada, **Then** arriba de la grilla de entradas se ve "Agregá al menos un tipo de entrada" y la nota dice "Agregá al menos un tipo de entrada para publicar.".
5. **Given** una fecha y hora en el pasado, **Then** se ve "La fecha tiene que ser futura" y no se puede publicar; sin fecha, "Elegí fecha y hora".
6. **Given** sin ubicación, **Then** se ve "Indicá dónde se hace el evento".
7. **Given** dos tipos de entrada llamados "Platea" y "platea", **Then** el segundo muestra "Ya hay una entrada con este nombre".
8. **Given** un tipo de entrada con cupo 0 o decimal, **Then** muestra "El cupo tiene que ser 1 o más"; vacío, "Indicá el cupo". Con precio negativo, "El precio no puede ser negativo"; vacío, "Indicá el precio". Precio 0 es válido (entrada gratuita).
9. **Given** un formulario en cualquier estado, **When** el organizador cambia un campo, **Then** la vista previa se actualiza al instante; los campos vacíos se ven con su nombre genérico ("Nombre del evento", "Fecha a definir", "Ubicación", "Descripción del evento", "Sin nombre" para un tipo sin nombre) y abajo dice "Capacidad total: N lugares" con la suma de los cupos.

---

### User Story 3 - El organizador guarda un borrador (Priority: P2)

El organizador todavía no tiene todos los datos (p. ej. la sala). Carga lo que tiene y hace clic en **Guardar borrador**. El evento aparece en Mis eventos con el Tag **Borrador** y no es visible para los compradores. Más tarde lo abre, lo completa y lo publica.

**Why this priority**: permite armar un evento en varias sesiones sin publicarlo a medias. Depende de la historia 2 (mismo formulario).

**Independent Test**: guardar un borrador solo con nombre y verificar que aparece en Mis eventos como Borrador con "Fecha a definir"; completarlo y publicarlo desde la API (`PUT`). Publicarlo desde el front necesita **Editar evento** (historia 4).

**Acceptance Scenarios**:

1. **Given** Crear evento con cualquier combinación de campos (incluso con errores o vacíos), **When** el organizador hace clic en **Guardar borrador**, **Then** el evento se guarda como **Borrador** y aparece en Mis eventos. **Guardar borrador** está siempre habilitado.
2. **Given** un borrador, **Then** no aparece en ninguna pantalla de compradores.
3. **Given** un borrador sin nombre o sin fecha, **Then** su tarjeta en Mis eventos muestra "Nombre del evento" / "Fecha a definir" en lugar de quedar en blanco.
4. **Given** un borrador abierto en Editar evento y completado correctamente, **When** hace clic en **Publicar evento**, **Then** pasa a **Publicado** con las mismas validaciones que al crear.

---

### User Story 4 - El organizador edita un evento (Priority: P2)

El organizador toca uno de sus eventos en Mis eventos, llega al Detalle del evento (versión mínima) y hace clic en **Editar evento**. Se abre el mismo formulario de Crear evento, con el título "Editar evento" y los datos actuales cargados. Cambia la descripción y agrega un tipo de entrada; la vista previa refleja los cambios y al guardar se actualiza el evento.

**Why this priority**: los datos de un evento cambian (horario, sala, nuevos tipos de entrada). El wireframe incluye **Editar evento** en el panel del evento. Depende de que exista el formulario (historia 2).

**Independent Test**: editar la descripción y agregar un tipo de entrada a Bodas de sangre (Publicado, con ventas) y verificar que los cambios se ven en Mis eventos y que las vendidas de los tipos existentes se mantienen.

**Acceptance Scenarios**:

1. **Given** un evento propio Publicado o Borrador, **When** el organizador elige **Editar evento**, **Then** ve el formulario con título "Editar evento", todos los datos actuales cargados y la vista previa armada.
2. **Given** cambios válidos en un evento Publicado, **When** guarda, **Then** el evento sigue Publicado con los datos nuevos y las vendidas de cada tipo de entrada no cambian.
3. **Given** un evento Publicado editado, **Then** se aplican las mismas validaciones que al publicar; con errores, no se puede guardar.
4. **Given** un tipo de entrada con ventas (p. ej. Platea de Bodas de sangre, 30 vendidas), **Then** su botón quitar está deshabilitado con la ayuda "Tiene ventas: no se puede quitar"; si se le pone un cupo menor a 30, se ve "El cupo no puede ser menor a las vendidas (30)" y no se puede guardar; si se le cambia el precio, el cambio se guarda y las compras ya hechas conservan su monto.
5. **Given** un evento **Finalizado**, **Then** no se puede editar (no se ofrece **Editar evento**).
6. **Given** un evento de otro organizador, **When** se intenta editarlo, **Then** se rechaza y no cambia nada.
7. **Given** un evento Publicado en edición, **Then** no se ofrece **Guardar borrador**: el evento no puede volver a Borrador.

---

### Edge Cases

- Doble clic en **Publicar evento** o **Guardar borrador**: se crea un solo evento; mientras se guarda, los dos botones quedan deshabilitados.
- Volver con cambios sin guardar: desde Crear evento se vuelve a Mis eventos y desde Editar evento al Detalle; en los dos casos los cambios se pierden (ver Assumptions).
- Quitar todos los tipos de entrada: aparece "Agregá al menos un tipo de entrada" y no se puede publicar, pero sí guardar borrador.
- Una entrada nueva arranca vacía; quitar la "Entrada 2" renumera las siguientes ("Entrada 3" pasa a ser "Entrada 2").
- Imagen con formato distinto de JPG o PNG: se rechaza con "La imagen tiene que ser JPG o PNG" y la imagen anterior se conserva. Imagen de más de 5 MB: "La imagen no puede pesar más de 5 MB".
- Evento sin imagen: la tarjeta y la vista previa muestran un espacio de imagen neutro, no una imagen rota.
- Nombre de tipo de entrada con espacios alrededor o distinto solo en mayúsculas: para la regla de unicidad, " VIP " y "vip" son el mismo nombre.
- Fecha que pasa mientras el formulario está abierto: al publicar se valida de nuevo y aparece "La fecha tiene que ser futura".
- Un borrador con fecha pasada sigue siendo Borrador (no pasa a Finalizado); para publicarlo hay que poner una fecha futura.
- Sin conexión o error del servicio al guardar: el formulario conserva todo lo escrito y se ve "No pudimos conectarnos. Probá de nuevo en un rato.".
- Sesión vencida al guardar: se lleva al Ingreso de organizadores (FR-015 de la feature 001).
- Panel abierto en una pantalla chica: la grilla de Mis eventos pasa a menos columnas y la vista previa de Crear evento queda debajo del formulario, sin scroll horizontal.

## Requirements *(mandatory)*

### Functional Requirements

**DesktopNav**

- **FR-001**: Toda pantalla interna de organizadores MUST mostrar la DesktopNav: marca, link "Mis eventos" y el nombre de la compañía con su avatar de iniciales.

**Mis eventos (Organizadores 02)**

- **FR-002**: Mis eventos MUST mostrar el título "Mis eventos", el contador de eventos ("N eventos" / "1 evento") y el botón primario **Crear evento**.
- **FR-003**: MUST listar todos los eventos del organizador con sesión iniciada, en cualquier estado, y ningún evento de otro organizador.
- **FR-004**: Cada evento MUST verse como EventManageCard: imagen, título, fecha corta, Tag de estado (Publicado `tag-accent`, Borrador `tag-outline`, Finalizado `tag-neutral`), barra de progreso fina y "N de M entradas vendidas", donde N es la suma de vendidas y M la suma de cupos de sus tipos de entrada.
- **FR-005**: La grilla MUST tener 4 columnas en desktop y terminar con el tile punteado **Nuevo evento**, que equivale a **Crear evento**.
- **FR-006**: Los eventos MUST ordenarse por fecha, el más próximo primero; los que no tienen fecha van después de los que la tienen y los Finalizados al final.
- **FR-007**: Un evento Publicado cuya fecha y hora ya pasaron MUST mostrarse como **Finalizado**, sin intervención del organizador.

**Crear / Editar evento (Organizadores 03)**

- **FR-008**: El formulario MUST tener, en este orden: Volver, título ("Crear evento" o "Editar evento"), **Imagen del evento** (zona para arrastrar o elegir un archivo, "Arrastrá un archivo o hacé clic. JPG o PNG, 1600×900."), **Nombre del evento**, **Descripción**, **Categoría** (Teatro, Comedia, Drama, Amor), **Fecha y hora de realización**, **Ubicación**, **Material multimedia** (archivos cargados como tags + **Agregar foto o video**), **Tipos de entrada** y las acciones **Publicar evento** y **Guardar borrador**.
- **FR-009**: La imagen del evento MUST subirse como archivo real (solo JPG o PNG, hasta 5 MB), guardarse junto con el evento y verse en la vista previa y en la tarjeta de Mis eventos; queda disponible para que el lado compradores la muestre en su propia feature (ver Assumptions). La medida 1600×900 es la recomendada, no se exige. El material multimedia (fotos y videos) MUST registrarse solo por el nombre del archivo, mostrarse como tag con ícono de foto o video y poder quitarse; el contenido de esos archivos no se guarda ni se reproduce.
- **FR-010**: El editor de tipos de entrada MUST mostrar una tarjeta por tipo ("Entrada N") con Nombre, Cupo y Precio ($) y un botón para quitarla, más un tile **Agregar tipo de entrada** que agrega una entrada vacía. No hay máximo de tipos.
- **FR-011**: Para publicar (o guardar un evento Publicado), el sistema MUST exigir: nombre ("Poné un nombre al evento"), fecha y hora ("Elegí fecha y hora") futura ("La fecha tiene que ser futura"), ubicación ("Indicá dónde se hace el evento") y al menos un tipo de entrada ("Agregá al menos un tipo de entrada").
- **FR-012**: Cada tipo de entrada MUST tener nombre ("Poné un nombre") único en el evento sin distinguir mayúsculas ni espacios alrededor ("Ya hay una entrada con este nombre"), cupo entero ≥ 1 ("Indicá el cupo" / "El cupo tiene que ser 1 o más") y precio ≥ 0 ("Indicá el precio" / "El precio no puede ser negativo"). Precio 0 = entrada gratuita.
- **FR-013**: Cada error MUST mostrarse debajo de su campo cuando ese campo ya fue tocado, con el estilo de error del design system (sin rojo). Mientras haya errores, **Publicar evento** MUST verse deshabilitado (45%) y no enviar nada; si igual se lo toca, MUST mostrar los errores de todos los campos a la vez. La nota bajo el botón MUST aparecer solo cuando hay al menos un error visible: "Revisá el campo marcado para publicar." (un error), "Revisá los campos marcados para publicar." (varios) o "Agregá al menos un tipo de entrada para publicar." (si solo falta eso).
- **FR-014**: En Crear evento y al editar un Borrador, **Guardar borrador** MUST estar siempre habilitado (salvo mientras se guarda) y guardar el evento como Borrador sin exigir validaciones.
- **FR-015**: Las mismas validaciones MUST aplicarse en el servicio, no solo en la pantalla: un intento de publicar un evento inválido se rechaza aunque llegue sin pasar por el formulario.
- **FR-016**: Al publicar, el evento MUST quedar **Publicado**, con 0 vendidas en cada tipo de entrada, asociado al organizador con sesión iniciada.

**Vista previa**

- **FR-017**: Crear/Editar evento MUST mostrar a la derecha (400 px en desktop) la vista previa "Vista previa · así lo verá el comprador", que se actualiza con cada cambio: categoría, imagen, nombre, fecha, ubicación, descripción, lista "{tipo} · {cupo} lugares — $ {precio}", botón **Comprar** que no responde y "Capacidad total: N lugares".
- **FR-018**: Los campos vacíos MUST verse en la vista previa con su nombre genérico ("Nombre del evento", "Fecha a definir", "Ubicación", "Descripción del evento", "Sin nombre"), nunca en blanco.

**Edición**

- **FR-019**: El organizador MUST poder editar sus eventos Publicados y Borradores con el mismo formulario, precargado. Los eventos Finalizados MUST NOT poder editarse.
- **FR-020**: Editar un evento MUST conservar las vendidas de sus tipos de entrada existentes. Un tipo de entrada con al menos una venta MUST NOT poder quitarse ("Tiene ventas: no se puede quitar") ni quedar con un cupo menor a sus vendidas ("El cupo no puede ser menor a las vendidas (N)"). Su nombre y su precio sí pueden cambiarse; un precio nuevo vale solo para compras nuevas y las compras existentes conservan su monto. Un evento Publicado MUST NOT volver a Borrador (en su edición no se ofrece **Guardar borrador**). Estas reglas MUST aplicarse también en el servicio.

**Navegación**

- **FR-021**: Esta feature MUST construir una versión mínima de Organizadores 04 · Detalle del evento: Volver (a Mis eventos), título del evento, "{fecha corta} · {sala}", Tag de estado y **Editar evento** (oculto si el evento está Finalizado). **Consultas del evento** MUST verse como en el diseño pero deshabilitado, y la disponibilidad por tipo, Recaudado y la tabla de Ventas quedan para su propia feature.
- **FR-025**: Navegación: tocar una tarjeta de Mis eventos MUST abrir su Detalle del evento; **Editar evento** abre el formulario y su Volver regresa al Detalle. Después de **Publicar evento** o de guardar cambios de un evento Publicado, MUST llevarse al Detalle de ese evento. Después de **Guardar borrador**, MUST volverse a Mis eventos.

**Permisos y datos**

- **FR-022**: Solo el organizador dueño de un evento MUST poder verlo en su panel, editarlo o publicarlo; cualquier intento sobre un evento ajeno se rechaza.
- **FR-023**: Solo los eventos Publicados (no Borradores ni Finalizados) MUST quedar disponibles para el lado compradores. En esta feature se cumple porque ningún endpoint de compradores expone eventos; la feature de Explorar MUST filtrar por el estado visible Publicado (ver Assumptions).
- **FR-024**: Al iniciar, el sistema MUST tener cargados los eventos de ejemplo de `pantallas.md` con sus tipos de entrada, cupos, vendidas, estados y organizadores.

### Key Entities

- **Evento**: pertenece a un organizador. Nombre, descripción, categoría (Teatro, Comedia, Drama, Amor), fecha y hora, ubicación, imagen, material multimedia, estado (Publicado, Borrador, Finalizado) y uno o más tipos de entrada. En Borrador cualquier dato puede faltar.
- **Tipo de entrada**: pertenece a un evento. Nombre (único en el evento), cupo (entero ≥ 1 y ≥ vendidas), precio (≥ 0) y vendidas. Disponibles = cupo − vendidas. Con ventas, no se puede quitar.
- **Compra** (definida en otras features): guarda su propio monto al momento de comprar, así un cambio de precio posterior no la afecta.
- **Imagen del evento**: archivo JPG o PNG (hasta 5 MB) guardado con el evento; un evento tiene a lo sumo una.
- **Material multimedia**: referencia a una foto o video asociado a un evento, guardada solo por su nombre de archivo y su tipo (foto o video).
- **Organizador**: definido en la feature 001; dueño de sus eventos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un organizador puede crear y publicar un evento con dos tipos de entrada en menos de 3 minutos.
- **SC-002**: El 100% de los intentos de publicar un evento que no cumple las validaciones (por pantalla o directo al servicio) se rechazan, con el mensaje del campo correspondiente.
- **SC-003**: La vista previa refleja cada cambio del formulario en menos de 1 segundo, sin acciones extra.
- **SC-004**: Cada organizador de ejemplo ve en Mis eventos exactamente sus eventos del seed (La Trama: 4, Club del Chiste: 2, Lumbre: 2), con estados y "N de M entradas vendidas" correctos.
- **SC-005**: El 100% de los intentos de ver o modificar un evento de otro organizador se rechazan.
- **SC-006**: Editar un evento con ventas nunca cambia la cantidad de entradas vendidas ni el monto de compras existentes, y el 100% de los intentos de quitar un tipo con ventas o bajar su cupo por debajo de lo vendido se rechazan.
- **SC-007**: Mis eventos y Crear/Editar evento coinciden con el diseño: textos, componentes y estados (vacío, error de campo, deshabilitado, guardando, borrador).

## Assumptions

- **Fuera de alcance**: de Organizadores 04 solo entra la versión mínima (FR-021); quedan afuera disponibilidad, Recaudado, Ventas y "Marcar utilizada". También quedan afuera Organizadores 05 · Consultas, eliminar eventos (no está en el diseño), duplicar eventos y despublicar un evento (volver de Publicado a Borrador).
- "Editar evento" usa el mismo formulario que Crear evento, como indica `pantallas.md`; en edición, el botón primario de un evento Publicado guarda los cambios con las mismas validaciones de publicar.
- El wireframe pedía "tipo de material multimedia (p. ej. Pantalla)"; se sigue el diseño final, que lo reemplazó por carga de fotos y videos.
- Los eventos del seed usan imágenes de ejemplo incluidas en el sistema. Las imágenes subidas viven en memoria y, como el resto de los datos, se pierden al reiniciar el servicio.
- El paso a Finalizado es automático al pasar la fecha y hora del evento (`pantallas.md`, "Fuera del diseño").
- No se avisa al volver con cambios sin guardar; queda como mejora futura.
- La descripción no tiene límite de caracteres en el diseño; se asume un máximo razonable de 2000 caracteres.
- Club del Chiste y Producciones Lumbre no tienen cupos ni vendidas en la tabla del seed para algunos eventos; se completan con valores de ejemplo coherentes.
- El panel está pensado para desktop, pero, igual que el Ingreso (feature 001), se adapta a pantallas chicas sin scroll horizontal.
- Depende de la feature 001 (ingreso de organizadores y sesión).
- El lado compradores todavía no lista eventos. Mostrar solo los Publicados (FR-023) y su imagen (FR-009) es responsabilidad de la feature de Explorar, que usará el estado visible y la URL de imagen que define esta feature.
