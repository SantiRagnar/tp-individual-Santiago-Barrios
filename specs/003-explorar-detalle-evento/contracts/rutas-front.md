# Contrato del front: Explorar, Detalle del evento y Favoritos (compradores)

Todas las rutas van dentro del `Stack.Protected guard={!!comprador}` de `src/app/(compradores)/_layout.tsx` (FR-002, FR-015 de la feature 001). Las llamadas a la API pasan `token` y `tipo: "comprador"` a `pedir()`. Endpoints en [compradores.openapi.yaml](compradores.openapi.yaml).

## Rutas

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/explorar` | `(compradores)/(pestanas)/explorar.tsx` | Compradores 02 · Explorar | `GET /compradores/eventos` |
| `/favoritos` | `(compradores)/(pestanas)/favoritos.tsx` | Compradores 11 · Favoritos | `GET /compradores/favoritos` |
| `/eventos/[id]` | `(compradores)/eventos/[id].tsx` | Compradores 04 · Detalle del evento | `GET /compradores/eventos/{id}`, `GET /compradores/organizadores/{id}/resenas` |

`(pestanas)/_layout.tsx` es un `Tabs` de expo-router con `tabBar` = `BottomNav` (research R11). El corazón de las tres pantallas llama a `PUT` / `DELETE /compradores/favoritos/{eventoId}` a través de `FavoritosProvider` (R13).

## Navegación

| Desde | Acción | Hacia |
|---|---|---|
| Ingreso (ok) | — | Explorar (igual que en la feature 001) |
| BottomNav | **Explorar** / **Favoritos** | Esa pestaña (conserva el estado de la otra) |
| Explorar / Favoritos | toque en la tarjeta | Detalle (`push`) |
| Explorar / Detalle | **Comprar** | Nada (FR-009) |
| Detalle | Volver (AppBar) | Pantalla anterior, con su búsqueda, chip, orden y scroll (FR-015) |
| Detalle no disponible (404) | **Volver a Explorar** | Explorar |
| Cualquiera (401 `SESION_INVALIDA`) | — | Ingreso de compradores |

## Compradores 02 · Explorar

- Encabezado: Avatar (`avatar-md`) con iniciales, "Hola, {nombre}" y "¿Qué querés ver?". El avatar mantiene el comportamiento de la feature 001 (FR-003).
- Búsqueda: campo con ícono `magnifying-glass` y placeholder "Buscar evento, sala u organizador"; espera 300 ms después de la última tecla (R12).
- Chips (fila con scroll horizontal): **Todos** (activo por defecto), Teatro, Comedia, Drama, Amor.
- Ordenar: SegmentedControl **Fecha** (por defecto) / **Precio** / **Puntaje**.
- Contador: "N eventos" / "1 evento" / "0 eventos", con el `total` de la respuesta.
- Lista (FlatList) de EventCard:
  - Imagen de 150px (o espacio neutro `surface` sin imagen), Tag de categoría arriba a la izquierda (`tag-neutral`) y BotonFavorito arriba a la derecha.
  - Título, fecha corta con ícono ("Sáb 21 nov · 21:00"), sala con ícono.
  - Pie: "Desde $ 12.000" y "4.5 · Compañía La Trama" (sin reseñas: solo "Compañía La Trama") a la izquierda; **Comprar** (o **Agotado** deshabilitado) a la derecha.
- Al llegar al final: `ActivityIndicator` al pie mientras carga la página siguiente (FR-025).
- Vacío: "No encontramos eventos" + "Probá con otra búsqueda o categoría.".
- Primera carga: tarjetas esqueleto (`surface`). Error de red: "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar** (secundario); si falla una página siguiente, el aviso va al pie y los eventos cargados quedan.
- BottomNav con **Explorar** activa.

## Compradores 04 · Detalle del evento

- AppBar: Volver (`arrow-left`, `aria-label="Volver"`), título del evento (una línea con elipsis) y BotonFavorito como única acción.
- Imagen (o espacio neutro) y Tag de categoría.
- Facts (ícono en acento + dato): fecha larga "Sábado 21 de noviembre", hora "21:00 h", sala, precios "$ 12.000 a $ 26.000" (un solo precio si todos son iguales).
- Descripción.
- **Opiniones sobre el organizador** (Rating "para mostrar"):
  - Puntaje en 32px ("4.5"), nombre del organizador, "4 reseñas de eventos anteriores" / "1 reseña de eventos anteriores".
  - Cada reseña: autor ("Sofía G."), estrellas en texto ("★★★★☆"), nombre del evento, comentario muted o "Sin comentario.".
  - **Ver más** (botón secundario) al pie si `siguiente` no es `null`: agrega las 5 siguientes abajo; mientras carga, el botón muestra indicador (`enviando`); si falla, aviso de conexión y el botón sigue disponible (FR-024).
  - Sin reseñas: nombre del organizador y "Todavía no tiene reseñas.".
- ActionFooter: "Desde" + "$ 12.000" a la izquierda; **Comprar** (sin acción) o **Agotado** deshabilitado.
- No disponible (404): AppBar con Volver, "Este evento no está disponible." y **Volver a Explorar** (secundario).

## Compradores 11 · Favoritos

- Título "Favoritos".
- FavoritoCard por evento: título, fecha corta, "Desde $ X" y BotonFavorito lleno para quitar. Al quitarlo, la tarjeta desaparece de la lista.
- Vacío: "Todavía no guardaste eventos" + "Tocá el corazón en un evento para encontrarlo acá.".
- Se recarga cada vez que la pestaña toma foco, para reflejar cambios hechos en Explorar o el Detalle.
- BottomNav con **Favoritos** activa.

## BotonFavorito

- Ícono `heart` (vacío) / `heart-fill` (lleno) en `color-accent-300`, área táctil ≥ 44px.
- `accessibilityLabel`: "Agregar a favoritos" / "Quitar de favoritos"; `accessibilityState.selected` según el estado.
- Cambia al instante y vuelve atrás si el pedido falla, con "No pudimos conectarnos. Probá de nuevo en un rato." (R13).

## Formatos (design system, `src/lib/formato.ts`)

| Función | Ejemplo |
|---|---|
| `plata` (existente) | `$ 12.000`, `$ 0` |
| `fechaCorta` (existente) | `Sáb 21 nov · 21:00` |
| `fechaLarga` | `Sábado 21 de noviembre` |
| `hora` | `21:00 h` |
| `rangoDePrecios` | `$ 12.000 a $ 26.000` / `$ 8.000` |
| `puntaje` | `4.5`, `4.0` |
| `estrellas` | `★★★★☆` |
| `contadorEventos` | `5 eventos`, `1 evento`, `0 eventos` |
| `contadorResenas` | `4 reseñas de eventos anteriores`, `1 reseña de eventos anteriores` |
