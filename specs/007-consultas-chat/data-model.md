# Data Model: Consultas (chat de la compra)

**Feature**: [spec.md](spec.md) · **Research**: [research.md](research.md)

Persistencia en memoria detrás de `repository/` (constitución). Las entidades existentes (Compra, Evento, Comprador, Organizador) no cambian de forma. Solo se agrega un campo calculado al DTO de compra (R6).

---

> **Vocabulario (Principio V):** en el código, los modelos, los endpoints y los DTOs, la entidad se llama siempre **Consulta** (`Consulta`, `ConsultaResumen`, `consulta`). "Conversación" es solo cómo se la nombra en textos de la interfaz y en la spec; no se usa como nombre de código.

## Consulta *(nueva, `models/Consulta.js`)*

Es la conversación de una compra entre su comprador y el organizador del evento (FR-001).

| Campo | Tipo | Regla |
|---|---|---|
| `compraNumero` | string (`A-NNNN`) | Identidad: una consulta por compra. Referencia a `Compra.numero`. |
| `eventoId` | string | Copia de `Compra.eventoId`, para el índice por evento (R1). |
| `mensajes` | `Mensaje[]` | En orden de envío (cronológico). Nunca se editan ni se borran (FR-002). |
| `vistosPorOrganizador` | entero ≥ 0 | Cuántos mensajes había cuando el organizador la abrió por última vez (R2). |
| `vistosPorComprador` | entero ≥ 0 | Lo mismo para el comprador. |

**Existencia**: la consulta se crea al primer mensaje. Una compra sin consulta guardada equivale a `{ mensajes: [], vistosPorOrganizador: 0, vistosPorComprador: 0 }` (R1).

**Reglas derivadas** (`services/reglasConsulta.js`):

- `ultimoMensaje(consulta)` = `mensajes.at(-1) ?? null`.
- `noLeidaPara(consulta, "organizador")` = `ultimo?.autor === "comprador" && vistosPorOrganizador < mensajes.length` (FR-015).
- `noLeidaPara(consulta, "comprador")` = `ultimo?.autor === "organizador" && vistosPorComprador < mensajes.length` (FR-022).

**Transiciones**:

| Acción | Efecto |
|---|---|
| Comprador envía | Agrega un mensaje con `autor: "comprador"`; `vistosPorComprador = mensajes.length`. La consulta queda no leída para el organizador (US3, escenario 3). |
| Organizador envía | Agrega un mensaje con `autor: "organizador"`; `vistosPorOrganizador = mensajes.length`. Queda no leída para el comprador. |
| Organizador abre (`PUT …/lectura`) | `vistosPorOrganizador = mensajes.length` (FR-016). Si no tiene mensajes, no hace nada (no crea la consulta). |
| Comprador abre (`PUT …/lectura`) | `vistosPorComprador = mensajes.length` (FR-022). |

La consulta no depende del estado de la compra ni del evento: se puede escribir con la compra en cualquier estado (FR-004).

## Mensaje *(nueva, en `models/Consulta.js`)*

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string `msj-{n}` | Contador global del repositorio. Cursor de `despuesDe` (R8). |
| `autor` | `"comprador"` \| `"organizador"` | Lo fija el servidor según la sesión; nunca viene del body. |
| `texto` | string | Recortado; de 1 a 1000 caracteres; conserva los saltos de línea internos (FR-002, R7). |
| `enviadoEn` | string ISO 8601 | `ahora()` del reloj inyectable al enviar. |

## Repositorio `consultasRepository` *(nuevo)*

