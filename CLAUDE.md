# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Proyecto

"AI Ticket It" es un trabajo práctico individual de la materia Desarrollo de Software: una plataforma de venta de entradas para eventos, con un lado para compradores y otro para organizadores.

## Arquitectura general

- `aiTicketIt-back/`: **backend monolito** en Node.js con Express. Sirve a ambos lados del front. Está organizado por capas (`routes/`, `controllers/`, `services/`, `repository/`, `models/`, `dto/`, `schemas/`, `errors/`, `tests/`). La **persistencia es en memoria** (lo exige el enunciado): los datos viven en `repository/`, se cargan desde un seed al iniciar y se pierden al reiniciar. No hay base de datos externa.
- `aiTicketIt-front/`: **un único front** en Expo (React Native + TypeScript, con expo-router y rutas basadas en archivos en `src/app/`). Contiene **tanto la página para organizadores como la página para compradores**.
- `Diseño de AI Ticket It/`: wireframes dibujados a mano (`DisenoTpCompradores.png`, `DisenoToOrganizadores.png`). Son la especificación principal. Leerlos antes de construir UI o modelos de dominio.

Los textos de la interfaz y el lenguaje del dominio están en español. Mantener los nombres consistentes con los wireframes (evento, entrada, compra/venta, comprador, organizador, consulta, opinión/calificación).

## Levantar los proyectos

```bash
# Backend
cd aiTicketIt-back
npm start          # node index.js
npm test           # node --test (node:test + supertest)

# Front
cd aiTicketIt-front
npx expo start
```

El backend escucha en el puerto `PORT` (por defecto 3000). Expone `GET /health`, la documentación Swagger en `/docs` (generada con swagger-jsdoc a partir de comentarios `@openapi` en `app.js` y `routes/*.js`) y la especificación en `/docs.json`. `ALLOWED_ORIGINS` (separados por coma) limita CORS; si no se define, se permite cualquier origen. El backend usa ES modules (`"type": "module"`). `app.js` arma la app sin escuchar (para supertest) e `index.js` carga el seed y hace `listen`. `FECHA_SIMULADA` (ISO 8601, p. ej. `FECHA_SIMULADA=2026-11-09T12:00:00-03:00 npm start`) fija "hoy" para validar a mano con las fechas del seed (`fijarAhoraDesdeEntorno` en `services/reloj.js`); un valor inválido corta el arranque.

**Endpoints de eventos (feature 002):** `GET/POST /organizadores/eventos`, `GET/PUT /organizadores/eventos/:id` (solo los del organizador con sesión; uno ajeno responde 404), `POST /organizadores/imagenes` (archivo crudo JPG/PNG hasta 5 MB) y `GET /imagenes/:id` (público). El evento guarda `estado` Borrador o Publicado; Finalizado se deriva de la fecha con `services/reloj.js` (`ahora()`). Las reglas para publicar y las de ventas viven en `services/reglasEvento.js` (el front las replica en `src/lib/validacionEvento.ts`). Las imágenes del seed están en `repository/imagenes-seed/` con ids `img-seed-*`.

**Endpoints de compradores (feature 003):** `GET /compradores/eventos` (Explorar: `busqueda`, `categoria`, `orden=fecha|precio|puntaje`, `cursor`; devuelve `{ eventos, total, siguiente }` de a 10), `GET /compradores/eventos/:id` (Detalle con la primera página de reseñas), `GET /compradores/organizadores/:id/resenas?cursor=` (de a 5, "Ver más") y `GET /compradores/favoritos`, `PUT`/`DELETE /compradores/favoritos/:eventoId` (idempotentes, 204). Solo se exponen eventos visibles: Publicados con fecha futura (`services/visibilidadEvento.js`); uno oculto responde 404 igual que uno inexistente. La paginación es por cursor opaco (`services/cursor.js`), no por offset. Los parámetros de la URL se validan con `validarQuery(schema)`. Las calificaciones viven en `Compra.calificacion` (`models/Compra.js`); `comprasRepository` mantiene por organizador las compras calificadas ordenadas y el acumulado del puntaje.

