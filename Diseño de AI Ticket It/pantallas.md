# Pantallas — AI Ticket It

> Fuente: artifact "Diseño de sistema de dos apps" (https://claude.ai/code/artifact/576d1277-b8fb-4acd-82b9-384674ba49d4), versión del 2026-11-18. Las pantallas son prototipos navegables; las reglas de negocio de abajo salen de su lógica.
> Componentes, tokens y formatos de texto: ver [design-system.md](design-system.md).

---

## Reglas de negocio (derivadas del prototipo)

### Eventos
- **Categorías:** Teatro, Comedia, Drama, Amor.
- **Estados de evento:** Publicado, Borrador, Finalizado.
- Un evento tiene: nombre, descripción, categoría, fecha y hora, ubicación (sala/dirección), imagen (16:9, JPG o PNG, 1600×900), material multimedia (fotos/videos) y uno o más **tipos de entrada** (nombre, cupo, precio).
- **Validaciones al publicar:** nombre obligatorio ("Poné un nombre al evento"); fecha y hora obligatoria ("Elegí fecha y hora") y futura ("La fecha tiene que ser futura"); ubicación obligatoria ("Indicá dónde se hace el evento"); al menos un tipo de entrada ("Agregá al menos un tipo de entrada").
- **Validaciones de tipo de entrada:** nombre obligatorio y único dentro del evento (sin distinguir mayúsculas); cupo entero ≥ 1; precio ≥ 0 (0 = gratuita).
- **Guardar borrador** no exige validaciones; **Publicar** sí.
- Los eventos pasados (Finalizados) no aparecen en Explorar.

### Organizador y opiniones
- Cada evento pertenece a un organizador (compañía/productora, p. ej. "Compañía La Trama").
- El **puntaje del organizador** es el promedio de las calificaciones de todas sus compras calificadas, mostrado con un decimal ("4.5"). Se muestra en las tarjetas de evento y en el detalle con "N reseñas de eventos anteriores".

### Compra
- Una compra es de **un solo tipo de entrada** de un evento, con cantidad ≥ 1.
- **Cantidad máxima** por compra: `min(lugares disponibles del tipo, 10)`. Sin cupo: "Sin cupo". Un tipo con 0 disponibles se muestra "Agotada" y deshabilitado. Si todos los tipos están agotados, el botón del detalle dice "Agotado" y está deshabilitado.
- Disponibles de un tipo = cupo − vendidas. Al comprar se descuentan los lugares.
- **Total** = precio del tipo × cantidad.
- **Medios de pago:** Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia. **El pago es simulado**: "Pago simulado: no se realiza ningún cobro."
- **Número de compra** con formato `A-NNNN` (p. ej. `#A-1042`).
- **Estados de compra:** Pendiente de pago, Confirmada, Utilizada, Cancelada, Reembolsada.
  - Pendiente → Confirmada: el comprador completa el pago ("Completar pago").
  - Confirmada → Utilizada: el organizador marca la entrada como utilizada ("Marcar utilizada", solo sobre compras Confirmadas).
  - Cancelar: solo si la compra está **Pendiente o Confirmada** y el evento **todavía no ocurrió**. Una Confirmada cancelada pasa a **Reembolsada** ("Se reintegrarán $ X a tu {medio de pago}. Esta acción no se puede deshacer."); una Pendiente cancelada pasa a **Cancelada** ("La compra se cancelará y se liberarán las entradas reservadas.").
  - Mensajes cuando no se puede cancelar: "No se puede cancelar: la entrada ya fue utilizada." / "No se puede cancelar: el evento ya se realizó." / "Compra cancelada. El reembolso ya fue acreditado." / "Compra cancelada."
- **Cuenta regresiva** (solo compras Confirmadas): días hasta el evento redondeando hacia arriba; "Falta 1 día" / "Faltan N días".
- **Recaudado** (organizador) = Σ vendidas × precio por tipo. "Compras activas" = compras que no están Canceladas ni Reembolsadas.

### Calificaciones
- Solo compras **Utilizadas**, **una vez por compra**. Puntaje 1–5 obligatorio + comentario opcional (máx. 500 caracteres). Sin comentario se muestra "Sin comentario."
- La calificación es **sobre el organizador** y se publica en los eventos de ese organizador con autor (nombre + inicial del apellido, p. ej. "Sofía G."), estrellas, evento y comentario.
- Palabras del puntaje: 1 Malo, 2 Regular, 3 Bueno, 4 Muy bueno, 5 Excelente (sin elegir: "Elegí de 1 a 5 estrellas").

### Consultas (chat)
- **Un chat por compra**, entre el comprador y el organizador del evento.
- Un mensaje tiene texto, hora y autor. No se envían mensajes vacíos. Enter envía.
- El organizador ve las conversaciones agrupadas por evento; una conversación está **no leída** si el último mensaje es del comprador y el organizador todavía no la abrió. El botón "Consultas del evento ({cant})" muestra la cantidad de no leídas.

### Favoritos
- El comprador puede marcar/desmarcar eventos como favoritos (corazón) desde Explorar, Detalle y Favoritos.

---

## App Compradores (mobile, 390 × 844)

Navegación: Ingreso → Explorar (raíz, con BottomNav Explorar/Favoritos). El avatar de Explorar abre el Menú de perfil (BottomSheet) con Mis compras, Favoritos, Datos personales y Cerrar sesión.

### 01 · Ingreso
- BrandMark + "AI Ticket It", línea "Ingresá para descubrir eventos y comprar entradas."
- Campos **Email** (placeholder `nombre@correo.com`) y **Contraseña**.
- Botón primario **Ingresar**; separador "o"; secundarios **Ingresar con Google** e **Ingresar con Apple**.
- Link "¿No tenés cuenta? **Registrate**" (la pantalla de registro no está diseñada).
- Errores de campo: "Ingresá tu email", "Ingresá un email válido", "Ingresá tu contraseña". Con algún error, **Ingresar** queda deshabilitado con la nota "Revisá los campos marcados para ingresar."
- Credenciales incorrectas (email inexistente, contraseña incorrecta o cuenta de organizador): "El email o la contraseña no son correctos."
- Sin conexión: "No pudimos conectarnos. Probá de nuevo en un rato."
- "o", **Ingresar con Google**, **Ingresar con Apple** y **Registrate** se ven deshabilitados hasta que existan sus flujos.

### 02 · Explorar
- Encabezado: Avatar con iniciales (botón → Menú de perfil), "Hola, {nombre}" y "¿Qué querés ver?".
- **Búsqueda** "Buscar evento, sala u organizador": filtra por título, sala/ubicación y nombre del organizador (sin distinguir mayúsculas).
- **Chips de categoría:** Todos, Teatro, Comedia, Drama, Amor.
- **Ordenar** (SegmentedControl): Fecha (más próxima primero, por defecto), Precio (menor precio "desde" primero), Puntaje (mejor puntaje del organizador primero).
- **Recordatorio de calificación** (si hay una compra utilizada sin calificar): "Tu entrada fue utilizada — ¿Cómo fue tu experiencia en {evento}?", 5 estrellas, comentario "Contanos qué te pareció (opcional)", botón **Calificar** (deshabilitado sin estrellas). Al enviar: "Gracias, tu reseña ya es visible en los eventos del organizador."
- Contador de resultados ("N eventos" / "1 evento").
- Lista de **EventCard**: imagen, categoría, corazón de favorito, título, fecha corta, sala, "Desde $ X", puntaje · organizador, botón **Comprar** (va directo a Elegir entradas). Tocar la tarjeta abre el Detalle.
- Vacío: "No encontramos eventos — Probá con otra búsqueda o categoría."
- BottomNav: **Explorar** (activa) / **Favoritos**.

### 03 · Menú de perfil (BottomSheet)
- Avatar grande, nombre ("Sofía Gómez"), "Mi perfil".
- Filas: **Mis compras**, **Favoritos**, **Datos personales**, y al final **Cerrar sesión** (ghost). (Datos personales no tiene pantalla diseñada.)

### 04 · Detalle del evento
- AppBar: Volver, título del evento, acción de favorito.
- Imagen, Tag de categoría.
- Facts: fecha larga ("Sábado 21 de noviembre"), hora ("21:00 h"), sala, rango de precios ("$ 12.000 a $ 26.000", o un precio si hay un solo tipo).
- Descripción.
- **Opiniones sobre el organizador:** puntaje promedio, nombre del organizador, "N reseñas de eventos anteriores", lista de reseñas (autor, ★★★★☆, evento, texto).
- ActionFooter: "Desde $ X" + **Comprar** (o **Agotado** deshabilitado si no queda ningún tipo con lugares).

### 05 · Elegir entradas (tipo de entrada y cantidad)
- AppBar: "Elegí tus entradas", subtítulo "{evento} · {fecha corta}".
- **Tipo de entrada** (RadioCard): nombre, "Quedan N" o "Agotada" (deshabilitada), precio. Preselecciona el primer tipo con lugares.
- **Cantidad** (QuantityStepper) con ayuda "Máximo N" / "Sin cupo". Al cambiar de tipo, la cantidad se ajusta al nuevo máximo.
- ActionFooter: "Total $ X" + **Continuar al pago**.

### 06 · Pago (simulado)
- AppBar: "Pago".
- Tarjeta **Resumen**: evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}", total.
- **Medio de pago** (RadioCard): Tarjeta de crédito, Tarjeta de débito, Mercado Pago, Transferencia.
- Nota: "Pago simulado: no se realiza ningún cobro."
- Botón **Pagar $ X**. Al pagar se crea la compra en estado **Confirmada**, se descuentan los lugares y se va a Compra confirmada.

