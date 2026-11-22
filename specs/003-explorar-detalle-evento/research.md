# Research: Explorar y detalle de evento (compradores)

Decisiones de la Phase 0. Cada una con su motivo y las alternativas descartadas. Las referencias `FR-*`, `SC-*` y "User Story" son de [spec.md](spec.md). Las decisiones de las features 001 y 002 (reloj inyectable, estado Finalizado derivado, formato de errores, imágenes públicas) siguen vigentes y no se repiten.

## R1. Endpoints propios del lado compradores

- **Decisión**: un router nuevo montado en `/compradores` con `requiereSesion("comprador")`: `GET /compradores/eventos`, `GET /compradores/eventos/{id}`, `GET /compradores/organizadores/{id}/resenas`, `GET /compradores/favoritos`, `PUT` y `DELETE /compradores/favoritos/{eventoId}`. Ver [contracts/compradores.openapi.yaml](contracts/compradores.openapi.yaml).
- **Motivo**: separa claramente lo que ve un comprador (solo eventos visibles, con datos derivados de compra) de lo que ve un organizador (sus eventos en cualquier estado). Sigue el patrón de la feature 002 (`/organizadores/eventos`) y la convención FR-015 de sesión (FR-002).
- **Alternativas**: reutilizar `/organizadores/eventos` con un filtro (mezcla permisos y expone Borradores por error); endpoints públicos sin sesión (la spec exige sesión, FR-002).

## R2. Visibilidad: una sola regla en el servicio

- **Decisión**: `services/visibilidadEvento.js` exporta `esVisibleParaCompradores(evento, ahora)` = `evento.estadoVisible(ahora) === "Publicado"`. Como `estadoVisible` ya convierte en Finalizado un Publicado con fecha pasada, la regla cubre Borradores, Finalizados y eventos que terminaron mientras el comprador navega. La usan el listado, el detalle y los favoritos.
- **Motivo**: FR-001 y SC-002 piden que un oculto no se filtre "ni siquiera pidiéndolo directamente". Tener la regla en un único lugar hace que el test unitario la fije para las tres pantallas.
- **Alternativas**: filtrar en cada consulta por separado (fácil que una se olvide del caso "pasó la fecha").

## R3. Evento oculto o inexistente responde 404 igual

- **Decisión**: `GET /compradores/eventos/{id}` de un Borrador, Finalizado o id inexistente responde `404 EVENTO_NO_ENCONTRADO` (el mismo error de la feature 002). El front muestra su propio texto: "Este evento no está disponible." + **Volver a Explorar** (FR-016).
- **Motivo**: no revela si un Borrador existe (R16 de la feature 002). El mensaje del error es para logs y Swagger; el texto de pantalla es del diseño.
- **Alternativas**: `410 Gone` para Finalizados (distingue estados que el comprador no tiene por qué conocer).

## R4. Paginación de Explorar por cursor (keyset), de a 10

- **Decisión**: `GET /compradores/eventos?busqueda=&categoria=&orden=fecha|precio|puntaje&cursor=` devuelve `{ eventos, total, siguiente }`. El servicio filtra, ordena con una clave completa y estable (`[clave del orden, fechaHora, id]`) y devuelve los 10 que siguen estrictamente al cursor. `siguiente` es un cursor opaco (base64url de la clave del último evento devuelto) o `null` si no hay más. `total` cuenta todos los resultados del filtro (FR-007). El tamaño de página es una constante del servicio (`TAMANO_PAGINA_EVENTOS = 10`).
- **Motivo**: con offset (`pagina=2`), si entre dos pedidos se publica o finaliza un evento, la lista se corre y se repiten o saltean eventos (edge case de la spec). El cursor por clave pide "lo que viene después de este evento", que no se corre. Es la técnica que se usa en catálogos grandes y demuestra el criterio de escalabilidad de la clarificación.
- **Límites honestos**: con persistencia en memoria, el servicio igual recorre los eventos para filtrar (no hay índices de base de datos). El ahorro está en lo que viaja por la red y en lo que renderiza el teléfono, que es lo que mide SC-007. Si el puntaje de un organizador cambia entre dos páginas, su evento puede cambiar de lugar; el front descarta ids repetidos como resguardo (R12).
- **Alternativas**: offset/limit (repite o saltea, descartado por la spec); devolver todo y paginar en el front (contradice la clarificación 5).

