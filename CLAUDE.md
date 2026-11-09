# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Proyecto

"AI Ticket It" es un trabajo práctico individual de la materia Desarrollo de Software: una plataforma de venta de entradas para eventos, con un lado para compradores y otro para organizadores.

## Arquitectura general

- `aiTicketIt-back/`: **backend monolito** en Node.js con Express. Sirve a ambos lados del front. Está organizado por capas (`routes/`, `controllers/`, `services/`, `repository/`, `models/`, `dto/`, `schemas/`, `errors/`, `tests/`).
- `aiTicketIt-front/`: **un único front** en Expo (React Native + TypeScript, con expo-router y rutas basadas en archivos en `src/app/`). Contiene **tanto la página para organizadores como la página para compradores**.
- `Diseño de AI Ticket It/`: wireframes dibujados a mano (`DisenoTpCompradores.png`, `DisenoToOrganizadores.png`). Son la especificación principal. Leerlos antes de construir UI o modelos de dominio.

Los textos de la interfaz y el lenguaje del dominio están en español. Mantener los nombres consistentes con los wireframes (evento, entrada, compra/venta, comprador, organizador, consulta, opinión/calificación).

## Levantar los proyectos

```bash
# Backend
cd aiTicketIt-back
node index.js

# Front
cd aiTicketIt-front
npx expo start
```

El backend escucha en el puerto `PORT` (por defecto 3000). Expone `GET /health`, la documentación Swagger en `/docs` (generada con swagger-jsdoc a partir de comentarios `@openapi` en `index.js` y `routes/*.js`) y la especificación en `/docs.json`. `ALLOWED_ORIGINS` (separados por coma) limita CORS; si no se define, se permite cualquier origen. El backend usa ES modules (`"type": "module"`).

Para el front también existen `npm run android`, `npm run ios`, `npm run web` y `npm run lint` (`expo lint`). Todavía no hay tests configurados en ninguno de los dos proyectos.

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