### 07 · Compra confirmada
- Marca de éxito, título "¡Compra confirmada!", "{evento} · {tipo} × {cantidad}", "Compra #A-NNNN", "Faltan N días para el evento.", "Vas a encontrar tus entradas en Mis compras."
- Botones **Ver mi compra** (→ Detalle de compra) y **Volver a explorar**.

### 08 · Mis compras
- AppBar: "Mis compras".
- Lista de PurchaseCard: evento, fecha corta, "{tipo} × {cantidad}", Tag de estado, cuenta regresiva si está Confirmada, imagen (40% si Cancelada/Reembolsada).
- Si está Utilizada: "Calificá tu experiencia" (→ Calificar experiencia) o, ya calificada, "Calificaste ★★★★☆".
- Tocar una compra abre el Detalle de compra.

### 09 · Detalle de compra
- AppBar: Volver, nombre del evento.
- Imagen, Tag de estado (grande) + cuenta regresiva.
- DetailList: **Fecha, Lugar, Entradas, Total, Pago, Compra #id**.
- Si está Utilizada y sin calificar: tarjeta "Tu entrada fue utilizada — Contales a otros compradores cómo fue tu experiencia con {organizador}." + **Calificar experiencia**.
- Si ya está calificada: tarjeta "Tu calificación" con estrellas, comentario y "Visible en los eventos de {organizador}".
- Si está Pendiente de pago: **Completar pago** (pasa a Confirmada).
- Nota de por qué no se puede cancelar (si aplica).
- Acciones: **Tengo una consulta** (secundario → Chat de la compra) y **Cancelar compra** (ghost, solo si se puede cancelar).
- Dialog "¿Cancelar la compra?" con el texto de reintegro o liberación de entradas; botones **Volver** y **Cancelar compra**.