## R5. Orden y desempate

- **Decisión**:
  - `fecha`: `fechaHora` ascendente.
  - `precio`: `precioDesde` ascendente.
  - `puntaje`: puntaje promedio descendente; los organizadores sin reseñas van al final.
  - Empates: `fechaHora` ascendente y después `id`, para que el orden sea total y el cursor no sea ambiguo.
  Se ordena por el promedio sin redondear; la pantalla muestra un decimal.
- **Motivo**: FR-006 y el edge case de empates. El `id` como último criterio hace que dos eventos nunca tengan la misma clave.

## R6. Búsqueda sin mayúsculas ni tildes

- **Decisión**: se normaliza el texto con `normalize("NFD")`, se quitan las marcas diacríticas (`\p{M}`), se pasa a minúsculas y se recortan los espacios. Coincide si el texto normalizado está contenido en el nombre, la ubicación o el nombre del organizador. Una búsqueda vacía o de solo espacios no filtra. Máximo 100 caracteres (validado con zod).
- **Motivo**: FR-004 y la Assumption de tildes ("galpon" encuentra "Galpón").
- **Alternativas**: búsqueda por palabras o difusa (más de lo que pide el diseño).

## R7. Reseñas: la calificación vive en la compra

- **Decisión**: se agrega el modelo `Compra` con un campo `calificacion` (`{ puntaje, comentario, calificadaEn }` o `null`), como dice el design system ("guardado en la compra"). Una reseña es una compra calificada; su organizador es el del evento de la compra. Esta feature solo lee compras y calificaciones; no hay endpoints para crearlas.
- **Motivo**: la clarificación 1 pide reseñas respaldadas por compras Utilizadas. Modelar `Compra` ahora, aunque sea mínima, evita rehacer los datos cuando lleguen las features de compra y de calificaciones.
- **Alternativas**: una entidad `Resena` suelta (rechazada en la clarificación 1, opción C).

## R8. Puntaje y reseñas escalables: índice por organizador

- **Decisión**: `comprasRepository` mantiene, además del `Map` de compras, un índice por organizador con sus compras calificadas ordenadas de la más reciente a la más antigua y un acumulado `{ suma, cantidad }`. Se actualiza cada vez que se guarda una compra calificada. `resumenDeCalificaciones(organizadorId)` devuelve el acumulado sin recorrer compras, y `listarCalificadas(organizadorId, { despuesDe, limite })` devuelve una página.
- **Motivo**: el puntaje se muestra en cada EventCard y se usa para ordenar (R5). Calcularlo recorriendo todas las compras en cada pedido no escala (SC-007).
- **Alternativas**: calcular en cada pedido (simple pero O(compras) por evento listado); guardar el promedio en el organizador (duplica datos que tiene que mantener otra capa).

## R9. Reseñas paginadas de a 5 por cursor

- **Decisión**: `GET /compradores/organizadores/{id}/resenas?cursor=` devuelve `{ resenas, total, siguiente }` con las 5 siguientes, de la más reciente a la más antigua. La clave es `[calificadaEn, compraId]`. El Detalle del evento incluye el resumen del organizador (`puntaje`, `cantidadResenas`) y la primera página de reseñas, así la pantalla se arma con un solo pedido; **Ver más** pide las siguientes con `siguiente`.
- **Motivo**: FR-024 y el edge case "una reseña nueva no repite ni saltea": las reseñas nuevas quedan antes del cursor, así que no aparecen en las páginas siguientes. Que el Detalle traiga la primera página evita un segundo viaje al abrirlo.
- **Alternativas**: offset (repite una reseña si entra una nueva mientras se pagina).

## R10. Favoritos: PUT y DELETE idempotentes

- **Decisión**: `favoritosRepository` guarda un `Map<compradorId, Map<eventoId, marcadoEn>>`. `PUT /compradores/favoritos/{eventoId}` marca y `DELETE` desmarca; los dos responden `204` aunque ya estuviera en ese estado. `PUT` sobre un evento no visible responde `404 EVENTO_NO_ENCONTRADO` (FR-023); `DELETE` sobre uno que ya no es visible igual lo quita. `GET /compradores/favoritos` devuelve los favoritos visibles ordenados por fecha, sin paginar (Assumption de escalabilidad). El listado y el detalle traen `esFavorito` para el comprador de la sesión.
- **Motivo**: con operaciones idempotentes, varios toques rápidos no duplican ni dejan un estado intermedio (edge case); el último pedido define el estado. Los favoritos de un evento que se oculta quedan guardados pero no se muestran (edge case de Finalizado).
- **Alternativas**: `POST` de alta + `DELETE` (el segundo `POST` necesita un 409 y más manejo en el front); un toggle `POST` (no es idempotente: dos toques rápidos se cancelan de forma impredecible).