**Endpoints de compras (feature 004):** `POST /compradores/compras` (pagar, simulado: crea una compra Confirmada con número `A-NNNN` y suma a `vendidas`), `GET /compradores/compras` (Mis compras, la más nueva primero, sin paginar), `GET /compradores/compras/:numero`, `POST /compradores/compras/:numero/pago` (Completar pago: Pendiente de pago → Confirmada) y `POST /compradores/compras/:numero/cancelacion` (Confirmada → Reembolsada, Pendiente → Cancelada; libera lugares). Una compra ajena responde 404 igual que una inexistente. **Concurrencia:** `comprar`, `completarPago` y `cancelar` de `services/comprasService.js` son sincrónicas; no agregar `await` entre verificar (visibilidad, precio, lugares, estado) y escribir: eso es lo que evita sobrevender (`tests/integration/concurrencia.test.js`). El body trae `precioUnitario` (el que vio el comprador); si cambió o el tipo no existe → 409 `PRECIO_CAMBIADO`; sin lugares → 409 `LUGARES_INSUFICIENTES`. La compra guarda una copia del tipo (`tipoDeEntradaNombre`, `precioUnitario`). Las acciones permitidas, la nota de por qué no se puede cancelar y la cuenta regresiva las calcula `services/reglasCompra.js` y viajan en el DTO (`acciones`, `motivoNoCancelable`, `diasParaEvento`); el front no las recalcula.

**Endpoints del panel del evento (feature 005):** `GET /organizadores/eventos/:id/ventas?estado=&cursor=` devuelve `{ resumen, ventas, siguiente }`. `resumen` trae `recaudado`, `entradasVendidas`, `comprasActivas` y `porEstado`, y es siempre del evento completo. `ventas` viene de a 20, de la más reciente a la más antigua, con cursor `[creadaEn, numero]`. `estado` usa el nombre exacto ("Pendiente de pago", …). `POST /organizadores/eventos/:id/ventas/:numero/utilizacion` pasa una compra Confirmada a Utilizada y devuelve `{ venta, resumen }`: 409 `COMPRA_NO_CONFIRMADA` / `EVENTO_NO_COMENZO`, 404 `COMPRA_NO_ENCONTRADA`. Solo se puede marcar desde las 00:00 (hora de Argentina, UTC−3 fijo) del día del evento; la regla vive en `services/reglasVenta.js` y el servidor la expone por fila en `acciones.marcarUtilizada`. `comprasRepository` mantiene un índice de compras por evento (`listarPorEvento`, `todasDelEvento`). El seed completa con `generarVentasDeEjemplo` (en `repository/seed.js`) compras que suman exactamente las `vendidas` de cada tipo, con los compradores de ejemplo `cmp-6` a `cmp-15`.

**Tests del backend:** `node:test` + `node:assert/strict` + supertest. Unitarios en `tests/unit/`, de integración en `tests/integration/` (un archivo por historia). Cada test arranca con `reiniciarEstado()` (`tests/helpers/estado.js`; `tests/helpers/compradores.js` crea eventos visibles y compras calificadas extra para probar paginación; `tests/helpers/compras.js` crea eventos con cupo chico y bodies de compra), que también vuelve al reloj real; los tests que dependen de "hoy" llaman a `fijarAhora(HOY)` (2026-11-09, `tests/helpers/sesion.js`, junto con `tokenDeOrganizador(email)`). La validación de entrada usa zod en `schemas/` y el middleware `validar(schema)`; los errores salen siempre como `{ error: { codigo, mensaje, campos? } }` (subclases de `ErrorDeDominio` en `errors/`).

**Cuentas de ejemplo:** contraseña de desarrollo `Entradas2026` para `sofia.gomez@correo.com` (comprador; además `martin.perez@`, `lucia.fernandez@`, `diego.romero@` y `valentina.sosa@correo.com`, autores de las reseñas de ejemplo) y `produccion@latrama.com.ar`, `hola@clubdelchiste.com.ar`, `contacto@lumbre.com.ar` (organizadores). El seed guarda solo hashes scrypt.

Para el front también existen `npm run android`, `npm run ios`, `npm run web`, `npm run lint` (`expo lint`) y `npx tsc --noEmit`. El front no tiene tests automáticos. `EXPO_PUBLIC_API_URL` define la URL del backend (por defecto `http://localhost:3000`; en un dispositivo físico, la IP de la máquina en la red local).