### 10 · Chat de la compra
- AppBar con línea inferior: evento + "{organizador} · Compra #id".
- Mensajes: propios a la derecha, del organizador a la izquierda, con hora.
- Compositor: "Escribí tu consulta" + botón enviar.

### 11 · Favoritos
- Título "Favoritos". Lista de eventos favoritos (título, fecha corta, "Desde $ X", corazón para quitar).
- Vacío: "Todavía no guardaste eventos — Tocá el corazón en un evento para encontrarlo acá."
- BottomNav: Explorar / **Favoritos** (activa).

### 12 · Calificar experiencia
- AppBar: "Calificar experiencia", subtítulo "{evento} · {fecha corta}".
- "Compra #id · {tipo} × {cantidad}".
- Título "¿Cómo fue tu experiencia?" + "Tu puntaje y tu comentario se publican en los eventos de {organizador}, para que otros compradores sepan qué esperar."
- **Puntaje**: 5 estrellas grandes + palabra (Malo … Excelente).
- **Comentario (opcional)**: placeholder "Qué te gustó, qué mejorarías, cómo fue el ingreso…", contador "N/500".
- Botón **Enviar calificación** (deshabilitado sin estrellas o si ya fue calificada). Al enviar vuelve al Detalle de compra.

---

## App Organizadores (desktop, 1280 × 800)