## R11. Navegación: pestañas dentro del Stack de compradores

- **Decisión**: Explorar y Favoritos pasan a un grupo `(compradores)/(pestanas)/` con un layout `Tabs` de expo-router y una barra propia `BottomNav` del design system. El Detalle (`(compradores)/eventos/[id].tsx`) es una pantalla del `Stack` que se apila arriba de las pestañas. Las URLs no cambian (`/explorar`, `/favoritos`, `/eventos/evt-1`) porque los grupos no aparecen en la URL. Todo queda dentro del `Stack.Protected guard={!!comprador}`.
- **Motivo**: como Explorar sigue montado debajo del Detalle, al volver conserva búsqueda, chip, orden, lo cargado y el scroll (FR-015), sin guardar ese estado aparte.
- **Alternativas**: dos pantallas sueltas del Stack con una BottomNav dibujada en cada una (al cambiar de pestaña se desmonta Explorar y pierde el estado); guardar los filtros en la URL (más código y no conserva el scroll).

## R12. Lista infinita en el front

- **Decisión**: Explorar usa `FlatList` con `onEndReached` (umbral 0.5) que pide la página siguiente con `siguiente` mientras no haya otro pedido en curso y `siguiente !== null`. Al cambiar búsqueda (con espera de 300 ms), chip u orden, se cancela el pedido anterior (`AbortController`) y se arranca de nuevo sin cursor. Cada respuesta lleva un número de pedido y se descarta si no es la del último criterio (edge case de búsquedas que llegan tarde). Al agregar una página se descartan ids ya presentes (R4). Mientras carga la página siguiente se muestra un `ActivityIndicator` al pie; si falla, se conservan los eventos y se muestra el aviso de conexión con **Reintentar**.
- **Motivo**: FR-025 y los edge cases de Explorar. `FlatList` además virtualiza las filas, así una lista larga no traba el teléfono.
- **Alternativas**: `ScrollView` + `map` (renderiza todo); una librería de "infinite query" (dependencia nueva para un caso que resuelve un hook chico).
- **Impacto**: `pedir()` de `src/api/cliente.ts` suma una opción `signal` para poder cancelar (cambio compatible).

## R13. Estado compartido de favoritos en el front

- **Decisión**: un `FavoritosProvider` (contexto, dentro del lado compradores) guarda un `Map<eventoId, boolean>`. Se alimenta con `esFavorito` de cada respuesta (listado, detalle, favoritos) y expone `esFavorito(id)` y `alternar(id)`. `alternar` cambia el valor al instante (optimista), llama a `PUT` o `DELETE` y, si falla, vuelve al valor anterior y muestra "No pudimos conectarnos. Probá de nuevo en un rato.". Si llegan toques mientras hay un pedido en curso, se manda solo el estado final al terminar.
- **Motivo**: FR-019 pide el mismo estado del corazón en las tres pantallas (SC-006), y el edge case pide revertir si falla.
- **Alternativas**: volver a pedir la lista en cada pantalla (el corazón parpadea y queda desfasado al volver con Atrás).

## R14. Botón Comprar sin acción

- **Decisión**: la EventCard y el ActionFooter del Detalle muestran **Comprar** con el `Button` del design system, habilitado y con `onPress` vacío. En la EventCard, el toque en el botón no se propaga a la tarjeta (no abre el Detalle). Si `agotado` es `true`, muestra **Agotado** con `disabled`.
- **Motivo**: clarificación 2 y FR-009. Evitar la propagación respeta "corazón y Comprar son acciones propias" (design system, EventCard).

## R15. Componentes nuevos del design system

