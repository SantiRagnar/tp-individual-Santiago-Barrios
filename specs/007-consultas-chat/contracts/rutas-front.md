# Contrato del front: Consultas

Las rutas nuevas van dentro del `Stack.Protected` de su lado. Las llamadas pasan `token` y `tipo` a `pedir()`, así que un 401 `SESION_INVALIDA` borra la sesión y vuelve al Ingreso (FR-015 de la feature 001). Los endpoints están en [consultas.openapi.yaml](consultas.openapi.yaml).

## Rutas

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/compras/[numero]/consulta` | `(compradores)/compras/[numero]/consulta.tsx` (nueva) | Compradores 10 · Chat de la compra | `GET /compradores/compras/{numero}` (cabecera), `GET`/`POST …/mensajes`, `PUT …/mensajes/lectura` |
| `/organizadores/eventos/[id]/consultas?compra=A-1042` | `organizadores/eventos/[id]/consultas.tsx` (nueva) | Organizadores 05 · Consultas del evento | `GET /organizadores/eventos/{id}` (nombre), `GET …/consultas`, `GET …/consultas/{numero}`, `POST …/mensajes`, `PUT …/lectura` |

Hay que registrar las dos en su `_layout.tsx`. Después de agregarlas, correr `npx expo start` una vez para regenerar `.expo/types` (typedRoutes).

## Navegación

| Desde | Acción | Hacia |
|---|---|---|
| Detalle de compra | **Tengo una consulta** | Chat de la compra (`push`) |
| Chat de la compra | Volver | Detalle de compra (`back`, o `replace` a `/compras/{numero}` si no hay historial) |
| Toast de una compra | tocar | Chat de esa compra (`push`) |
| Toast "Tenés N mensajes nuevos" | tocar | Mis compras (`push`) |
| Panel del evento | **Consultas del evento {n}** | Consultas del evento, sin conversación elegida |
| Panel del evento, fila de Ventas | botón ícono de chat | Consultas del evento con `?compra={numero}` (queda abierta y leída) |
| Consultas del evento | Volver | Panel del evento |
| Consultas del evento | clic en una conversación | Misma pantalla, actualiza `?compra=` con `router.setParams` |

## Compradores 10 · Chat de la compra

- **AppBar** con Volver; título = nombre del evento; subtítulo = "{organizador} · Compra #{número}". Mientras carga: `PantallaCargando`.
- **Mensajes** (`ChatMensajes`):
  - Burbujas propias (`autor === "comprador"`) a la derecha en `accent-800`; las del organizador a la izquierda en `surface`.
  - `radius-lg`, ancho máximo 78%, hora debajo en 10px muted (`horaDeMensaje`).
  - El texto respeta los saltos de línea.
  - Al abrir, la vista va al último mensaje. Con mensajes nuevos, baja solo si el usuario ya estaba al final.
- **Vacío**: "Todavía no hay mensajes — Escribí tu consulta y {organizador} te va a responder acá." (`EstadoVacio`).
- **Compositor fijo abajo** (`CompositorChat`, variante mobile):
  - Input redondeado de 44px con placeholder "Escribí tu consulta" y botón enviar circular primario con `accessibilityLabel` "Enviar".
  - Deshabilitado si el texto recortado está vacío o se está enviando.
  - Contador "N/1000" desde 900 caracteres; `maxLength` 1000.
  - Respeta el teclado (`KeyboardAvoidingView`) y el safe area inferior.
- **Al enviar**:
  - OK: agrega el mensaje que devuelve la API y vacía el compositor.
  - Error de red: deja el texto y muestra "No pudimos conectarnos. Probá de nuevo en un rato." arriba del compositor.
- **Al enfocarse**: carga los mensajes, `PUT lectura` y arranca el sondeo cada 3 s con `despuesDe` (`useSondeo`). Si llegan mensajes del organizador, `PUT lectura`. Al perder el foco, el sondeo se detiene.
- **Compra ajena o inexistente**: AppBar con Volver, "No encontramos esta compra." y **Volver a Mis compras** (secundario), como el Detalle de compra.
- **Error al abrir**: `PantallaDeAviso` con `SIN_CONEXION` + **Reintentar**. Los errores del sondeo no muestran nada (se reintenta solo).

## Cambios en pantallas existentes (comprador)

- **Detalle de compra** (`compras/[numero]/index.tsx`): **Tengo una consulta** navega al chat. Si `compra.consultaNoLeida`, el botón muestra el `dot-unread`. La pantalla se recarga cuando cambia la `version` de `useAvisosDeConsultas()`.
- **Mis compras** (`mis-compras.tsx` + `PurchaseCard`): el punto de no leído arriba a la derecha de la tarjeta si `consultaNoLeida` (también en Cancelada/Reembolsada, sin la opacidad del 40%). Se recarga con la `version`.
- **Layout** (`(compradores)/_layout.tsx`): suma `compras/[numero]/consulta` y monta `AvisosDeConsultasProvider` (con `key` por comprador), que muestra el `Toast`.

## Toast (componente nuevo del design system)

- Arriba, debajo del safe area, con margen `pad-page` y ancho máximo 390. Tarjeta `surface`, `shadow-lg`, `radius-lg`; ícono de chat en `accent`; título `type-body-sm` 500; segunda línea `type-caption` muted.
- Una compra: "Nuevo mensaje de {organizador}" / "{evento} · Compra #{número}". Varias: "Tenés N mensajes nuevos" / "Tocá para ver tus compras".
- Todo el toast es un `Pressable` con `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"`. Desaparece a los 5 s; uno nuevo reemplaza al anterior.
- No aparece si el chat de esa compra está abierto (`usePathname()`).