| Función | Descripción |
|---|---|
| `buscar(compraNumero)` | `Consulta` o `null`. |
| `agregarMensaje({ compraNumero, eventoId, autor, texto, enviadoEn })` | Crea la consulta si no existe, agrega el mensaje con id nuevo, actualiza `vistosPor{autor}` y el índice por evento. Devuelve `{ consulta, mensaje }`. |
| `marcarVista(compraNumero, parte)` | `vistosPor{parte} = mensajes.length`; sin consulta, no hace nada. |
| `mensajesDespuesDe(compraNumero, mensajeId \| null)` | Los mensajes posteriores a ese id (todos si es `null`); `undefined` si el id no pertenece a la consulta. |
| `delEvento(eventoId)` | Consultas con al menos un mensaje de ese evento (índice `eventoId → Set<numero>`). |
| `reiniciar()` | Vacía todo, vuelve el contador a 0 y carga `consultasSeed` (copias con `structuredClone`). Se llama desde `reiniciarRepositorios()`. |

## Vistas (DTOs)

Ver los schemas en [contracts/consultas.openapi.yaml](contracts/consultas.openapi.yaml).

- **Mensaje** (`dto/consultaDto.js` → `aMensajeDto`): `{ id, autor, texto, enviadoEn }`. El front decide izquierda o derecha comparando `autor` con su propio tipo de cuenta.
- **ConsultaResumen** (fila de la lista y cabecera del organizador):
  - Campos: `{ numero, comprador: { nombre }, tipoDeEntrada: { nombre }, cantidad, monto, estado, ultimoMensaje: Mensaje | null, noLeida }`.
  - `comprador.nombre` usa la misma regla que `aVentaDto`: nombre y apellido, o el email si faltan.
  - Las iniciales del avatar las calcula el front con `iniciales()`.
- **ConsultaNoLeida** (para el toast): `{ numero, evento: { id, nombre }, organizador: { nombre }, ultimoMensaje: Mensaje }`.
- **Compra** (feature 004, `aCompraDto`): suma `consultaNoLeida: boolean` = `noLeidaPara(consulta, "comprador")` (FR-023).

## Errores

No hay errores de dominio nuevos. Se reusan:

| Situación | Error |
|---|---|
| Compra ajena o inexistente (comprador) | 404 `COMPRA_NO_ENCONTRADA` |
| Evento ajeno o inexistente (organizador) | 404 `EVENTO_NO_ENCONTRADO` |
| Compra que no es de ese evento (organizador) | 404 `COMPRA_NO_ENCONTRADA` |
| Texto vacío o de más de 1000 caracteres; `despuesDe` desconocido | 400 `DATOS_INVALIDOS` con `campos` |
| Sin sesión o sesión del otro tipo | 401 `SESION_INVALIDA` |

Orden de verificación del organizador: evento propio → compra de ese evento → validación del cuerpo (igual que `marcarUtilizada`).

## Seed (`consultasSeed` en `repository/seed.js`, FR-018)

Mensajes con fechas anteriores al "hoy" de los tests (2026-11-09) y **nunca anteriores a la creación de su compra** (`Mensaje.enviadoEn` ≥ `Compra.creadaEn`). Para las compras generadas, las fechas se calculan a partir de su `creadaEn` (p. ej. +1 h y +5 h), sin pasarse del 2026-11-08 23:59:

| Compra | Evento · organizador | Mensajes | Estado de lectura |
|---|---|---|---|
| A-1042 (Sofía) | Hamlet · La Trama | comprador → organizador → **comprador** ("¿Se puede entrar con cochecito?") | **No leída** para el organizador; leída para Sofía. |
| A-1037 (Sofía) | Risas · Club del Chiste | comprador → **organizador** ("Sí, podés pagar en la boletería hasta una hora antes.") | **No leída** para Sofía (punto en Mis compras). |
| 1.ª compra generada de Hamlet de `cmp-6` | Hamlet · La Trama | comprador → **organizador** (su último mensaje tiene que ser anterior al último de A-1042, así queda después en la lista) | Leída por los dos. |
| 1.ª compra generada de Bodas de sangre de `cmp-7` | Bodas · La Trama | **comprador** | **No leída** para el organizador. |

Las compras generadas se eligen en el seed por evento y comprador sobre `comprasSeed`, no por número fijo: así no se rompen si cambia el generador. Con esto, en el panel de Hamlet el botón muestra 1 y en el de Bodas muestra 1.
