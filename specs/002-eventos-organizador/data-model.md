# Data Model: Mis eventos, crear y editar evento (organizadores)

Entidades nuevas de la feature 002. Organizador, Comprador y Sesión siguen como en [001 data-model.md](../001-login-email-password/data-model.md). Todo vive en memoria, en `repository/` (constitución).

## Evento (`models/Evento.js`, `repository/eventosRepository.js`)

| Campo | Tipo | Borrador | Publicado | Notas |
|---|---|---|---|---|
| `id` | string | ✔ | ✔ | `evt-N` (R17). |
| `organizadorId` | string | ✔ | ✔ | Dueño. Nunca cambia. Toda consulta filtra por él (FR-022). |
| `nombre` | string \| null | opcional | obligatorio | Recortado, máx. 120. "Poné un nombre al evento". |
| `descripcion` | string \| null | opcional | opcional | Máx. 2000. |
| `categoria` | `"Teatro" \| "Comedia" \| "Drama" \| "Amor"` \| null | opcional | opcional | |
| `fechaHora` | string ISO 8601 con offset \| null | opcional | obligatoria y futura | "Elegí fecha y hora" / "La fecha tiene que ser futura" (R3). |
| `ubicacion` | string \| null | opcional | obligatoria | Recortada, máx. 200. "Indicá dónde se hace el evento". |
| `imagenId` | string \| null | opcional | opcional | Referencia a una Imagen del mismo organizador (R7). |
| `materialMultimedia` | `MaterialMultimedia[]` | ✔ | ✔ | Puede estar vacío. |
| `tiposDeEntrada` | `TipoDeEntrada[]` | puede estar vacío | ≥ 1 | "Agregá al menos un tipo de entrada". El orden es el del formulario ("Entrada 1", "Entrada 2"…). |
| `estado` | `"Borrador" \| "Publicado"` | ✔ | ✔ | Estado guardado. |
| `creadoEn` | string ISO | ✔ | ✔ | Para ordenar borradores sin fecha (R15). |

**Valores derivados** (en el DTO, no se guardan):

- `estadoVisible` = `"Finalizado"` si `estado === "Publicado"` y `fechaHora <= ahora()`; si no, `estado` (R1).
- `cupoTotal` = Σ `cupo` de los tipos (los `null` cuentan 0). Es la "Capacidad total" y la M de "N de M entradas vendidas".
- `vendidasTotal` = Σ `vendidas`.
- `imagenUrl` = `/imagenes/{imagenId}` o `null`.

### Ciclo de vida

```text
             Guardar borrador (sin validar)
  (nuevo) ───────────────────────────────► Borrador ──┐ Guardar borrador (editar)
     │                                        │  ▲────┘
     │ Publicar (valida FR-011/012)           │ Publicar (valida)
     ▼                                        ▼
  Publicado ◄──────────────────────────────────
     │  ▲
     │  └── Guardar cambios (valida FR-011/012 + reglas de ventas FR-020)
     │
     │ pasa fechaHora (derivado, R1)
     ▼
  Finalizado  (no se puede editar: 409 EVENTO_FINALIZADO)

  Publicado → Borrador: no permitido (409 NO_SE_PUEDE_DESPUBLICAR)
```

## TipoDeEntrada (dentro de Evento)

| Campo | Tipo | Borrador | Publicado | Notas |
|---|---|---|---|---|
| `id` | string | ✔ | ✔ | `tip-N`. El cliente lo manda para los tipos existentes al editar (R6). |
| `nombre` | string \| null | opcional | obligatorio, único en el evento | Único comparando recortado y en minúsculas. "Poné un nombre" / "Ya hay una entrada con este nombre". Máx. 60. |
| `cupo` | entero \| null | opcional | entero ≥ 1 y ≥ `vendidas` | "Indicá el cupo" / "El cupo tiene que ser 1 o más" / "El cupo no puede ser menor a las vendidas (N)". |
| `precio` | entero \| null | opcional | entero ≥ 0 | En pesos. 0 = gratuita. "Indicá el precio" / "El precio no puede ser negativo". |
| `vendidas` | entero ≥ 0 | ✔ | ✔ | Lo maneja el sistema: 0 al crear; lo actualizan las compras (otra feature). El cliente no lo puede cambiar. |

**Derivado**: `disponibles` = `cupo − vendidas`.

