# Data Model: Compra, pago simulado y Mis compras

Cambios sobre las entidades existentes. `Evento`, `TipoDeEntrada`, `Comprador` y `Organizador` no cambian de forma. `Compra` (feature 003) suma campos, operaciones y transiciones. Decisiones en [research.md](research.md).

## Compra (`models/Compra.js`, `repository/comprasRepository.js`)

| Campo | Tipo | Reglas | Nuevo |
|---|---|---|---|
| `numero` | string | `A-` + al menos 4 dígitos. Único. Las compras nuevas continúan después del mayor existente (R8). | |
| `compradorId` | string | → `Comprador.id`. Solo el dueño la ve y la opera. | |
| `eventoId` | string | → `Evento.id` | |
| `tipoDeEntradaId` | string | → `TipoDeEntrada.id` del mismo evento al momento de comprar | |
| `tipoDeEntradaNombre` | string | Copia del nombre del tipo al pagar (R6) | ✅ |
| `precioUnitario` | entero ≥ 0 | Copia del precio del tipo al pagar; igual al `precioUnitario` que envió el comprador (R3) | ✅ |
| `cantidad` | entero | 1 a 10 por compra (FR-005); no hay tope por comprador | |
| `monto` | entero | `precioUnitario × cantidad`, calculado en el servidor | |
| `medioDePago` | enum | `Tarjeta de crédito`, `Tarjeta de débito`, `Mercado Pago`, `Transferencia` | |
| `estado` | enum | `Pendiente de pago`, `Confirmada`, `Utilizada`, `Cancelada`, `Reembolsada` | |
| `creadaEn` | ISO 8601 | Momento del pago, según `ahora()`; ordena Mis compras | |
| `calificacion` | objeto \| null | Solo lectura en esta feature (feature 003) | |

Para las compras del seed, `tipoDeEntradaNombre` y `precioUnitario` se completan en `reiniciar()` a partir del evento del seed (`precioUnitario = monto / cantidad`), así que no hace falta repetirlos en cada fila.

### Transiciones de estado (`services/reglasCompra.js`)

```text
                 Completar pago (comprador, evento futuro)
 Pendiente de pago ─────────────────────────────► Confirmada ──► Utilizada   (organizador, otra feature)
        │                                             │
        │ Cancelar (evento futuro)                    │ Cancelar (evento futuro)
        ▼                                             ▼
    Cancelada                                    Reembolsada
  (libera lugares)                             (libera lugares)

 Pagar $ X (Compradores 06) ──► crea directamente en Confirmada (ocupa lugares)
```

| Acción | Precondición | Efecto | Error si no |
|---|---|---|---|
| Comprar | Evento visible; tipo existe con `precio === precioUnitario`; `cantidad ≤ cupo − vendidas` | Nueva compra Confirmada; `tipo.vendidas += cantidad` | 404 `EVENTO_NO_ENCONTRADO` / 409 `PRECIO_CAMBIADO` / 409 `LUGARES_INSUFICIENTES` |
| Completar pago | Del comprador; `Pendiente de pago`; `fechaHora > ahora` | `estado = Confirmada`; lugares sin cambio | 404 `COMPRA_NO_ENCONTRADA` / 409 `PAGO_NO_PERMITIDO` |
| Cancelar | Del comprador; `Pendiente de pago` o `Confirmada`; `fechaHora > ahora` | Pendiente → `Cancelada`, Confirmada → `Reembolsada`; `tipo.vendidas −= cantidad` | 404 `COMPRA_NO_ENCONTRADA` / 409 `CANCELACION_NO_PERMITIDA` |

Las tres acciones son sincrónicas, sin `await` entre la verificación y la escritura (R2).

### Valores derivados (`services/reglasCompra.js`, `dto/compraDto.js`)

| Valor | Cálculo | Requisito |
|---|---|---|
| `diasParaEvento` | `ceil((fechaHora − ahora) / 86.400.000 ms)` si está Confirmada y `fechaHora > ahora`; si no, `null` | FR-012, FR-013, US2-4 |
| `motivoNoCancelable` | `null` si se puede cancelar; si no, en este orden: `UTILIZADA` (Utilizada), `REEMBOLSADA`, `CANCELADA`, `EVENTO_REALIZADO` (Pendiente o Confirmada con `fechaHora ≤ ahora`) | FR-020 |
| `acciones.completarPago` | `puedeCompletarPago(compra, evento, ahora)` | FR-022 |
| `acciones.cancelar` | `motivoNoCancelable === null` | FR-023 |

Los textos de cada motivo los pone el front: `UTILIZADA` → "No se puede cancelar: la entrada ya fue utilizada.", `EVENTO_REALIZADO` → "No se puede cancelar: el evento ya se realizó.", `REEMBOLSADA` → "Compra cancelada. El reembolso ya fue acreditado.", `CANCELADA` → "Compra cancelada.".

### Operaciones nuevas del repositorio