**Estructura del front:** `src/app/(compradores)/` es la app de compradores (`/` = Ingreso; pestañas `(pestanas)/explorar` y `(pestanas)/favoritos` con `BottomNav`; `/eventos/[id]` = Detalle, apilado sobre las pestañas; flujo de compra `/eventos/[id]/entradas` → `/eventos/[id]/pago` → `/compras/[numero]/confirmada` (al pagar, `dismiss(2)` + `push`: Volver nunca regresa al flujo); `/mis-compras` y `/compras/[numero]` (Detalle de compra), a los que se llega desde el Menú de perfil (`BottomSheet` + `MenuPerfil`, abierto por el Avatar de Explorar); `FavoritosProvider` en `src/favoritos/` comparte el corazón entre pantallas y `src/hooks/useListaPaginada.ts` maneja la carga por cursor) y `src/app/organizadores/` el panel (`/organizadores` = Ingreso, `/organizadores/mis-eventos`, `/organizadores/eventos/nuevo`, `/organizadores/eventos/[id]` = Detalle mínimo y `/organizadores/eventos/[id]/editar`). Crear y Editar usan el mismo `FormularioEvento`. Los componentes con variante web (`Select`, `CampoFechaHora`, `Dropzone`) tienen un archivo `.web.tsx`. Con `typedRoutes`, después de agregar una ruta hay que correr `npx expo start` una vez para regenerar `.expo/types` antes de `npx tsc --noEmit`. Además: `src/api/` (cliente HTTP y llamadas), `src/sesion/` (`SesionProvider` y almacenamiento de la sesión: secure-store en nativo, localStorage en web), `src/theme/tokens.ts` (tokens del design system) y `src/components/ds/` (componentes del design system). El panel del evento (`/organizadores/eventos/[id]`) usa `StatCard`, `DisponibilidadTipo`, `TablaVentas`, `TagCompra` (el mismo tag de estado que Mis compras) y `src/api/ventas.ts`; la tabla carga con `useListaPaginada` y **Ver más**.

**Convenciones de sesión (FR-015):** todo endpoint que necesite un usuario usa el middleware `requiereSesion(tipo)` (`"comprador"` u `"organizador"`), que deja `req.sesion = { tipo, usuario, token }`. Toda pantalla interna nueva va dentro del `Stack.Protected` de su lado (`(compradores)/_layout.tsx` u `organizadores/_layout.tsx`), y las llamadas autenticadas pasan `token` y `tipo` a `pedir()` para que un 401 `SESION_INVALIDA` borre la sesión.

## Branches

Los branches siguen el formato `{TipoDeDesarrollo}/{nombre-de-desarrollo}`:

- `TipoDeDesarrollo` es uno de `Feature`, `Fix` o `HotFix`.
- `nombre-de-desarrollo` va en kebab-case.

Ejemplos: `Feature/crear-evento`, `Fix/calculo-cupo-entradas`, `HotFix/login-google`.

## Alcance funcional (según los wireframes)

**Lado Compradores (pensado para mobile):**
- Login con email y contraseña, además de "Ingresar con Google" e "Ingresar con Apple".
- Explorar: búsqueda de eventos, filtros por categoría (Teatro, Comedia, Drama, Amor…), tarjetas de evento (título, imagen, descripción, Comprar) y pestañas inferiores Explorar / Favoritos.
- Detalle del evento: descripción (horario, precio, ubicación), opiniones sobre el organizador, Comprar → proceso de pago → pantalla de éxito.
- Menú lateral: Mi Perfil, Mis compras.
- Mis Compras: lista de compras (evento, horario, fecha, estado). El detalle de una compra tiene "Tengo una consulta", que abre un chat con el organizador.
- Después del evento, un pedido de calificación: "¿Cómo fue tu experiencia en {Evento}?" con puntaje de 1 a 5, comentario y botón Calificar. Estas calificaciones alimentan las opiniones sobre el organizador.

**Lado Organizaciones (pensado para desktop/web):**
- Login (solo email y contraseña).
- Mis Eventos: grilla de tarjetas de evento (imagen, nombre, fecha, estado) y botón Crear evento.
- Crear/editar evento: imagen, descripción, fecha y hora, tipo de material multimedia (p. ej. "Pantalla") y una lista variable de tipos de entrada (Entradas: nombre, cupo, precio). Un panel lateral muestra una vista previa de cómo verá el evento el comprador.
- Panel del evento: barras de vendidas vs. cupo por tipo de entrada, tabla de ventas (número, comprador, estado, medio de pago, monto), Editar evento y "Consultas del evento ({cant})".
- Consultas: lista de conversaciones con compradores, con un panel de chat para cada una.

## Conceptos de dominio transversales

El backend debe modelar estas entidades compartidas: usuarios (compradores y organizadores, con flujos de autenticación separados; OAuth solo para compradores), eventos (con categoría y estado), tipos de entrada con cupo y precio, compras/ventas (estado, medio de pago, monto), hilos de chat comprador↔organizador asociados a un evento/compra, y calificaciones al organizador asociadas a un evento al que se asistió.
