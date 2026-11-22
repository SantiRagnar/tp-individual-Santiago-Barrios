# Data Model: Panel del evento (organizadores)

Cambios sobre las entidades existentes. `Evento`, `TipoDeEntrada` y `Organizador` no cambian de forma. `Compra` no cambia de forma: suma una transición (Confirmada → Utilizada), un índice por evento y las compras de ejemplo. `Comprador` suma compradores de ejemplo. Decisiones en [research.md](research.md).

## Compra (`models/Compra.js`, `repository/comprasRepository.js`)

Campos existentes (feature 003; la 004 suma `tipoDeEntradaNombre` y `precioUnitario`, que esta feature no necesita): `numero`, `compradorId`, `eventoId`, `tipoDeEntradaId`, `cantidad`, `monto`, `medioDePago`, `estado`, `creadaEn`, `calificacion`.

### Transición nueva (`services/reglasVenta.js`)

```text
 Confirmada ──── Marcar utilizada (organizador dueño del evento, desde las 00:00 −03:00 del día del evento) ───► Utilizada
```

| Acción | Precondición | Efecto | Error si no |
|---|---|---|---|
| Marcar utilizada | Evento del organizador (si no, 404 `EVENTO_NO_ENCONTRADO`); compra existe y es de ese evento; `estado === "Confirmada"`; `ahora ≥ inicioDelDiaEnArgentina(evento.fechaHora)` | `estado = "Utilizada"`. Lugares (`vendidas`) sin cambio. Desde ese momento el comprador puede calificarla. | 404 `COMPRA_NO_ENCONTRADA` / 409 `COMPRA_NO_CONFIRMADA` / 409 `EVENTO_NO_COMENZO` |

Orden de verificación: evento → compra → estado → fecha. Una compra Utilizada de un evento futuro responde `COMPRA_NO_CONFIRMADA`. Todo es sincrónico, sin `await` entre la verificación y la escritura (R5).

### Valores derivados

| Valor | Cálculo | Dónde | Requisito |
|---|---|---|---|
| `inicioDelDiaEnArgentina(iso)` | Fecha de `instante − 3 h` (UTC) a las `00:00:00-03:00` | `reglasVenta.js` | FR-012 |
| `acciones.marcarUtilizada` | `puedeMarcarUtilizada(compra, evento, ahora())` | `ventaDto.js` | FR-012 |
| `esActiva` | `estado ∉ {Cancelada, Reembolsada}` | `reglasVenta.js` | FR-006 |

### Operaciones nuevas del repositorio

| Operación | Devuelve |
|---|---|
| `listarPorEvento(eventoId, { estado = null, despuesDe = null, limite })` | Hasta `limite` compras del evento, ordenadas por `[creadaEn desc, numero desc]`, solo del `estado` si se indica, empezando después de la clave `despuesDe = [creadaEn, numero]` |
| `todasDelEvento(eventoId)` | Todas las compras del evento (para el resumen) |
| `guardar(compra, { organizadorId })` | Existente. Ahora también inserta en orden en el índice `Map<eventoId, Compra[]>` |
| `reiniciar()` | Existente. Además vacía el índice por evento |

El cambio de estado se hace sobre el mismo objeto `Compra` (ya está en los índices). `creadaEn` y `numero` no cambian, así que el orden del índice sigue siendo válido.

## Resumen de ventas del evento (`services/ventasService.js`, calculado)

| Campo | Cálculo | Requisito |
|---|---|---|
| `recaudado` | Σ `tipo.vendidas × (tipo.precio ?? 0)` | FR-006 |
| `entradasVendidas` | Σ `tipo.vendidas` | FR-006 |
| `comprasActivas` | Cantidad de compras del evento con `esActiva` | FR-006 |
| `porEstado` | `{ "Todas", "Pendiente de pago", "Confirmada", "Utilizada", "Cancelada", "Reembolsada" }` → cantidad de compras del evento en ese estado (Todas = total) | FR-008 |

Hamlet en el Galpón (`evt-1`) con el seed: `recaudado = 66 × 12.000 + 68 × 18.000 + 20 × 26.000 = 2.536.000`, `entradasVendidas = 154`.

## Venta (vista de una fila; `dto/ventaDto.js`)

| Campo | Origen |
|---|---|
| `numero` | `compra.numero` ("A-1042"; el front agrega "#") |
| `comprador.nombre` | `"{nombre} {apellido}"` del comprador o, si falta el nombre, su `email` |
| `tipoDeEntrada` | `{ id, nombre }` del tipo del evento con `compra.tipoDeEntradaId` (`compra.tipoDeEntradaNombre` cuando exista, feature 004). `nombre` puede ser `null` → el front muestra "Sin nombre" |
| `cantidad`, `estado`, `medioDePago`, `monto`, `creadaEn` | De la compra |
| `acciones.marcarUtilizada` | Ver arriba |

