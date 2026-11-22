# Contrato del front: Compra, pago simulado y Mis compras (compradores)

Todas las rutas nuevas van dentro del `Stack.Protected guard={!!comprador}` de `src/app/(compradores)/_layout.tsx`. Las llamadas a la API pasan `token` y `tipo: "comprador"` a `pedir()`, así que un 401 `SESION_INVALIDA` borra la sesión y lleva al Ingreso. Los endpoints están en [compras.openapi.yaml](compras.openapi.yaml); las funciones nuevas viven en `src/api/compras.ts`.

## Rutas

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/eventos/[id]/entradas` | `(compradores)/eventos/[id]/entradas.tsx` | Compradores 05 · Elegir entradas | `GET /compradores/eventos/{id}` |
| `/eventos/[id]/pago?tipo=&cantidad=` | `(compradores)/eventos/[id]/pago.tsx` | Compradores 06 · Pago | `GET /compradores/eventos/{id}`, `POST /compradores/compras` |
| `/compras/[numero]/confirmada` | `(compradores)/compras/[numero]/confirmada.tsx` | Compradores 07 · Compra confirmada | `GET /compradores/compras/{numero}` |
| `/mis-compras` | `(compradores)/mis-compras.tsx` | Compradores 08 · Mis compras | `GET /compradores/compras` |
| `/compras/[numero]` | `(compradores)/compras/[numero]/index.tsx` | Compradores 09 · Detalle de compra | `GET /compradores/compras/{numero}`, `POST …/pago`, `POST …/cancelacion` |

El archivo de Detalle del evento de la feature 003 (`eventos/[id].tsx`) pasa a `eventos/[id]/index.tsx` para poder tener rutas hijas. La URL `/eventos/[id]` no cambia.

El Menú de perfil (Compradores 03) no es una ruta: es un `BottomSheet` (Modal) que abre el Avatar de Explorar.

## Navegación

| Desde | Acción | Hacia |
|---|---|---|
| Explorar (EventCard) / Detalle del evento (ActionFooter) | **Comprar** | Elegir entradas (`push`) |
| Elegir entradas | **Continuar al pago** | Pago (`push`, con `tipo` y `cantidad`) |
| Pago | **Pagar $ X** → 201 | `dismiss(2)` (saca Pago y Elegir entradas) y después `push` de Compra confirmada. Volver desde ahí va a la pantalla donde se tocó **Comprar**, nunca a Pago. |
| Pago | **Pagar $ X** → 409 `LUGARES_INSUFICIENTES` / `PRECIO_CAMBIADO` | `back()` a Elegir entradas y `setParams` con `aviso=lugares\|precio` y `tipoNombre` |
| Elegir entradas / Pago | 404 `EVENTO_NO_ENCONTRADO` | Pantalla "Este evento no está disponible." + **Volver a Explorar** (feature 003) |
| Compra confirmada | **Ver mi compra** | Detalle de compra (`replace`): su Volver lleva a la pantalla donde se tocó **Comprar** |
| Compra confirmada | **Volver a explorar** | Explorar (`dismissTo`) |
| Explorar | Avatar | Abre el Menú de perfil |
| Menú de perfil | **Mis compras** / **Favoritos** / **Cerrar sesión** | Mis compras / pestaña Favoritos / Ingreso |
| Menú de perfil | **Datos personales** | Nada (FR-029) |
| Mis compras | toque en una PurchaseCard | Detalle de compra (`push`) |
| Mis compras (vacío) | **Explorar eventos** | Explorar |
| Detalle de compra | Volver | Pantalla anterior: Mis compras, o la pantalla donde se tocó **Comprar** si se llegó con **Ver mi compra** (nunca el flujo de compra) |
| Detalle de compra (404) | **Volver a Mis compras** | Mis compras |

## Compradores 03 · Menú de perfil (BottomSheet)

- Avatar grande (52px, `accent-900` + `accent-200`), "{nombre} {apellido}", "Mi perfil".
- Filas: **Mis compras**, **Favoritos**, **Datos personales** (sin acción) y **Cerrar sesión** (ghost, al final).
- Se cierra tocando el scrim o eligiendo una fila.

## Compradores 05 · Elegir entradas

- AppBar: "Elegí tus entradas", con el subtítulo "{evento} · {fecha corta}".
- Un RadioCard por tipo: nombre, precio, y "Quedan N" o "Agotada" (deshabilitado). Arranca preseleccionado el primer tipo con lugares.
- QuantityStepper de 1 a `min(disponibles, 10)`, con la ayuda "Máximo N". Si no queda ningún tipo con lugares, la ayuda dice "Sin cupo" y el stepper está deshabilitado.
- Aviso en línea arriba de la lista si llega `aviso`: "Ya no quedan suficientes entradas de {tipoNombre}." o "El precio de {tipoNombre} cambió. Revisá tu compra.". Al volver con aviso, pide el evento de nuevo; si el tipo elegido quedó Agotada o ya no existe, preselecciona el primer tipo con lugares y ajusta la cantidad al nuevo máximo.
- ActionFooter: "Total" + "$ X" y **Continuar al pago**, deshabilitado si no hay un tipo con lugares.
- Estados: carga (esqueleto), error de red ("No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**) y no disponible (404).

## Compradores 06 · Pago

- AppBar: "Pago".
- Tarjeta Resumen: evento, "{fecha corta} · {sala}", "{tipo} × {cantidad}" y total. Se arma con el evento recién pedido, y el precio que se muestra es el `precioUnitario` que se envía.
- **Medio de pago**: RadioCard con Tarjeta de crédito, Tarjeta de débito, Mercado Pago y Transferencia, sin ninguno preseleccionado.
- Nota muted: "Pago simulado: no se realiza ningún cobro."
- Botón cta **Pagar $ X**: deshabilitado sin medio de pago y, mientras se procesa, con indicador y deshabilitado (FR-011).
- Error de red: aviso "No pudimos conectarnos. Probá de nuevo en un rato." con el botón disponible para reintentar.

## Compradores 07 · Compra confirmada

- Marca de éxito (`check-circle` en acento), "¡Compra confirmada!", "{evento} · {tipo} × {cantidad}", "Compra #A-NNNN", "Faltan N días para el evento." / "Falta 1 día para el evento." (sin esa línea si `diasParaEvento` es `null`) y "Vas a encontrar tus entradas en Mis compras.".
- Botones: **Ver mi compra** (secundario arriba) y **Volver a explorar** (ghost abajo), según design-system § ActionFooter "dos acciones apiladas".

## Compradores 08 · Mis compras

- AppBar: Volver + "Mis compras".
- Una PurchaseCard por compra, en el orden de la API:
  - A la izquierda: evento, fecha corta y "{tipo} × {cantidad}". A la derecha, imagen de 104px, al 40 % si está Cancelada o Reembolsada.
  - Abajo: TagCompra (ícono + palabra) y, si `diasParaEvento` no es `null`, "Faltan N días" en `accent-300`.
  - Si está Utilizada: "Calificaste ★★★★☆" si tiene calificación; si no, "Calificá tu experiencia" sin acción (FR-029).
- Vacío: "Todavía no compraste entradas" + "Cuando compres, vas a encontrarlas acá." + **Explorar eventos** (secundario).
- Pide los datos cada vez que la pantalla toma foco. Error de red: aviso + **Reintentar**.

## Compradores 09 · Detalle de compra

- AppBar: Volver + nombre del evento.
- Imagen, TagCompra grande (`tag-lg`) y cuenta regresiva si corresponde.
- DetailList dentro de una card:

  | Término | Valor |
  |---|---|
  | **Fecha** | "Sábado 21 de noviembre · 21:00 h" |
  | **Lugar** | Ubicación del evento |
  | **Entradas** | "Platea × 2" |
  | **Total** | "$ 36.000" |
  | **Pago** | Medio de pago |
  | **Compra** | "#A-1042" |

- Si está Utilizada:
  - Con calificación: tarjeta "Tu calificación" con estrellas, comentario o "Sin comentario." y "Visible en los eventos de {organizador}".
  - Sin calificación: tarjeta "Tu entrada fue utilizada — Contales a otros compradores cómo fue tu experiencia con {organizador}." y **Calificar experiencia** sin acción (FR-029).
- Si `acciones.completarPago`: **Completar pago** (primary). Al tocarlo se deshabilita mientras se procesa y después muestra la compra actualizada.
- Nota según `motivoNoCancelable` (textos en [data-model.md](../data-model.md)).
- Acciones apiladas al pie:
  - **Tengo una consulta** (secundario, sin acción, FR-029).
  - **Cancelar compra** (ghost), solo si `acciones.cancelar`.
- Dialog "¿Cancelar la compra?":
  - Cuerpo, si está Confirmada: "Se reintegrarán $ X a tu {medio de pago}. Esta acción no se puede deshacer.".
  - Cuerpo, si está Pendiente: "La compra se cancelará y se liberarán las entradas reservadas.".
  - Botones: **Volver** (secundario) y **Cancelar compra** (primary).
  - Un 409 al confirmar vuelve a pedir la compra y muestra su estado actual.
- 404: AppBar con Volver, "No encontramos esta compra." y **Volver a Mis compras** (secundario).

## Cambios en pantallas existentes

- **Explorar**: el Avatar abre el Menú de perfil. **Comprar** de la EventCard navega a Elegir entradas (antes no hacía nada, FR-009 de la 003).
- **Detalle del evento**: **Comprar** del ActionFooter navega a Elegir entradas.
