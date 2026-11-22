# Data Model: Explorar y detalle de evento (compradores)

Entidades nuevas y vistas derivadas de esta feature. `Evento`, `TipoDeEntrada`, `Organizador`, `Comprador` e `Imagen` ya existen (features 001 y 002) y no cambian de forma. Decisiones en [research.md](research.md).

## Compra (`models/Compra.js`, `repository/comprasRepository.js`) — NUEVA (R7)

Versión mínima: en esta feature solo existen las del seed y solo se leen. La feature de compra suma su creación y sus transiciones.

| Campo | Tipo | Reglas |
|---|---|---|
| `numero` | string | Identificador, formato `A-NNNN` (p. ej. `A-0655`). Único. |
| `compradorId` | string | → `Comprador.id` |
| `eventoId` | string | → `Evento.id` |
| `tipoDeEntradaId` | string | → `TipoDeEntrada.id` del mismo evento. Una compra es de un solo tipo. |
| `cantidad` | entero | ≥ 1 |
| `monto` | entero | Pesos. Precio del tipo al comprar × cantidad. |
| `medioDePago` | enum | `Tarjeta de crédito`, `Tarjeta de débito`, `Mercado Pago`, `Transferencia` |
| `estado` | enum | `Pendiente de pago`, `Confirmada`, `Utilizada`, `Cancelada`, `Reembolsada` (constitución, Principio V) |
| `creadaEn` | ISO 8601 | Fecha de la compra |
| `calificacion` | objeto \| null | Ver abajo. Solo puede existir si `estado = Utilizada`, una vez por compra. |

### Calificacion (dentro de Compra)

| Campo | Tipo | Reglas |
|---|---|---|
| `puntaje` | entero | 1 a 5 |
| `comentario` | string \| null | Hasta 500 caracteres; `null` se muestra "Sin comentario." |
| `calificadaEn` | ISO 8601 | Ordena las reseñas (la más reciente primero) |

Las reglas de crear una calificación (solo Utilizada, una vez) son de la feature de calificaciones; acá se respetan en el seed y en los helpers de tests.

### Índice de calificaciones por organizador (R8)

`comprasRepository` mantiene, por `organizadorId`:

- `calificadas`: lista de `numero` de compras calificadas, ordenada por `[calificadaEn desc, numero desc]`.
- `resumen`: `{ suma, cantidad }` de los puntajes.

El `organizadorId` se toma del evento al guardar la compra (`guardar(compra, { organizadorId })`). Operaciones:

| Operación | Devuelve |
|---|---|
| `guardar(compra, { organizadorId })` | La compra; si está calificada, actualiza el índice y el resumen |
| `buscarPorNumero(numero)` | Compra o `null` |
| `resumenDeCalificaciones(organizadorId)` | `{ suma, cantidad }` (`{ 0, 0 }` si no tiene) |
| `listarCalificadas(organizadorId, { despuesDe, limite })` | Hasta `limite` compras calificadas que siguen a la clave `despuesDe` |
| `reiniciar()` | Vuelve al seed |

## Favorito (`repository/favoritosRepository.js`) — NUEVO (R10)

Relación comprador ↔ evento. No tiene modelo propio: es un par con fecha.

| Campo | Tipo | Reglas |
|---|---|---|
| `compradorId` | string | → `Comprador.id` |
| `eventoId` | string | → `Evento.id`. Único por comprador. |
| `marcadoEn` | ISO 8601 | Fecha en que se marcó |

Almacenamiento: `Map<compradorId, Map<eventoId, marcadoEn>>`. Operaciones: `marcar(compradorId, eventoId, fecha)` (idempotente, conserva la fecha original), `desmarcar(compradorId, eventoId)` (idempotente), `esFavorito(compradorId, eventoId)`, `idsDe(compradorId)`, `reiniciar()` (el seed no tiene favoritos).

Un favorito puede apuntar a un evento que dejó de ser visible: se conserva, pero no se lista ni se marca de nuevo (FR-021, FR-023).

## Relaciones

```text
Organizador 1 ── * Evento 1 ── * TipoDeEntrada
                     │
                     ├── * Compra (de un TipoDeEntrada) ── 0..1 Calificacion
                     │        └── * ── 1 Comprador
                     └── * Favorito * ── 1 Comprador

Reseñas de un organizador = compras calificadas de todos sus eventos.
```

## Valores derivados (`services/`, `dto/eventoCompradorDto.js`)

| Valor | Cálculo | Requisito |
|---|---|---|
| Visible para compradores | `evento.estadoVisible(ahora) === "Publicado"` | FR-001 (R2) |
| `disponibles` de un tipo | `cupo − vendidas` | FR-014 |
| `agotado` | ningún tipo con `disponibles > 0` | FR-014 |
| `precioDesde` / `precioHasta` | mínimo / máximo de `precio` entre todos los tipos | FR-008, FR-012 |
| `organizador.puntaje` | `suma / cantidad` redondeado a 1 decimal; `null` si `cantidad = 0` | FR-013 |
| `organizador.cantidadResenas` | `cantidad` | FR-013 |
| `autor` de una reseña | `"{nombre} {inicial del apellido}."` del comprador | FR-013 |
| `esFavorito` | `favoritosRepository.esFavorito(comprador, evento)` | FR-019 |

## Vistas de comprador (contrato)

