# Data Model: Ingreso con email y contraseña

**Feature**: [spec.md](spec.md) · **Research**: [research.md](research.md)

Todo vive en memoria detrás de `repository/` (constitución). Cada repositorio expone `reiniciar()` para volver al estado del seed, y ninguna otra capa toca sus estructuras.

## Comprador

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Único. Seed: `cmp-1`. |
| `nombre` | string | Obligatorio. P. ej. "Sofía". |
| `apellido` | string | Obligatorio. P. ej. "Gómez". |
| `email` | string | Obligatorio, se guarda recortado y en minúsculas, **único entre compradores**. |
| `contrasenaHash` | string | Formato `scrypt$<saltHex>$<hashHex>` (R4). **Nunca** sale del backend ni aparece en logs. |

**Repositorio** `compradoresRepository`: `buscarPorEmail(email)` (el email ya normalizado), `buscarPorId(id)` y `reiniciar()`.

## Organizador

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Único. Seed: `org-1`, `org-2`, `org-3`. |
| `nombre` | string | Nombre de la compañía. Obligatorio. Lo muestra el DesktopNav. |
| `email` | string | Obligatorio, recortado y en minúsculas, **único entre organizadores**. |
| `contrasenaHash` | string | Igual que en Comprador. |

**Repositorio** `organizadoresRepository`: `buscarPorEmail(email)`, `buscarPorId(id)` y `reiniciar()`.

Comprador y Organizador son tipos independientes: el mismo email puede estar en los dos (R7).

## Sesión

| Campo | Tipo | Reglas |
|---|---|---|
| `tokenHash` | string | SHA-256 (hex) del token opaco. Es la clave del repositorio. El token en claro solo se devuelve una vez, en la respuesta del ingreso. |
| `tipo` | `"comprador"` \| `"organizador"` | Obligatorio. |
| `usuarioId` | string | `id` de un Comprador o de un Organizador, según `tipo`. |
| `creadaEn` | Date | Momento del ingreso. Por ahora es informativo: no hay vencimiento (Assumptions de la spec). |

**Repositorio** `sesionesRepository`: `guardar(sesion)`, `buscarPorTokenHash(hash)`, `eliminar(hash)` y `reiniciar()`.

### Ciclo de vida

```text
(no existe) ──ingreso correcto──▶ Activa ──cerrar sesión──▶ (eliminada)
                                     │
                                     └──reinicio del backend──▶ (eliminada)
```

- **Válida** = existe en el repositorio **y** su `tipo` coincide con el que pide la operación **y** el usuario sigue existiendo.
- Un mismo usuario puede tener varias sesiones activas (p. ej. en el celular y en la web).

## Seed (cargado al iniciar el backend)

| Tipo | id | Nombre | Email |
|---|---|---|---|
| Comprador | `cmp-1` | Sofía Gómez | `sofia.gomez@correo.com` |
| Organizador | `org-1` | Compañía La Trama | `produccion@latrama.com.ar` |
| Organizador | `org-2` | Club del Chiste | `hola@clubdelchiste.com.ar` |
| Organizador | `org-3` | Producciones Lumbre | `contacto@lumbre.com.ar` |

El seed guarda los **hashes ya calculados**. La contraseña de desarrollo está documentada en [quickstart.md](quickstart.md). Los ids de organizador se van a reutilizar cuando las features de eventos asocien cada evento a su organizador.

## Validaciones de entrada (`schemas/ingresoSchema`)

| Campo | Regla | Mensaje (igual al del front, FR-006) |
|---|---|---|
| `email` | string; se recorta y se pasa a minúsculas; no vacío | "Ingresá tu email" |
| `email` | formato de email válido | "Ingresá un email válido" |
| `contrasena` | string no vacío; **no** se recorta | "Ingresá tu contraseña" |

## Estado de sesión en el front

| Clave guardada | Contenido |
|---|---|
| `sesion.comprador` | `{ token, comprador: { id, nombre, apellido, email } }` |
| `sesion.organizador` | `{ token, organizador: { id, nombre, email } }` |

Las dos sesiones son independientes: en el mismo dispositivo puede haber una de cada tipo, y cada lado usa solo la suya.
