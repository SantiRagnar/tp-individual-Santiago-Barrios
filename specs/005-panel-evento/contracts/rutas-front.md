# Contrato del front: Panel del evento (organizadores)

La ruta va dentro del `Stack.Protected` de `src/app/organizadores/_layout.tsx` (FR-004). Las llamadas pasan `token` y `tipo: "organizador"` a `pedir()`, así que un 401 `SESION_INVALIDA` borra la sesión y vuelve al Ingreso. Endpoints en [ventas.openapi.yaml](ventas.openapi.yaml) y, para la cabecera y la disponibilidad, `GET /organizadores/eventos/{id}` (feature 002).

## Ruta

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/organizadores/eventos/[id]` | `organizadores/eventos/[id]/index.tsx` (reemplaza la versión mínima) | Organizadores 04 · Detalle del evento | `GET /organizadores/eventos/{id}`, `GET …/{id}/ventas`, `POST …/{id}/ventas/{numero}/utilizacion` |

## Navegación (sin cambios respecto de la feature 002)

| Desde | Acción | Hacia |
|---|---|---|
| Mis eventos | clic en EventManageCard | Panel del evento |
| Crear / Editar evento | Publicar, Guardar cambios o Guardar borrador | Panel del evento |
| Panel | Volver | Mis eventos (`back`, o `replace` si no hay historial) |
| Panel | **Editar evento** (no se muestra si está Finalizado) | Editar evento |
| Panel | **Consultas del evento** | Nada: deshabilitado al 45%, sin contador (feature de Consultas) |
| Panel con 404 | link **Mis eventos** | Mis eventos |

## Organizadores 04 · Detalle del evento

Layout desktop (1280 × 800): DesktopNav → `page-head` → contenido, alineado a la izquierda, `padPageDesktop`.

1. **Cabecera** (igual que la versión mínima): Volver; título (`h3`, "Nombre del evento" si falta); "{fecha corta} · {sala}" ("Fecha a definir" / "Ubicación"); TagEstado; a la derecha **Editar evento** y **Consultas del evento** (secundarios compactos).
2. **Fila superior** de dos columnas, que se apilan en pantallas chicas:
   - **Disponibilidad por tipo de entrada** (título de sección) con un bloque por tipo, en el orden del evento:
     - "{nombre} · {$ precio}". Sin nombre: "Sin nombre". Sin precio: solo el nombre.
     - `ProgressBar` variante `lg` con `vendidas / cupo`.
     - Debajo, a la izquierda "Quedan N" o "Agotada" (`cupo − vendidas = 0`); a la derecha "{vendidas} / {cupo} vendidas" (tabular). Sin cupo (`cupo` null, solo en Borrador): no se muestra ni "Quedan" ni "Agotada", solo "0 / 0 vendidas", y la barra queda vacía.
   - **StatCard** con kicker "Recaudado", cifra "$ 2.536.000" (`type-stat`, tabular) y aclaración "154 entradas vendidas · 60 compras activas" (singular: "1 entrada vendida", "1 compra activa").
3. **Ventas** (título de sección):
   - `FilaDeChips` (`chip-sm`) con **Todas 62**, **Confirmadas 51**, **Pendientes 9**, **Utilizadas 0**, **Canceladas 1** y **Reembolsadas 1**, a partir de `resumen.porEstado`. **Todas** está activo por defecto. Cada chip envía su `estado`: Pendientes → `Pendiente de pago`, Confirmadas → `Confirmada`, etc.
   - **DataTable** con encabezado en mayúsculas 11px muted: **Número, Comprador, Entradas, Estado, Medio de pago, Monto, Acciones**.
     - Filas `type-body-sm`: "#A-1042" (tabular), "Sofía Gómez", "Platea × 2", `TagEstadoCompra`, "Tarjeta de crédito", "$ 36.000" (tabular, a la derecha).
     - En Acciones, **Marcar utilizada** (secundario chico) solo si `acciones.marcarUtilizada`.
   - Si hay `siguiente`, **Ver más** (secundario) debajo de la tabla. Mientras carga, el botón queda deshabilitado con un `ActivityIndicator`. Si la página siguiente falla, al pie se ve "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**, y las filas ya cargadas quedan.
   - Vacío (página sin filas): "No hay ventas con este estado.".
   - Cambiar de chip vuelve a la primera página de ese estado (`useListaPaginada` con `clave = estado`).

## Marcar utilizada

- Al hacer clic, el botón de esa fila queda deshabilitado mientras espera la respuesta.
- **200**: la fila se reemplaza por `venta`; si el chip activo es **Confirmadas**, la fila se quita; los chips y el StatCard toman el `resumen` de la respuesta. No se recarga la lista.
- **409** `COMPRA_NO_CONFIRMADA` o `EVENTO_NO_COMENZO`: aviso inline sobre la tabla con el `mensaje` del servidor, y se recargan la primera página y el resumen del filtro activo.
- **404** `COMPRA_NO_ENCONTRADA` o `EVENTO_NO_ENCONTRADO`: se recarga la pantalla (el evento pudo dejar de ser accesible).
- **Error de red**: aviso "No pudimos conectarnos. Probá de nuevo en un rato." y la fila queda como estaba.

## Estados de la pantalla

| Estado | Se ve |
|---|---|
| Cargando el evento | `ActivityIndicator` debajo de Volver |
| Evento 404 | "No encontramos el evento." + link **Mis eventos** (sin datos del evento) |
| Error de red al cargar el evento | "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar** |
| Evento cargado y ventas cargando | Cabecera y disponibilidad; StatCard y tabla con `ActivityIndicator` |
| Error de red en la primera página de ventas | Cabecera y disponibilidad; en Ventas, el aviso de conexión + **Reintentar** |

La pantalla vuelve a cargar todo al recibir foco (`useFocusEffect`), por ejemplo al volver de Editar evento.