Definidas en [contracts/compradores.openapi.yaml](contracts/compradores.openapi.yaml):

- **EventoCompradorResumen**: `id`, `nombre`, `categoria`, `fechaHora`, `ubicacion`, `imagenUrl`, `precioDesde`, `agotado`, `organizador { id, nombre, puntaje, cantidadResenas }`, `esFavorito`.
- **EventoCompradorDetalle**: lo anterior + `descripcion`, `precioHasta`, `tiposDeEntrada [{ id, nombre, precio, disponibles }]`, `resenas { resenas, siguiente }` (primera página).
- **Resena**: `numeroCompra`, `autor`, `puntaje`, `comentario`, `evento { id, nombre }`, `calificadaEn`.
- **PaginaDeEventos**: `eventos`, `total`, `siguiente`. **PaginaDeResenas**: `resenas`, `total`, `siguiente`.

## Validaciones de entrada (`schemas/explorarSchema.js`, solo forma)

| Parámetro | Regla | Error |
|---|---|---|
| `busqueda` | texto opcional, recortado, hasta 100 caracteres | `DATOS_INVALIDOS` "La búsqueda puede tener hasta 100 caracteres" |
| `categoria` | opcional, una de `Teatro`, `Comedia`, `Drama`, `Amor` (sin valor = Todos) | `DATOS_INVALIDOS` "Elegí una categoría válida" |
| `orden` | opcional, `fecha` (por defecto), `precio` o `puntaje` | `DATOS_INVALIDOS` "Elegí un orden válido" |
| `cursor` | opcional, string que decodifica a una clave válida para el orden pedido | `DATOS_INVALIDOS` "El cursor no es válido" |

Se valida `req.query` con un middleware `validarQuery(schema)` hermano de `validar` (mismo formato de error).

## Seed (`repository/seed.js`) {#seed}

Fecha de referencia de los tests: 2026-11-09 (como en las features anteriores). Detalle de las decisiones en R17.

**Compradores nuevos** (contraseña de desarrollo `Entradas2026`, solo hash):

| id | Nombre | Email |
|---|---|---|
| `cmp-2` | Martín Pérez | `martin.perez@correo.com` |
| `cmp-3` | Lucía Fernández | `lucia.fernandez@correo.com` |
| `cmp-4` | Diego Romero | `diego.romero@correo.com` |
| `cmp-5` | Valentina Sosa | `valentina.sosa@correo.com` |

**Evento nuevo**: `evt-9` Stand-up en el Sótano · Comedia · 2026-08-22T21:30-03:00 · La Tangente, Palermo · Club del Chiste (`org-2`) · Publicado (se ve Finalizado) · `tip-14` General $ 7.000 / cupo 100 / 100 vendidas · imagen `img-seed-sotano`.

**Compras calificadas** (todas `Utilizada`, `cantidad` 1 salvo donde se indica):

| Número | Comprador | Evento (organizador) | Tipo · monto · medio | Calificada | ★ | Comentario |
|---|---|---|---|---|---|---|
| A-0655 | Sofía G. | Edipo Rey (La Trama) | General · $ 10.000 · débito | 2026-09-13 | 4 | "Muy buena puesta, el final te deja pensando." |
| A-0612 | Martín P. | Edipo Rey (La Trama) | General ×2 · $ 20.000 · crédito | 2026-09-14 | 5 | "Impecable. Los actores muy cerca del público." |
| A-0618 | Lucía F. | Edipo Rey (La Trama) | General · $ 10.000 · Mercado Pago | 2026-09-15 | 5 | `null` |
| A-0631 | Diego R. | Edipo Rey (La Trama) | General · $ 10.000 · transferencia | 2026-09-20 | 4 | "Buena, aunque la sala hacía mucho frío." |
| A-0820 | Lucía F. | Tango en el Conventillo (Lumbre) | General ×2 · $ 20.000 · crédito | 2026-10-19 | 4 | "Hermosa ambientación del conventillo." |
| A-0834 | Valentina S. | Tango en el Conventillo (Lumbre) | General · $ 10.000 · débito | 2026-10-21 | 4 | `null` |
| A-0540 | Martín P. | Stand-up en el Sótano (Club del Chiste) | General · $ 7.000 · Mercado Pago | 2026-08-23 | 3 | "Algunos chistes funcionaron, otros no tanto." |
| A-0547 | Diego R. | Stand-up en el Sótano (Club del Chiste) | General · $ 7.000 · crédito | 2026-08-24 | 4 | "Me reí mucho con el segundo comediante." |
| A-0559 | Valentina S. | Stand-up en el Sótano (Club del Chiste) | General ×2 · $ 14.000 · débito | 2026-08-25 | 4 | `null` |

Resultado: La Trama **4.5** (4 reseñas), Producciones Lumbre **4.0** (2), Club del Chiste **3.7** (3). Orden por Puntaje en Explorar: La Trama (Hamlet, Bodas de sangre), Lumbre (Cartas a Julieta), Club del Chiste (Risas a Domicilio, Impro Express); dentro de cada organizador, por fecha.

Las demás compras de Sofía de `pantallas.md` (A-1042, A-1037, A-0871, A-0790) no se cargan en esta feature: no tienen calificación y pertenecen a la feature de Mis compras. Las `vendidas` de los tipos de entrada siguen siendo las del seed de la feature 002 (no se recalculan desde las compras).

**Favoritos**: ninguno.