Navegación: Ingreso → Mis eventos. DesktopNav en todas las pantallas internas (marca, link "Mis eventos", nombre de la compañía + avatar con iniciales).

### 01 · Ingreso
- Tarjeta con BrandMark compacto, "AI Ticket It", "Panel de organizadores".
- Campos **Email** y **Contraseña**, botón **Ingresar**. Sin Google/Apple ni registro.
- Mismos errores y mensajes que Compradores 01 · Ingreso. Enter envía. En pantallas chicas la tarjeta se adapta al ancho.

### 02 · Mis eventos
- Título "Mis eventos" + contador "N eventos" + botón primario **Crear evento**.
- Grilla de 4 columnas de EventManageCard: imagen, título, fecha corta, Tag de estado (Publicado/Borrador/Finalizado), barra de progreso y "N de M entradas vendidas".
- Tile final punteado **Nuevo evento** (→ Crear evento). Tocar una tarjeta abre el Detalle del evento.

### 03 · Crear evento (con vista previa)
Dos columnas: formulario + vista previa de 400px.

**Formulario:**
- Volver; título "Crear evento".
- **Imagen del evento** (dropzone): "Arrastrá un archivo o hacé clic. JPG o PNG, 1600×900."
- **Nombre del evento** (con error).
- **Descripción** (textarea).
- **Categoría** (select): Teatro, Comedia, Drama, Amor.
- **Fecha y hora de realización** (datetime, con error).
- **Ubicación** (con error).
- **Material multimedia:** lista de archivos cargados como tags (p. ej. `trailer.mp4`, `ensayo-01.jpg`) + **Agregar foto o video**.
- **Tipos de entrada** (TicketTypeEditor): tarjetas "Entrada N" con Nombre (placeholder "Ej.: Platea"), Cupo, Precio ($), botón quitar; tile **Agregar tipo de entrada**; error general arriba.
- Acciones: **Publicar evento** (primario, deshabilitado mientras haya errores, con la nota "Revisá el campo marcado / los campos marcados para publicar." o "Agregá al menos un tipo de entrada para publicar.") y **Guardar borrador** (siempre habilitado).
- Al publicar: el evento queda **Publicado** con 0 vendidas y se navega a su Detalle.

**Vista previa:** "Vista previa · así lo verá el comprador": categoría, nombre ("Nombre del evento" si vacío), fecha ("Fecha a definir"), ubicación ("Ubicación"), descripción ("Descripción del evento"), lista "{tipo} · {cupo} lugares — $ precio" ("Sin nombre" si vacío), botón Comprar inerte, "Capacidad total: N lugares".

> El wireframe original menciona "tipo de material multimedia (p. ej. Pantalla)"; en el diseño final quedó como carga de fotos/videos.
> "Editar evento" reutiliza este mismo formulario (no tiene pantalla propia).

