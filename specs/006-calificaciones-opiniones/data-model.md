# Data Model: Calificaciones y opiniones (feature 006)

No hay entidades nuevas. Se agrega la transición "calificar" sobre `Compra`, una regla derivada y un índice que ya existe pasa a actualizarse en tiempo de ejecución.

## Calificación (`models/Compra.js` § `Calificacion`, existente)

| Campo | Tipo | Reglas |
|---|---|---|
| `puntaje` | entero | 1 a 5, obligatorio |
| `comentario` | string \| null | Se recortan los espacios. Si queda vacío se guarda `null`. Hasta 500 caracteres después de recortar. |
| `calificadaEn` | string ISO 8601 | `ahora()` del servicio (`services/reloj.js`) al calificar |

- Pertenece a una sola compra: `Compra.calificacion` es `null` o una `Calificacion`.
- Es inmutable: no hay edición ni borrado.

## Compra · transición nueva

```text
Utilizada (calificacion = null) ──calificar(puntaje, comentario)──▶ Utilizada (calificacion ≠ null)
```

- El estado de la compra **no cambia**: sigue siendo Utilizada.
- **Precondiciones**, en este orden, con su error:
  1. La compra existe y es del comprador con sesión. Si no: 404 `COMPRA_NO_ENCONTRADA`.
  2. `calificacion === null`. Si no: 409 `COMPRA_YA_CALIFICADA`.
  3. `estado === "Utilizada"`. Si no: 409 `CALIFICACION_NO_PERMITIDA`.
- **No hay condición de fecha ni plazo** (Clarifications).
- **Efecto atómico**, sin `await` en el medio:
  - Se asigna `compra.calificacion`.
  - La compra se inserta ordenada en `calificacionesPorOrganizador[organizadorId].calificadas`, por `[calificadaEn desc, numero desc]`.
  - Se actualizan `suma += puntaje` y `cantidad += 1`.

## Valores derivados (`services/reglasCalificacion.js`, nuevo)

| Función | Resultado |
|---|---|
| `motivoNoCalificable(compra)` | `"YA_CALIFICADA"` si tiene calificación; si no, `"NO_UTILIZADA"` si el estado no es Utilizada; si no, `null` |
| `puedeCalificar(compra)` | `motivoNoCalificable(compra) === null` |

**Compra pendiente de calificar del comprador** (`comprasService.pendienteDeCalificar`):

- Se consideran las compras del comprador con `puedeCalificar`.
- Se ordenan por `evento.fechaHora` desc y, a igual fecha, por `numero` desc.
- Se devuelve la primera, o `null` si no hay ninguna.

## Vista Compra (`dto/compraDto.js`): campos agregados

| Campo | Tipo | Origen |
|---|---|---|
| `acciones.calificar` | boolean | `puedeCalificar(compra)` |
| `motivoNoCalificable` | `"YA_CALIFICADA"` \| `"NO_UTILIZADA"` \| null | `motivoNoCalificable(compra)` |

Los demás campos no cambian (feature 004). `calificacion` ya estaba en el DTO.

## Puntaje y reseñas del organizador (existente, feature 003)

- `comprasRepository.resumenDeCalificaciones(organizadorId)` → `{ suma, cantidad }`. Explorar (puntaje y orden por Puntaje) y el Detalle del evento lo leen en cada request, así que una calificación nueva se ve en la request siguiente.
- `listarCalificadas(organizadorId, { despuesDe, limite })` alimenta las reseñas paginadas de a 5. Cada reseña muestra el autor ("Sofía G."), el puntaje, el evento calificado y el comentario (o `null`, que el front muestra como "Sin comentario.").

## Validaciones de entrada (`schemas/calificacionSchema.js`, nuevo)

| Campo | Regla | Mensaje |
|---|---|---|
| `puntaje` | entero, 1 ≤ n ≤ 5, obligatorio | "Elegí de 1 a 5 estrellas" |
| `comentario` | string opcional o null; recortado; ≤ 500 caracteres | "El comentario puede tener hasta 500 caracteres" |
| otros campos | no se permiten | "Hay datos que no corresponden a una calificación" |

## Errores nuevos (`errors/ErrorDeDominio.js`)

| Clase | Código | Status | Mensaje |
|---|---|---|---|
| `CompraYaCalificada` | `COMPRA_YA_CALIFICADA` | 409 | "Esta compra ya fue calificada." |
| `CalificacionNoPermitida` | `CALIFICACION_NO_PERMITIDA` | 409 | "Solo podés calificar una entrada utilizada." |

## Seed

No hay cambios. En el seed:

- A-0871 (Tango en el Conventillo, Lumbre, `cmp-1`) es **Utilizada sin calificar**: es la que muestra el recordatorio de Sofía.
- A-0655 (Edipo Rey, La Trama) es **Utilizada y calificada con 4★**.

Las reseñas de ejemplo de la feature 003 se mantienen. Los casos con varias compras pendientes se arman en los tests con `tests/helpers/compras.js`.