## Validaciones de entrada (`schemas/ventasSchema.js`, solo forma)

| Parámetro (query de `GET …/ventas`) | Regla | Mensaje (`DATOS_INVALIDOS`) |
|---|---|---|
| `estado` | Opcional; uno de `Pendiente de pago`, `Confirmada`, `Utilizada`, `Cancelada`, `Reembolsada`. Ausente o vacío = Todas | "Elegí un estado válido" |
| `cursor` | Opcional; string. Que sea un cursor válido lo decide el servicio | "El cursor no es válido" |

`{id}` y `{numero}` en la URL no se validan con schema: cualquier valor que no corresponda responde 404.

## Errores nuevos (`errors/ErrorDeDominio.js`)

| Clase | `codigo` | `status` | `mensaje` |
|---|---|---|---|
| `CompraNoEncontrada` | `COMPRA_NO_ENCONTRADA` | 404 | "No encontramos la compra." (mismo código y texto que la 004) |
| `CompraNoConfirmada` | `COMPRA_NO_CONFIRMADA` | 409 | "La compra ya no está confirmada." |
| `EventoNoComenzo` | `EVENTO_NO_COMENZO` | 409 | "Todavía no es el día del evento." |

## Comprador (seed)

Se agregan diez compradores de ejemplo, que solo aparecen como autores de compras generadas. Usan la misma contraseña de desarrollo.

| id | Nombre | Email |
|---|---|---|
| cmp-6 | Camila Torres | camila.torres@correo.com |
| cmp-7 | Joaquín Díaz | joaquin.diaz@correo.com |
| cmp-8 | Florencia Ruiz | florencia.ruiz@correo.com |
| cmp-9 | Tomás Herrera | tomas.herrera@correo.com |
| cmp-10 | Agustina Medina | agustina.medina@correo.com |
| cmp-11 | Nicolás Castro | nicolas.castro@correo.com |
| cmp-12 | Micaela Ríos | micaela.rios@correo.com |
| cmp-13 | Facundo Acosta | facundo.acosta@correo.com |
| cmp-14 | Julieta Benítez | julieta.benitez@correo.com |
| cmp-15 | Matías Molina | matias.molina@correo.com |

## Seed de compras (`repository/seed.js`) {#seed}

`comprasSeed = [...comprasBase, ...generarVentasDeEjemplo(eventosSeed, comprasBase)]` (research R8).

**Compras base:**

- Las nueve calificadas de la feature 003, sin cambios.
- Las cuatro de Sofía de `pantallas.md`, con los mismos datos que el seed de la 004:

| Número | Evento | Tipo × cant. | Monto | Medio | Estado | `creadaEn` |
|---|---|---|---|---|---|---|
| A-1042 | `evt-1` | Platea (`tip-2`) × 2 | 36.000 | Tarjeta de crédito | Confirmada | 2026-11-06T19:20:00-03:00 |
| A-1037 | `evt-2` | General (`tip-4`) × 1 | 9.000 | Mercado Pago | Pendiente de pago | 2026-11-04T11:05:00-03:00 |
| A-0871 | `evt-6` | General (`tip-11`) × 2 | 20.000 | Tarjeta de débito | Utilizada (sin calificar) | 2026-10-05T16:40:00-03:00 |
| A-0790 | `evt-4` | Pareja (`tip-9`) × 1 | 19.000 | Tarjeta de crédito | Reembolsada | 2026-09-30T10:15:00-03:00 |

**Generadas** (determinísticas):

- Cada tipo cuadra con sus `vendidas` sumando las compras Pendientes, Confirmadas y Utilizadas.
- Estados según la fecha del evento comparada con 2026-11-09:
  - Pasados (`evt-6`, `evt-7`, `evt-9`): Utilizada, y cada 7.ª Confirmada.
  - Futuros (`evt-1` a `evt-5`): Confirmada, y cada 6.ª Pendiente de pago.
- Además, por evento futuro con ventas, una Cancelada × 1 y una Reembolsada × 2, que no cuentan en las vendidas. `evt-4` solo suma la Cancelada.
- Sin calificaciones.
- Compradores `cmp-6` a `cmp-15`.
- Números desde `A-0100`, todos por debajo de `A-0540`.

**Invariantes** (verificados en `tests/unit/seed.test.js`):

1. Para cada tipo de cada evento, Σ `cantidad` de sus compras activas no Canceladas ni Reembolsadas = `vendidas`.
2. `monto = precio del tipo × cantidad` en todas las compras generadas.
3. `numero` único en todo el seed. El mayor sigue siendo `A-1042`.
4. Ninguna compra nueva tiene `calificacion`, así que los promedios de la 003 no cambian.
5. En las compras generadas, `creadaEn` es anterior a la fecha del evento y a 2026-11-09. Las calificadas de la 003 no se tocan: su `creadaEn` es el día siguiente al evento.
6. `La gaviota` (Borrador, 0 vendidas) no tiene compras.