**Reglas al editar con ventas (FR-020)**: un tipo con `vendidas > 0` no se puede quitar ("Tiene ventas: no se puede quitar") ni quedar con `cupo < vendidas`. Su nombre y su precio sí se pueden cambiar. Estas reglas se aplican tanto en Borrador como en Publicado (en la práctica, un Borrador nunca tiene ventas).

## MaterialMultimedia (dentro de Evento)

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | string | Nombre del archivo (p. ej. `trailer.mp4`), máx. 200. No se guarda el contenido (R9). |
| `tipo` | `"foto" \| "video"` | Define el ícono del tag. |

## Imagen (`models/Imagen.js`, `repository/imagenesRepository.js`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | UUID aleatorio para las subidas; `img-seed-*` para las del seed (R7, R8). |
| `organizadorId` | string \| null | Quien la subió; `null` en las del seed (solo las usan los eventos del seed). |
| `tipoMime` | `"image/jpeg" \| "image/png"` | Verificado por la firma de los bytes. |
| `datos` | Buffer | Hasta 5 MB. |

## Relaciones

```text
Organizador 1 ──── * Evento 1 ──── 1..* TipoDeEntrada   (≥1 solo para publicar)
                       │  └────── 0..* MaterialMultimedia
                       └── 0..1 ── Imagen
Organizador 1 ──── * Imagen
```

La **Compra** (otra feature) va a referenciar un TipoDeEntrada por `id` y guardar su propio `monto`, para que un cambio de precio no afecte compras hechas (FR-020).

## Seed (`repository/seed.js`)

Fecha de referencia de los tests: `2026-11-09T12:00:00-03:00` (R2). Valores en R18.

| id | Nombre | Org. | Categoría | fechaHora | Estado guardado | Tipos (precio / cupo / vendidas) |
|---|---|---|---|---|---|---|
| evt-1 | Hamlet en el Galpón | org-1 | Teatro | 2026-11-21T21:00-03:00 | Publicado | General 12000/150/66 · Platea 18000/80/68 · VIP 26000/20/20 |
| evt-2 | Risas a Domicilio | org-2 | Comedia | 2026-11-14T22:30-03:00 | Publicado | General 9000/120/95 · Mesa preferencial 14000/30/22 |
| evt-3 | Bodas de sangre | org-1 | Drama | 2026-12-05T20:00-03:00 | Publicado | General 15000/200/80 · Platea 21000/60/30 |
| evt-4 | Cartas a Julieta | org-3 | Amor | 2026-11-28T20:30-03:00 | Publicado | General 11000/100/40 · Pareja 19000/40/12 |
| evt-5 | Impro Express | org-2 | Comedia | 2026-12-12T21:30-03:00 | Publicado | General 8000/80/10 |
| evt-6 | Tango en el Conventillo | org-3 | Teatro | 2026-10-18T21:00-03:00 | Publicado (→ Finalizado) | General 10000/90/90 |
| evt-7 | Edipo Rey | org-1 | Drama | 2026-09-12T21:00-03:00 | Publicado (→ Finalizado) | General 10000/150/142 |
| evt-8 | La gaviota | org-1 | — | 2027-03-06T20:30-03:00 | Borrador | General 14000/120/0 |

Ubicaciones según `pantallas.md` (La gaviota: "A confirmar").

## Validaciones de entrada (`schemas/eventoSchema.js`, solo forma — R4)

```text
EventoEntrada {
  nombre?: string|null (trim, ≤120)
  descripcion?: string|null (≤2000)
  categoria?: "Teatro"|"Comedia"|"Drama"|"Amor"|null
  fechaHora?: ISO datetime con offset|null
  ubicacion?: string|null (trim, ≤200)
  imagenId?: string|null
  materialMultimedia?: [{ nombre: string (1..200), tipo: "foto"|"video" }]  (default [])
  tiposDeEntrada?: [{ id?: string, nombre?: string|null (trim, ≤60), cupo?: int|null, precio?: int|null }]  (default [])
  estado: "Borrador"|"Publicado"
}
```

Los strings vacíos después de recortar se guardan como `null`. Las reglas de publicación y de ventas están en `services/reglasEvento.js`.

## Estado del formulario en el front (`src/lib/validacionEvento.ts`)

Mismo shape que `EventoEntrada`, con `cupo` y `precio` como texto mientras se escriben (se convierten al guardar), más `tocados: Set<string>` e `intentoPublicar: boolean` para decidir qué errores se muestran (FR-013).
