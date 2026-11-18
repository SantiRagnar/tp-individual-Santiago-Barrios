# Design system — AI Ticket It

> Fuente: artifact "Design system" (https://claude.ai/artifact/63Rfsdgum2tegdCWCMuh5z), versión del 2026-11-18.
> Este archivo es la referencia para specs e implementación. Si el design system cambia, actualizar este archivo.

AI Ticket It vende entradas para teatro y comedia en dos apps que comparten un mismo lenguaje: **Compradores** (mobile, 390 × 844) y **Organizadores** (escritorio, 1280 × 800). La interfaz es oscura, silenciosa y compacta: fondo azul grisáceo casi neutro, Inter en peso medio, radios suaves de 8px y un único acento violeta que aparece como línea y como brillo, nunca como relleno. "Es la sala con las luces bajas; el acento es el reflector."

## Reglas generales

- Todo color, medida, radio y sombra sale de los tokens. Nada de hex o px sueltos que ya existan como token.
- **Un solo tema, oscuro.** No hay variante clara.
- Íconos: **Phosphor** (`@phosphor-icons/web@2.1.1`; en React Native usar el paquete equivalente de Phosphor). Peso regular (línea) en todos lados; relleno (`-fill`) solo para marcar "activo": pestaña actual, favorito marcado, estrellas puestas, marca `ticket-fill`.
- Tamaños de ícono: 20px en botones de barra y menú, 22px en pestañas, 16–18px en línea con texto, 26–28px en estados vacíos y zonas de carga.
- Ícono de dato del evento (`calendar-blank`, `clock`, `map-pin`, `ticket`) en `color-accent`. Ícono de metadato en el color del texto que acompaña.

## Voz y contenido

- Español rioplatense con **voseo**, siempre: "Ingresá", "Elegí tus entradas", "¿Qué querés ver?", "Probá con otra búsqueda", "¿No tenés cuenta? Registrate".
- **Sentence case** en títulos y botones: "Continuar al pago", "Mis compras", "Crear evento". Mayúsculas sostenidas solo para `type-kicker` y `type-overline`.
- Botones con verbo y, si hay plata en juego, con el monto: "Pagar $ 36.000", "Comprar", "Marcar utilizada".
- **Plata:** `$ 18.000` (símbolo, espacio, punto de miles, sin decimales; `toLocaleString('es-AR')`).
- **Fechas cortas:** "Sáb 21 nov · 21:00". **Largas:** "Sábado 21 de noviembre", hora "21:00 h". Sin fecha: "Fecha a definir".
- **Número de compra:** "#A-1042". **Cantidades:** "Platea × 2".
- Decir qué pasa y qué hacer: "No se puede cancelar: la entrada ya fue utilizada.", "Se reintegrarán $ 36.000 a tu Tarjeta de crédito. Esta acción no se puede deshacer."
- Cuentas regresivas en positivo: "Faltan 3 días", "Falta 1 día".
- Sin emoji. Sin signos de exclamación salvo "¡Compra confirmada!".

## Color

Un solo tema (`dark`). Uso:

- `color-bg` fondo de toda pantalla; `color-surface` levanta tarjetas, inputs, hojas y diálogos. Nada es negro ni blanco puro.
- Texto: `color-text` principal, `color-text-label` labels de campos, `color-text-muted` metadatos y ayudas (los tres pasan AA sobre bg y surface).
- `color-accent` es la única voz de color: contorno del botón primario, chip y pestaña activos, kicker, íconos de datos del evento, estrellas, focus. Para texto en acento a tamaño de párrafo (cuenta regresiva, corazón de favorito) usar `color-accent-300`.
- Rampas 700–900 = rellenos tintados y bordes; 100–300 = texto sobre esos rellenos. `tag-accent` = `accent-800` + `accent-100`; avatar = `accent-900` + `accent-200`.
- **No hay verde ni rojo de estado.** Los estados se distinguen por variante de Tag + ícono + palabra.
- Profundidad con degradés suaves de la rampa (resplandor `accent-900` arriba a la izquierda y detrás de la pantalla de éxito), no con rellenos planos.

| Token | Valor | Uso |
|---|---|---|
| `color-bg` | `#161826` | Fondo de toda pantalla |
| `color-surface` | `#232532` | Tarjetas, bottom sheet, diálogo, inputs, burbuja de chat del otro |
| `color-text` | `#e9e9ed` | Texto principal |
| `color-text-label` | `#aeaeb5` | Labels de campos, encabezados de sección chicos |
| `color-text-muted` | `#909199` | Texto secundario y metadatos |
| `color-accent` | `#9184d9` | El acento (bordes/texto de primario, kicker, íconos de datos, estrellas, tab activa, focus). Nunca relleno grande |
| `color-divider` | `rgba(233,233,237,0.16)` | Bordes de inputs y botón secundario, líneas |
| `color-scrim` | `rgba(41,43,49,0.5)` | Fondo detrás de un diálogo |
| `color-scrim-strong` | `rgba(41,43,49,0.6)` | Fondo detrás del bottom sheet |
| `color-neutral-100` | `#f3f5fe` | Texto sobre neutral-800 (tag-neutral) |
| `color-neutral-200` | `#e4e7f5` | Reservado |
| `color-neutral-300` | `#cfd3e5` | Reservado |
| `color-neutral-400` | `#b2b6ca` | Pestaña inactiva; texto de tiles "Nuevo evento" |
| `color-neutral-500` | `#9397ab` | Íconos secundarios |
| `color-neutral-600` | `#75798c` | Bordes con más presencia (nunca texto chico) |
| `color-neutral-700` | `#595d6c` | Handle del bottom sheet; hover de inputs |
| `color-neutral-800` | `#3f424d` | Fondo de tag-neutral; avatar del comprador en consultas |
| `color-neutral-900` | `#292b31` | Riel de barras de progreso; inicio del placeholder de imagen |
| `color-accent-100` | `#f5f4ff` | Texto sobre accent-800 (tag-accent) |
| `color-accent-200` | `#e7e5fe` | Iniciales del avatar |
| `color-accent-300` | `#d2cefd` | Texto en acento a tamaño de párrafo (cuenta regresiva, favorito, error de campo) |
| `color-accent-400` | `#b5abfc` | Hover de links; borde de campo inválido |
| `color-accent-500` | `#968ae0` | Brillo del wordmark |
| `color-accent-600` | `#796cbf` | Brillo del ícono de éxito |
| `color-accent-700` | `#5d5294` | Inicio del degradé de la barra de disponibilidad |
| `color-accent-800` | `#423a6a` | Fondo de tag-accent y burbuja de chat propia |
| `color-accent-900` | `#2b2741` | Fondo del avatar; resplandor; fin del placeholder de imagen |

## Tipografía

Inter 400 y 500 (Google Fonts) para todo (`heading` y `body`: `"Inter", system-ui, sans-serif`). **Ningún título pasa de 500**: la jerarquía es tamaño y aire. Números que se comparan o alinean (montos, cantidades, números de compra) con `font-variant-numeric: tabular-nums` (`.num`).

| Estilo | Tamaño / interlínea / peso | Uso |
|---|---|---|
| `type-wordmark` | 30px / 1.1 / 500, -0.02em | Solo "AI Ticket It" en la marca (26px desktop), brillo accent-500 |
| `type-h1` | 42px / 1.12 / 500 | Reservado, las apps no lo usan |
| `type-h2` | 32px / 1.12 / 500 | Título del lienzo de diseño |
| `type-h3` | 25px / 1.12 / 500 | Título de página desktop; pantallas de resultado mobile |
| `type-h4` | 20px / 1.12 / 500 | Título de detalle desktop; título de lista mobile |
| `type-h5` | 16px / 1.12 / 500 | Encabezado de sección en desktop |
| `type-screen-title` | 17px / 1.25 / 500 | Título de la AppBar mobile |
| `type-stat` | 28px / 1.1 / 500 | Cifra principal de StatCard (32px para el puntaje del organizador) |
| `type-card-title` | 17px / 1.2 / 500 | Nombre del evento en tarjetas (15px en listas densas y grillas desktop) |
| `type-body` | 15px / 1.55 / 400 | Cuerpo, opciones de RadioCard |
| `type-body-sm` | 14px / 1.5 / 400 | Botones, inputs, chat, filas de tabla, datos del evento |
| `type-caption` | 13px / 1.45 / 400 | Ayudas, reseñas, notas |
| `type-label` | 12px / 1.4 / 400 | Labels de campo, pestañas, totales chicos |
| `type-meta` | 11px / 1.4 / 400 | Metadatos de tarjeta, tags |
| `type-overline` | 13px / 1.12 / 500, 0.08em, MAYÚS | Encabezado de grupo de opciones, muted |
| `type-kicker` | 10px / 1.4 / 400, 0.1em, MAYÚS | Antetítulo de tarjeta en acento |

## Espaciado y layout

- **Todo alineado a la izquierda.** Nada centrado salvo el wordmark de la marca.
- **Mobile:** margen lateral `pad-screen-x` (20), gap entre tarjetas `gap-stack` (10), entre bloques `gap-section` (14), padding de tarjeta `pad-card` (14). Lo fijo abajo (ActionFooter, BottomNav, compositor) cierra con `pad-footer-bottom` (30).
- **Desktop:** `pad-page-desktop` (32) y grillas con `gap-grid` (20). Mis eventos = grilla de 4 columnas; Crear evento y Consultas = dos columnas (formulario + vista previa de 400px; bandeja de 380px + chat).
- Todo control tocable en mobile ≥ `touch-target` (44px); botón principal = `cta-height` (46px).

| Token | Valor | Uso |
|---|---|---|
| `space-1` | 2.8px | Ícono y texto pegados |
| `space-2` | 5.6px | Gap de botones en diálogo, margen bajo títulos |
| `space-3` | 8.4px | Padding base de card, margen de párrafo |
| `space-4` | 11.2px | Padding del diálogo y header de navegación |
| `space-6` | 16.8px | Separación entre grupos |
| `space-8` | 22.4px | Separación entre secciones |
| `gap-tight` | 6px | Chips entre sí; ícono+texto en tags y botones |
| `gap-stack` | 10px | Gap vertical entre tarjetas mobile |
| `gap-section` | 14px | Gap entre bloques del scroll de Explorar |
| `gap-grid` | 20px | Gap de grillas desktop |
| `pad-card` | 14px | Padding de tarjetas, RadioCard, resumen |
| `pad-screen-x` | 20px | Margen lateral mobile |
| `pad-footer-bottom` | 30px | Padding inferior de footers fijos |
| `pad-page-desktop` | 32px | Margen lateral y superior desktop |

## Tamaños

| Token | Valor | Uso |
|---|---|---|
| `touch-target` | 44px | Mínimo de control tocable mobile |
| `cta-height` | 46px | Botón principal mobile |
| `control-height` | 36px | Botón e input desktop; botón ícono por defecto |
| `chip-height` | 34px | Chip de categoría mobile |
| `tab-height` | 48px | Pestaña de BottomNav y fila del menú de perfil |
| `avatar-lg` / `avatar-md` / `avatar-sm` | 52 / 44 / 36px | Menú de perfil / saludo Explorar / header desktop |
| `frame-mobile-w` × `frame-mobile-h` | 390 × 844 | Marco mobile |
| `frame-desktop-w` × `frame-desktop-h` | 1280 × 800 | Marco desktop |

## Radios y elevación

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 4px | Barras de progreso finas |
| `radius-tag` | 6px | Tags |
| `radius-md` | 8px | Botones, inputs, tarjetas, control segmentado |
| `radius-lg` | 14px | Diálogo, marca, burbujas de chat, marco desktop |
| `radius-sheet` | 28px | Esquinas superiores del bottom sheet |
| `radius-device` | 44px | Marco del teléfono (solo lienzo) |
| `radius-pill` | 999px | Chips, input del chat, avatar, botón enviar |

| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 0 0 1px #3f424d` | Tarjetas en reposo, opción elegida de RadioCard |
| `shadow-md` | `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)` | Marcos, tarjeta del login desktop |
| `shadow-lg` | `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)` | Diálogo y bottom sheet |

Elevación = borde fino + oscuridad ambiente. No apilar sombras. Bordes punteados (`color-divider`) solo para zonas donde se agrega algo: carga de imagen, "Nuevo evento", "Agregar tipo de entrada".

## Imágenes

- Fotos de eventos en 16:9 (se cargan a 1600 × 900). En tarjetas se recortan a 150px de alto (140 en desktop; 104px de ancho en Mis compras).
- Sin foto: placeholder `.img-ph` (degradé `neutral-900` → `accent-900`) con "Imagen del evento".
- Compra cancelada o reembolsada: imagen al 40% de opacidad.

## Estados e interacción

- Hover: tinte del texto o acento al 7–12%. Presionado: 14–22%. **Deshabilitado: 45% de opacidad, sin esconder.**
- Foco de teclado: `outline: 2px solid color-accent; outline-offset: 2px`. Nunca el anillo azul del navegador.
- Lo elegido se marca en acento + `shadow-sm`; lo activo con `aria-pressed` / `aria-current`.
- **Toda acción irreversible (cancelar compra) pasa por Dialog** con la consecuencia escrita.
- **Error de formulario:** `aria-invalid="true"` (borde `accent-400`) + `.field-error` debajo con `warning-circle` y la frase de qué falta, en 12px `accent-300`. No hay rojo. El botón de enviar queda `disabled` (no escondido) con una nota de qué revisar. Validar mientras se escribe.

## Estructura de pantalla

- **Compradores (mobile):** barra de estado → AppBar (o saludo + Avatar en Explorar) → contenido scrolleable → ActionFooter o BottomNav. El menú de perfil es un BottomSheet.
- **Organizadores (desktop):** DesktopNav → `page-head` (Volver, título, acción primaria a la derecha) → contenido. Ventas = DataTable con Chips de estado; consultas = ConversationList + Chat.
- **Ingreso (las dos):** BrandMark, una línea que dice para qué es la app, Email y Contraseña, botón primario "Ingresar". En mobile suma "o" y los ingresos con Google y Apple en secundario.

## Componentes

### Button
- `primary`: la acción principal de la pantalla. **Borde y texto `color-accent` sobre transparente** (no se rellena). Una sola por pantalla o footer.
- `secondary`: acciones alternativas (Ingresar con Google, Tengo una consulta, Volver en un diálogo). Borde `color-divider`.
- `ghost`: acciones de menor peso o destructivas que no deben gritar (Cancelar compra, Cerrar sesión).
- `icon`: solo ícono, siempre con `aria-label`; en mobile 44px.
- `cta`: botón principal mobile de 46px, ancho completo o flex:1 en el ActionFooter.
- `disabled` al 45%: para "Agotado" o cantidad mínima, no se esconde.

### Field
- Label arriba (12px, `color-text-label`), nunca como placeholder. Input/select/textarea (textarea ≥ 90px) con fondo `surface`, borde `divider`, foco en acento. Mobile 44px; desktop 36px.
- `search`: lupa + input de 44px, placeholder "Buscar evento, sala u organizador".
- `dropzone` para la imagen del evento: borde punteado, dice formato y medida ("JPG o PNG, 1600×900").
- Archivos cargados como `tag-neutral` con ícono (video, image) + ghost "Agregar foto o video".
- Error: ver "Estados e interacción". Mensajes: "Poné un nombre al evento", "Elegí fecha y hora", "La fecha tiene que ser futura", "Indicá dónde se hace el evento". Textos con límite: contador "0/500".

### Chip
- Filtro de una sola elección en píldora; activa con `aria-pressed="true"` (tratamiento de primario), demás como secundario.
- Fila con scroll horizontal en mobile. `chip` 34px (categorías mobile), `chip-sm` 26px (filtros de estado sobre tabla desktop).
- **La primera opción siempre es "Todos"/"Todas".**

### SegmentedControl
- Elección única entre 2 a 4 opciones cortas sobre radios reales. Ocupa el ancho disponible en partes iguales (Ordenar en Explorar). Más de 4 opciones o categorías → Chip.

### Tag
Etiqueta chica (`radius-tag`, 11px). Mapeo fijo, igual en las dos apps:

| Estado de compra | Variante | Ícono |
|---|---|---|
| Pendiente de pago | `tag-outline` | `clock` |
| Confirmada | `tag-accent` | `check-circle` |
| Utilizada | `tag-neutral` | `ticket` |
| Cancelada | `tag-neutral` | `x-circle` |
| Reembolsada | `tag-neutral` | `arrow-counter-clockwise` |

| Estado de evento | Variante |
|---|---|
| Publicado | `tag-accent` |
| Borrador | `tag-outline` |
| Finalizado | `tag-neutral` |

- Categoría del evento (Teatro, Comedia, Drama, Amor) en `tag-neutral`.
- Estados de compra siempre con ícono + palabra. `tag-lg` (12px) en el detalle de compra; `tag-count` para contador de consultas sin leer dentro de un botón; `dot-unread` (punto de 8px en acento) para "no leído" en listas.

### EventCard (Compradores)
- Imagen de 150px con categoría arriba a la izquierda (`tag-neutral`) y corazón arriba a la derecha (`heart` / `heart-fill` en `accent-300`); debajo título, fecha y lugar con ícono; al pie precio ("Desde $ 12.000") + puntaje del organizador a la izquierda y "Comprar" a la derecha.
- Toda la tarjeta abre el detalle; corazón y Comprar son acciones propias.

### EventManageCard (Organizadores)
- Grilla de 4 columnas. Imagen de 140px, título (15px), fecha + Tag de estado, ProgressBar fina y "N de M entradas vendidas".
- La grilla termina con un tile punteado "Nuevo evento" que equivale a "Crear evento".

### EventPreview (Organizadores)
- Columna derecha (400px) de Crear evento; muestra el evento como lo verá el comprador y se actualiza con cada cambio del formulario.
- Kicker "Vista previa · así lo verá el comprador"; adentro una EventCard con categoría, título, fecha, lugar, descripción, lista de tipos con lugares y precio, y un "Comprar" que no responde.
- Debajo: "Capacidad total: N lugares" (suma de cupos).
- Campos vacíos con su nombre genérico ("Nombre del evento", "Ubicación", "Fecha a definir"), nunca en blanco.

### TicketTypeEditor (Organizadores)
- Grilla de 3 columnas; cada tipo es una tarjeta con kicker "Entrada N", botón quitar (`trash`, `aria-label="Quitar entrada N"`), Nombre arriba y Cupo + Precio ($) lado a lado.
- Termina con tile punteado "Agregar tipo de entrada". Una entrada nueva arranca vacía.
- Reglas y mensajes:
  - Nombre obligatorio y único en el evento: "Poné un nombre" / "Ya hay una entrada con este nombre".
  - Cupo entero ≥ 1: "Indicá el cupo" / "El cupo tiene que ser 1 o más".
  - Precio ≥ $ 0 (0 = entrada gratuita): "Indicá el precio" / "El precio no puede ser negativo".
  - Sin ningún tipo: "Agregá al menos un tipo de entrada", arriba de la grilla.
- Mientras haya un error, "Publicar evento" queda `disabled` con la nota "Revisá los campos marcados para publicar." **"Guardar borrador" siempre está habilitado.**

### RadioCard
- Opción sobre `input type="radio"` en tarjeta `surface` ≥ 56px.
- Tipo de entrada: nombre + "Quedan N" (o "Agotada") + precio. Agotada = `disabled` (45%) pero visible.
- Medio de pago: ícono 20px (`credit-card`, `wallet`, `bank`) + nombre.
- Elegida: `shadow-sm` y punto en acento. Agrupadas bajo un encabezado ("Tipo de entrada", "Medio de pago").

### QuantityStepper
- Botones "Restar" / "Sumar" (secundarios, 44px), cada uno se deshabilita al llegar a su límite. Ayuda: "Máximo N" o "Sin cupo". El total se actualiza en el ActionFooter.

### ActionFooter
- Pie fijo del flujo de compra: valor a la izquierda ("Desde", "Total": 12px muted + 17px tabular) y botón primario 46px que ocupa el resto.
- Sin valor (Pago, Detalle de compra): botón a todo el ancho; dos acciones apiladas: secundaria arriba, ghost abajo. Padding inferior 30px.

### AppBar (mobile)
- Volver a la izquierda siempre (`arrow-left`, 44px, `aria-label="Volver"`). Título 17px, una línea con elipsis. Subtítulo opcional 12px muted (evento · fecha, organizador · compra). A lo sumo una acción a la derecha.
- Pantallas raíz (Explorar) no llevan AppBar: arrancan con saludo y avatar.

### BottomNav (mobile)
- Pestañas raíz de Compradores: **Explorar** y **Favoritos**. Actual con `aria-current="page"`, ícono relleno (`compass-fill`, `heart-fill`) y texto en acento; demás en línea `neutral-400`. Ícono 22px + etiqueta 12px, 48px de alto.
- Mis compras y Datos personales viven en el menú de perfil (BottomSheet), no como pestañas.

### BottomSheet (mobile)
- Hoja desde abajo sobre `color-scrim-strong`; tocar el scrim la cierra. `surface`, `radius-sheet`, `shadow-lg`, handle arriba.
- Encabezado con Avatar grande, nombre y "Mi perfil". Cada destino es una fila de 48px: ícono 20px, texto, `caret-right`. Cerrar sesión va última, en ghost y sin flecha.

### Avatar
- Círculo con iniciales; no hay fotos de perfil. Propio usuario: `accent-900` + texto `accent-200` (52px menú, 44px Explorar —es un botón que abre el menú—, 36px header desktop). Comprador en la bandeja de consultas: 38px, `neutral-800`.

### BrandMark
- Escenario con telón, festón y dos haces de luz dibujado con la rampa de acento (no hay logo en archivo). Solo en pantallas de ingreso: 200px en mobile, 150px compacto en el login desktop. Nombre en `type-wordmark` con brillo `accent-500`.
- En el resto de la app la marca es `ticket-fill` en acento + "AI Ticket It" (DesktopNav).

### DesktopNav
- Header de toda pantalla de Organizadores: marca a la izquierda, links, nombre de la compañía + Avatar a la derecha. Link actual con `aria-current="page"` en acento.
- Debajo, `page-head`: Volver si corresponde, título h3/h4, contador muted y acción primaria a la derecha.

### DataTable
- Tabla de ventas. Encabezado en mayúsculas 11px muted; filas separadas por línea que se desvanece. Números de compra y montos tabulares; montos y acciones alineados a la derecha.
- Estado = Tag con ícono. Sobre la tabla, Chips `chip-sm` para filtrar por estado.
- Acción contextual ("Marcar utilizada") como botón secundario chico; chat de la compra como botón ícono de 30px con `aria-label`.

### ProgressBar
- Nunca va sola, siempre con texto. `progress` (4px, acento plano) en la tarjeta de evento con "N de M entradas vendidas". `progress-lg` (10px, degradé `accent-700` → `accent`) para disponibilidad por tipo de entrada. Riel `neutral-900`.

### StatCard
- Una cifra principal con kicker y aclaración (Recaudado). Cifra en `type-stat` tabular. Usarla solo para el dato que el organizador viene a buscar.

### PurchaseCard (mobile)
- Fila de una compra: texto a la izquierda (evento, fecha, "Tipo × cantidad"), imagen de 104px a la derecha. Abajo Tag de estado y, solo si está Confirmada, cuenta regresiva en `accent-300`.
- Cancelada y Reembolsada: imagen al 40%.

### DetailList
- `detail-list` dentro de card: término muted, valor en `color-text`. Para el detalle de compra (Fecha, Lugar, Entradas, Total, Pago, Compra).
- `facts`: ícono en acento + dato, sin etiqueta. Para la cabecera del detalle del evento (fecha larga, hora, lugar, rango de precios).

### Dialog
- Modal sobre `color-scrim`, `shadow-lg`. Título como pregunta ("¿Cancelar la compra?"); cuerpo dice qué pasa con la plata y que no se puede deshacer. Acciones a la derecha: volver en secundario, confirmación en primario con el mismo verbo del título.

### Chat
- Un chat por compra. Propio a la derecha en `accent-800`; del otro a la izquierda en `surface`. Burbuja `radius-lg`, ancho máximo 78%, hora en 10px muted debajo.
- Compositor fijo abajo: input redondeado de 44px + botón enviar circular primario.
- La AppBar del chat dice el evento y "Organizador · Compra #id".

### ConversationList (Organizadores)
- Columna izquierda (380px) de Consultas: una conversación por compra con comprador, compra, último mensaje, hora y no leídos (`dot-unread`). La seleccionada con `aria-current="true"` (fondo `surface` + `shadow-sm`). A la derecha, el Chat de esa compra.

### Rating
- **Para calificar:** cinco estrellas (botones con `aria-label` "N estrellas" y `aria-pressed` en la elegida), llenas hasta la elegida. Botón de envío `disabled` hasta elegir. Comentario opcional ("Contanos qué te pareció (opcional)").
- **Para mostrar:** puntaje (32px) + nombre del organizador + "N reseñas de eventos anteriores". Cada reseña: autor, estrellas en texto (★★★★☆), evento y comentario muted.
- **La reseña es del organizador, no del evento.**
- **Reglas:** solo una compra **Utilizada** se puede calificar, **una sola vez**. Puntaje 1–5 + comentario opcional de hasta 500 caracteres, guardado en la compra.
- **Dónde se califica:** Mis compras ("Calificá tu experiencia" / ya calificada "Calificaste ★★★★☆"), Detalle de compra (tarjeta "Tu entrada fue utilizada" → "Calificar experiencia"; ya calificada "Tu calificación" + "Visible en los eventos de {organizador}"), pantalla Calificar experiencia (estrellas grandes 36px, palabra del puntaje: Malo, Regular, Bueno, Muy bueno, Excelente; comentario con contador; "Enviar calificación"), y Explorar (recordatorio con la compra utilizada más reciente sin calificar).

### Feedback
- `note`: aviso informativo con ícono `info` (12–13px muted), para reglas.
- Confirmación en línea: tarjeta chica con `check-circle` en acento + una frase.
- `empty`: ícono de 28px a media opacidad, qué pasó y qué probar.
- Pantalla de éxito: marca de 96px con brillo `accent-600`, título h3 "¡Compra confirmada!", número de compra en `tag-accent` y lo que falta ("Faltan 3 días para el evento").

## Checklist para una pantalla nueva

1. Una sola acción primaria visible.
2. Textos en voseo, sentence case, plata y fechas con el formato de arriba.
3. Solo tokens: ni un hex suelto.
4. Estados con Tag + ícono + palabra.
5. Controles mobile de 44px o más; footer con 30px abajo.
6. Estados vacío, deshabilitado y error pensados.

## Hacer / No hacer

- **Hacer:** croma bajo fuera del acento; delinear la acción principal; reusar componentes tal como están (si falta uno, agregarlo al design system antes de usarlo).
- **No hacer:** rellenar áreas grandes o botones con el acento o colores saturados; negro o blanco puros; títulos en negrita (> 500); centrar contenido o titulares; colores de estado (verde, rojo) o emoji.