### 04 · Detalle del evento (disponibilidad y ventas)
- Volver; título del evento, "{fecha corta} · {sala}", Tag de estado.
- Acciones: **Editar evento** y **Consultas del evento {cant no leídas}**.
- **Disponibilidad por tipo de entrada:** por tipo, nombre + precio, barra grande, "Quedan N" / "Agotada" y "{vendidas} / {cupo} vendidas".
- StatCard **Recaudado**: "$ X" + "N entradas vendidas · M compras activas".
- **Ventas:** chips de filtro con contador — Todas, Confirmadas, Pendientes, Utilizadas, Canceladas, Reembolsadas.
- DataTable con columnas **Número, Comprador, Entradas, Estado, Medio de pago, Monto, Acciones**. Acciones: **Marcar utilizada** (solo Confirmadas) y botón de chat (→ Consultas en esa conversación).
- Vacío: "No hay ventas con este estado."

### 05 · Consultas del evento
- Volver; "Consultas del evento" + nombre del evento.
- **Columna izquierda (380px):** lista de conversaciones (solo compras con mensajes): avatar con iniciales del comprador, nombre, hora del último mensaje, "Compra #id · {tipo} × {cantidad}", último mensaje, punto de no leído.
- **Panel de chat:** cabecera con comprador, "Compra #id · {tipo} × {cantidad} · $ total" y Tag de estado; mensajes (propios del organizador a la derecha); compositor "Responder a {comprador}" + **Enviar**. Abrir una conversación la marca como leída.

---

## Datos de ejemplo del prototipo

Útiles como seed para desarrollo y tests (fecha de referencia "hoy" = 2026-11-09).

**Organizadores:** Compañía La Trama (`produccion@latrama.com.ar`), Club del Chiste, Producciones Lumbre.
**Comprador:** Sofía Gómez (`sofia.gomez@correo.com`).

| Evento | Cat. | Fecha | Sala | Organizador | Tipos (precio / cupo / vendidas) |
|---|---|---|---|---|---|
| Hamlet en el Galpón | Teatro | 2026-11-21 21:00 | Galpón de Guevara, Chacarita | La Trama | General $12.000 / 150 / 66 · Platea $18.000 / 80 / 68 · VIP $26.000 / 20 / 20 |
| Risas a Domicilio | Comedia | 2026-11-14 22:30 | Paseo La Plaza, Sala Neruda | Club del Chiste | General $9.000 · Mesa preferencial $14.000 |
| Bodas de sangre | Drama | 2026-12-05 20:00 | Teatro San Martín, Sala Casacuberta | La Trama | General $15.000 / 200 / 80 · Platea $21.000 / 60 / 30 |
| Cartas a Julieta | Amor | 2026-11-28 20:30 | Centro Cultural Konex | Lumbre | General $11.000 · Pareja $19.000 |
| Impro Express | Comedia | 2026-12-12 21:30 | La Tangente, Palermo | Club del Chiste | General $8.000 |
| Tango en el Conventillo | Teatro | 2026-10-18 21:00 (pasado) | Conventillo de la Paloma | Lumbre | General $10.000 |
| Edipo Rey | Drama | 2026-09-12 21:00 (Finalizado) | Galpón de Guevara, Chacarita | La Trama | General $10.000 / 150 / 142 |
| La gaviota | — | 2027-03-06 20:30 (Borrador) | A confirmar | La Trama | General $14.000 / 120 / 0 |

**Compras de Sofía:** A-1042 Hamlet Platea × 2 $36.000 Confirmada (crédito) · A-1037 Risas General × 1 $9.000 Pendiente (Mercado Pago) · A-0871 Tango General × 2 $20.000 Utilizada sin calificar (débito) · A-0790 Cartas Pareja × 1 $19.000 Reembolsada (crédito) · A-0655 Edipo General × 1 $10.000 Utilizada, calificada 4★.

---

## Fuera del diseño (a definir en las specs)

- Pantalla de **registro** de compradores (hay link "Registrate").
- Pantalla **Datos personales** del comprador.
- Registro/alta de organizadores.
- Login con Google y Apple (botones diseñados, flujo no).
- Pantalla propia de **Editar evento** (se asume el formulario de Crear evento).
- Cuándo un evento pasa a **Finalizado** (se asume automático al pasar la fecha).
- Cómo se confirma una compra **Pendiente** pagada por transferencia (en el prototipo, "Completar pago" del comprador).