- **Decisión**: se agregan a `src/components/ds/`: `EventCard`, `Chip` (+ fila con scroll horizontal), `SegmentedControl`, `BottomNav`, `AppBar`, `ActionFooter`, `Facts`, `Opiniones` (Rating "para mostrar"), `BotonFavorito`, `ImagenEvento` (con espacio neutro sin imagen), `FavoritoCard` y `EstadoVacio`. Se reutilizan `Tag`, `Button`, `Avatar` y `TextField` (búsqueda). Íconos de `phosphor-react-native` (ya instalado).
- **Motivo**: son los componentes que el design system ya define para Compradores 02, 04 y 11. No se inventan componentes; **Ver más** es un `Button` secundario.
- **Requisito de diseño (Principio I)**: antes de las tareas de front, se documentan en `pantallas.md` (Compradores 02, 04 y 11) los estados que el diseño no tiene: carga de la página siguiente en Explorar, botón **Ver más** en las opiniones, organizador sin reseñas, evento no disponible y error de conexión al cargar más.

## R16. Formatos nuevos

- **Decisión**: `src/lib/formato.ts` suma `fechaLarga` ("Sábado 21 de noviembre"), `hora` ("21:00 h"), `rangoDePrecios` ("$ 12.000 a $ 26.000" o un precio), `puntaje` (un decimal con punto, "4.5", como en el diseño), `estrellas` ("★★★★☆"), `contadorEventos` ("N eventos" / "1 evento") y `contadorResenas` ("N reseñas de eventos anteriores" / "1 reseña de eventos anteriores").
- **Motivo**: FR-012, FR-013 y FR-017. Mantener los formatos en un único módulo, como en la feature 002.

## R17. Datos de ejemplo: compradores, compras y reseñas

- **Decisión**: el seed suma:
  - 4 compradores de ejemplo con la misma contraseña de desarrollo: Martín Pérez, Lucía Fernández, Diego Romero y Valentina Sosa.
  - 1 evento pasado de Club del Chiste para que tenga reseñas: **"Stand-up en el Sótano"**, Comedia, 2026-08-22 21:30, "La Tangente, Palermo", Publicado (se ve Finalizado), General $ 7.000 / 100 / 100, imagen `img-seed-sotano` generada como las de R8 de la feature 002. Queda como `evt-9`.
  - 9 compras Utilizadas y calificadas, con puntajes que dan promedios distintos: La Trama **4.5** (4 reseñas, incluida la de Sofía 4★ para Edipo Rey), Producciones Lumbre **4.0** (2 reseñas de Tango en el Conventillo), Club del Chiste **3.7** (3 reseñas de Stand-up en el Sótano). Detalle en [data-model.md](data-model.md#seed).
  - Sofía arranca sin favoritos.
- **Motivo**: clarificación 1. Con tres puntajes distintos se puede probar el orden por Puntaje (SC-005).
- **Impacto en tests existentes**: el evento nuevo ocupa `evt-9`, así que los tests de la feature 002 que esperan `evt-9` para un evento recién creado pasan a esperar `evt-10`, y "Club del Chiste ve solo los suyos" pasa a esperar `evt-2`, `evt-5` y `evt-9`. Se actualizan en la misma tarea que cambia el seed.
- **Alternativas**: reseñas de Club del Chiste sobre Risas a Domicilio (es un evento futuro: nadie pudo usar la entrada todavía, contradice la regla de calificación).

## R18. Datos derivados en el DTO de comprador

- **Decisión**: `dto/eventoCompradorDto.js` arma lo que necesita la pantalla, sin exponer datos del organizador que no hacen falta (vendidas totales, cupos, material multimedia, estado guardado):
  - Resumen: `precioDesde` (menor precio entre todos los tipos, agotados incluidos), `agotado` (ningún tipo con disponibles > 0), `organizador { id, nombre, puntaje, cantidadResenas }` y `esFavorito`.
  - Detalle: suma `descripcion`, `precioHasta`, `tiposDeEntrada { id, nombre, precio, disponibles }` (para la feature de compra) y `resenas { resenas, siguiente }` con la primera página.
  El `puntaje` viaja con un decimal ya redondeado; el orden usa el valor sin redondear (R5).
- **Motivo**: FR-008, FR-012 a FR-014. Calcular en el servidor asegura que "Desde $ X", el rango y Agotado coincidan en todas las pantallas (SC-005).
- **Autor de la reseña**: el DTO manda `autor` ya armado como "Nombre I." (p. ej. "Sofía G."); nunca el email ni el apellido completo.
