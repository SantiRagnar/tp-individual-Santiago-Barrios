# Contrato del front: rutas y textos del panel de eventos (organizadores)

Todas las rutas van dentro del `Stack.Protected guard={!!organizador}` de `src/app/organizadores/_layout.tsx` (FR-015 de la feature 001). Las llamadas a la API pasan `token` y `tipo: "organizador"` a `pedir()`.

## Rutas

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/organizadores/mis-eventos` | `organizadores/mis-eventos.tsx` | Organizadores 02 · Mis eventos | `GET /organizadores/eventos` |
| `/organizadores/eventos/nuevo` | `organizadores/eventos/nuevo.tsx` | Organizadores 03 · Crear evento | `POST /organizadores/imagenes`, `POST /organizadores/eventos` |
| `/organizadores/eventos/[id]` | `organizadores/eventos/[id]/index.tsx` | Organizadores 04 · Detalle del evento (mínimo, FR-021) | `GET /organizadores/eventos/{id}` |
| `/organizadores/eventos/[id]/editar` | `organizadores/eventos/[id]/editar.tsx` | Organizadores 03 como Editar evento | `GET` + `PUT /organizadores/eventos/{id}`, `POST /organizadores/imagenes` |

`nuevo` se declara antes que `[id]` para que no se tome como un id.

## Navegación (FR-025)

| Desde | Acción | Hacia |
|---|---|---|
| Mis eventos | **Crear evento** / tile **Nuevo evento** | Crear evento |
| Mis eventos | clic en una tarjeta | Detalle del evento |
| DesktopNav | link "Mis eventos" | Mis eventos |
| Crear evento | **Publicar evento** (ok) | Detalle del evento creado (`replace`, para que Volver no regrese al formulario) |
| Crear evento / Editar (Borrador) | **Guardar borrador** (ok) | Mis eventos |
| Crear evento | Volver | Mis eventos (sin guardar) |
| Detalle | Volver | Mis eventos |
| Detalle | **Editar evento** (no se muestra si Finalizado) | Editar evento |
| Editar evento | Volver | Detalle |
| Editar evento (Publicado) | **Guardar cambios** (ok) | Detalle |
| Editar evento (Borrador) | **Publicar evento** (ok) | Detalle |
| Detalle / Editar de un evento inexistente o ajeno (404) | — | Mensaje "No encontramos el evento." + link a Mis eventos |
| Editar de un Finalizado (409) | — | Detalle |

## Organizadores 02 · Mis eventos

- Título "Mis eventos"; contador "N eventos" / "1 evento" / "0 eventos"; botón primario **Crear evento**.
- EventManageCard: imagen (o espacio neutro si no tiene), título (o "Nombre del evento"), fecha corta "Sáb 21 nov · 21:00" (o "Fecha a definir"), Tag de estado, ProgressBar fina, "N de M entradas vendidas".
- Tile punteado **Nuevo evento** al final.
- Cargando: tarjetas esqueleto (`surface`). Error de red: "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar** (secundario).
- Columnas: 4 / 3 / 2 / 1 según el ancho (research R14).

## Organizadores 03 · Crear / Editar evento

| Elemento | Texto |
|---|---|
| Título | "Crear evento" / "Editar evento" |
| Imagen | Label "Imagen del evento"; dropzone "Arrastrá un archivo o hacé clic. JPG o PNG, 1600×900."; con imagen: miniatura + "Cambiar imagen" (ghost) |
| Errores de imagen | "La imagen tiene que ser JPG o PNG" · "La imagen no puede pesar más de 5 MB" · "No pudimos subir la imagen. Probá de nuevo." |
| Campos | "Nombre del evento" · "Descripción" (contador "N/2000") · "Categoría" (placeholder "Elegí una categoría") · "Fecha y hora de realización" · "Ubicación" (placeholder "Sala y dirección") |
| Material multimedia | Tags con ícono foto/video y quitar (`aria-label="Quitar {nombre}"`) + ghost **Agregar foto o video** |
| Tipos de entrada | Label "Tipos de entrada"; tarjetas "Entrada N" con "Nombre" (placeholder "Ej.: Platea"), "Cupo", "Precio ($)"; quitar `aria-label="Quitar entrada N"`; tile **Agregar tipo de entrada** |
| Tipo con ventas | Quitar deshabilitado (45%) con ayuda "Tiene ventas: no se puede quitar"; debajo "N vendidas" (muted) |
| Errores de campo | "Poné un nombre al evento" · "Elegí fecha y hora" · "La fecha tiene que ser futura" · "Indicá dónde se hace el evento" · "Agregá al menos un tipo de entrada" (arriba de la grilla) |
| Errores de tipo | "Poné un nombre" · "Ya hay una entrada con este nombre" · "Indicá el cupo" · "El cupo tiene que ser 1 o más" · "El cupo no puede ser menor a las vendidas (N)" · "Indicá el precio" · "El precio no puede ser negativo" |
| Acciones (Crear / Borrador) | **Publicar evento** (primario) + **Guardar borrador** (secundario) |
| Acciones (Publicado) | **Guardar cambios** (primario); sin **Guardar borrador** |
| Nota bajo el primario deshabilitado (solo con algún error visible) | "Revisá el campo marcado para publicar." · "Revisá los campos marcados para publicar." · "Agregá al menos un tipo de entrada para publicar." (en Publicado: "…para guardar.") |
| Guardando | Los dos botones deshabilitados |
| Error de red | "No pudimos conectarnos. Probá de nuevo en un rato." (se conserva todo lo escrito) |

**Cuándo se muestra un error de campo (FR-013)**: cuando ese campo ya fue tocado. El botón primario se ve deshabilitado (45%) en cuanto hay cualquier error, aunque todavía no se muestre, y nunca envía con errores; si igual se lo toca, se marcan todos los campos como tocados y aparecen todos los errores. La nota bajo el botón aparece solo cuando hay al menos un error visible (con el formulario recién abierto, el botón se ve deshabilitado y sin nota).

### Vista previa (FR-017, FR-018)

Kicker "Vista previa · así lo verá el comprador". EventCard: imagen, Tag de categoría (se omite si no hay), nombre ("Nombre del evento"), fecha corta ("Fecha a definir"), ubicación ("Ubicación"), descripción ("Descripción del evento"), lista "{tipo} · {cupo} lugares — $ {precio}" ("Sin nombre", cupo vacío → "0 lugares", precio vacío → "$ 0"), botón **Comprar** inerte. Debajo: "Capacidad total: N lugares" ("1 lugar" si N = 1).

## Organizadores 04 · Detalle del evento (versión mínima, FR-021)

- Volver; título del evento ("Nombre del evento" si falta); "{fecha corta} · {ubicación}" ("Fecha a definir" / "Ubicación"); Tag de estado.
- **Editar evento** (secundario; no se muestra si Finalizado).
- **Consultas del evento** (secundario, deshabilitado al 45%, sin contador).
- No incluye disponibilidad, Recaudado ni Ventas.

## Formatos (design system)

- Plata: `$ 18.000` (punto de miles, sin decimales); 0 → `$ 0`.
- Fecha corta: `Sáb 21 nov · 21:00`, en hora local.
- "N de M entradas vendidas" con miles con punto: "1.200 de 2.000 entradas vendidas".