## Organizadores 05 · Consultas del evento

Layout desktop: DesktopNav → `page-head` (Volver, "Consultas del evento" con el nombre del evento debajo en muted) → dos columnas con `gap-grid`.

- **Columna izquierda, 380px** (`ListaConversaciones`). Una fila por `consultas[]`:
  - Avatar de 38px `neutral-800` con `iniciales(comprador.nombre)`, nombre (500) y hora del último mensaje a la derecha (`horaDeMensaje`, muted).
  - Debajo, "Compra #{número} · {tipo} × {cantidad}" (caption muted) y el último mensaje en una línea con `numberOfLines={1}`.
  - `dot-unread` si `noLeida`.
  - Seleccionada: `aria-current="true"`, fondo `surface` + `shadow-sm`.
- **Panel derecho**:
  - Sin elegir: "Elegí una conversación para ver los mensajes.".
  - Elegida:
    - Cabecera con nombre del comprador, "Compra #{número} · {tipo} × {cantidad} · $ {monto}" y `TagCompra`.
    - `ChatMensajes`: los del organizador a la derecha.
    - Sin mensajes: "Todavía no hay mensajes con {comprador}.".
    - `CompositorChat` variante desktop: input "Responder a {comprador}" + **Enviar** (primario). Enter envía y Shift+Enter agrega un salto de línea.
- **Sin ninguna conversación** y sin `?compra`: "Todavía no hay consultas — Cuando un comprador escriba, vas a verla acá." en lugar de las dos columnas.
- **Al elegir una conversación** (o al entrar con `?compra`): `GET …/consultas/{numero}` y `PUT lectura`.
- **Sondeo cada 3 s**, solo con la pantalla enfocada:
  - `GET …/consultas` para la lista y los puntos.
  - `GET …/consultas/{numero}?despuesDe=` para la conversación abierta y su Tag.
  - Si llegan mensajes del comprador a la conversación abierta: `PUT lectura`.
- **Al enviar**: el mensaje se agrega y la conversación sube primera en la lista (se actualiza con la respuesta y el próximo sondeo). Con error, el texto queda y se muestra el aviso de conexión.
- **Error al abrir** (evento o lista): `PantallaDeAviso` con `SIN_CONEXION` + **Reintentar**. Los errores del sondeo no muestran nada.
- **Evento ajeno o inexistente**: "No encontramos el evento." + link a **Mis eventos**. Un `?compra=` que no es de ese evento muestra la pantalla sin conversación elegida.

## Cambios en pantallas existentes (organizador)

- **Panel del evento** (`eventos/[id]/index.tsx`):
  - **Consultas del evento** se habilita y muestra `tag-count` con `noLeidas` cuando es > 0. El dato sale de `GET …/consultas`, que se pide al enfocarse.
  - En `TablaVentas`, la columna Acciones suma un botón ícono de chat de 30px (`ChatCircle`) con `accessibilityLabel` "Consultas de la compra #{número}", en todas las filas, a la derecha de **Marcar utilizada**.