| Operación | Devuelve |
|---|---|
| `siguienteNumero()` | `"A-1043"`, `"A-1044"`, … (contador desde el mayor del seed) |
| `listarPorComprador(compradorId)` | Compras del comprador ordenadas por `[creadaEn desc, numero desc]`. Usa un índice `Map<compradorId, Set<numero>>` para no recorrer todas las compras. |
| `guardar(compra, { organizadorId })` | Existente; ahora también actualiza el índice por comprador |
| `reiniciar()` | Existente; además reinicia el contador y el índice por comprador |

## TipoDeEntrada (sin cambio de forma)

`vendidas` sigue siendo la fuente de verdad de los lugares ocupados (R5). Comprar suma, cancelar resta, y siempre se cumple `0 ≤ vendidas ≤ cupo`. Las reglas de edición de la feature 002 (cupo ≥ vendidas, no quitar tipos con ventas) siguen igual.

## Vistas (contrato)

Definidas en [contracts/compras.openapi.yaml](contracts/compras.openapi.yaml):

- **Compra**: `numero`, `estado`, `cantidad`, `monto`, `medioDePago`, `creadaEn`, `tipoDeEntrada { id, nombre, precioUnitario }`, `evento { id, nombre, fechaHora, ubicacion, imagenUrl, organizador { id, nombre } }`, `diasParaEvento`, `calificacion { puntaje, comentario, calificadaEn } | null`, `acciones { completarPago, cancelar }` y `motivoNoCancelable`. Mis compras y el Detalle de compra usan la misma vista; la lista es sin paginar.

## Validaciones de entrada (`schemas/compraSchema.js`, solo forma)

| Campo (body de `POST /compradores/compras`) | Regla | Mensaje (`DATOS_INVALIDOS`) |
|---|---|---|
| `eventoId` | string no vacío | "Indicá el evento" |
| `tipoDeEntradaId` | string no vacío | "Elegí un tipo de entrada" |
| `cantidad` | entero, 1 a 10 | "La cantidad tiene que ser de 1 a 10" |
| `medioDePago` | uno de los 4 medios | "Elegí un medio de pago" |
| `precioUnitario` | entero ≥ 0 | "Indicá el precio de la entrada" |

`cantidad` mayor a los lugares disponibles no es un error de forma: responde 409 `LUGARES_INSUFICIENTES` (R4). `{numero}` en la URL no se valida con schema: cualquier valor que no sea una compra del comprador responde 404.

## Seed (`repository/seed.js`) {#seed}

Se agregan a `comprasSeed` las compras de Sofía (`cmp-1`) de `pantallas.md` que faltaban. Las `vendidas` del seed ya las incluyen y no se tocan (R5).

| Número | Evento | Tipo × cant. | Monto | Medio | Estado | `creadaEn` |
|---|---|---|---|---|---|---|
| A-1042 | Hamlet en el Galpón (`evt-1`) | Platea (`tip-2`) × 2 | $ 36.000 | Tarjeta de crédito | Confirmada | 2026-11-06T19:20-03:00 |
| A-1037 | Risas a Domicilio (`evt-2`) | General (`tip-4`) × 1 | $ 9.000 | Mercado Pago | Pendiente de pago | 2026-11-04T11:05-03:00 |
| A-0871 | Tango en el Conventillo (`evt-6`) | General (`tip-11`) × 2 | $ 20.000 | Tarjeta de débito | Utilizada (sin calificar) | 2026-10-05T16:40-03:00 |
| A-0790 | Cartas a Julieta (`evt-4`) | Pareja (`tip-9`) × 1 | $ 19.000 | Tarjeta de crédito | Reembolsada | 2026-09-30T10:15-03:00 |
| A-0655 | Edipo Rey (`evt-7`) | General (`tip-12`) × 1 | $ 10.000 | Tarjeta de débito | Utilizada, 4★ (ya existe) | 2026-09-13T09:00-03:00 |

Con "hoy" = 2026-11-09, Mis compras de Sofía muestra:

| Compra | Tag | Extra en la tarjeta | Detalle: acciones / nota |
|---|---|---|---|
| A-1042 | Confirmada | "Faltan 13 días" (de 09/11 12:00 a 21/11 21:00 hay 12,4 días → 13) | **Cancelar compra** |
| A-1037 | Pendiente de pago | — | **Completar pago** y **Cancelar compra** |
| A-0871 | Utilizada | "Calificá tu experiencia" (sin acción, FR-029) | "No se puede cancelar: la entrada ya fue utilizada." |
| A-0790 | Reembolsada (imagen al 40 %) | — | "Compra cancelada. El reembolso ya fue acreditado." |
| A-0655 | Utilizada | "Calificaste ★★★★☆" | Tarjeta "Tu calificación" + nota de utilizada |

> Nota: los tests fijan "hoy" en `HOY` = 2026-11-09T12:00-03:00 (`tests/helpers/sesion.js`); con otra hora, la cuenta regresiva puede cambiar en un día.

Los demás compradores del seed (`cmp-2` a `cmp-5`) conservan sus compras calificadas de la feature 003, que aparecen en sus propias Mis compras.
