# Contrato del front: Calificaciones (compradores)

La ruta nueva va dentro del `Stack.Protected` de `src/app/(compradores)/_layout.tsx`. Las llamadas pasan `token` y `tipo: "comprador"` a `pedir()`, así que un 401 `SESION_INVALIDA` borra la sesión y vuelve al Ingreso. Los endpoints están en [calificaciones.openapi.yaml](calificaciones.openapi.yaml).

## Rutas

| Ruta | Archivo | Pantalla | Llama a |
|---|---|---|---|
| `/compras/[numero]/calificar` | `(compradores)/compras/[numero]/calificar.tsx` (nuevo) | Compradores 12 · Calificar experiencia | `GET /compradores/compras/{numero}`, `POST …/{numero}/calificacion` |
| `/explorar` | `(compradores)/(pestanas)/explorar.tsx` (se amplía) | Compradores 02 · Recordatorio de calificación | `GET /compradores/calificaciones/pendiente`, `POST /compradores/compras/{numero}/calificacion` |
| `/mis-compras` | `(compradores)/mis-compras.tsx` (se amplía) | Compradores 08 | sin cambios |
| `/compras/[numero]` | `(compradores)/compras/[numero]/index.tsx` (se amplía) | Compradores 09 | sin cambios |

## Navegación (research R9)

| Desde | Acción | Hacia |
|---|---|---|
| Mis compras | "Calificá tu experiencia" en una PurchaseCard con `acciones.calificar` | `push` Calificar experiencia |
| Detalle de compra | **Calificar experiencia** en la tarjeta "Tu entrada fue utilizada" | `push` Calificar experiencia con `desde=detalle` |
| Calificar experiencia | Volver | Pantalla anterior |
| Calificar experiencia (`desde=detalle`) | **Enviar calificación** exitoso | `back()`; el Detalle se recarga con `useFocusEffect` |
| Calificar experiencia (desde Mis compras) | **Enviar calificación** exitoso | `replace` al Detalle de esa compra; Volver desde ahí va a Mis compras |
| Calificar experiencia con 404 | **Volver a Mis compras** | `dismissTo('/mis-compras')` |

En la PurchaseCard, "Calificá tu experiencia" solo responde al toque si `acciones.calificar`. El resto de la tarjeta sigue abriendo el Detalle.

## Compradores 12 · Calificar experiencia

1. **AppBar**: Volver, "Calificar experiencia" y el subtítulo "{evento} · {fecha corta}".
2. Línea "Compra #A-NNNN · {tipo} × {cantidad}" (`numeroCompra`, `entradas`).
3. Título "¿Cómo fue tu experiencia?" (h4) y el texto "Tu puntaje y tu comentario se publican en los eventos de {organizador}, para que otros compradores sepan qué esperar." (bodySm, muted).
4. **Puntaje**: `SelectorEstrellas` de tamaño 36 con la palabra `palabraPuntaje(n)` debajo. Sin elegir dice "Elegí de 1 a 5 estrellas".
5. **Comentario (opcional)**: `TextField` multiline, placeholder "Qué te gustó, qué mejorarías, cómo fue el ingreso…", `maxLength` 500 y el contador "N/500" a la derecha.
6. Si `motivoNoCalificable` no es null, una `note`:
   - `YA_CALIFICADA`: "Esta compra ya fue calificada."
   - `NO_UTILIZADA`: "Solo podés calificar una entrada utilizada."
7. **Enviar calificación** (primario, ancho completo). Está deshabilitado si:
   - no hay estrellas elegidas;
   - se está enviando;
   - `acciones.calificar` es false.

**Estados:**

- **Carga**: esqueleto.
- **Sin conexión al cargar**: "No pudimos conectarnos. Probá de nuevo en un rato." + **Reintentar**.
- **Sin conexión al enviar**: el mismo texto arriba del botón. Se conservan las estrellas y el comentario.
- **409 `COMPRA_YA_CALIFICADA` al enviar**: "Esta compra ya fue calificada." y se recarga la compra, así que el botón queda deshabilitado.
- **Compra no encontrada**: `PantallaDeAviso` "No encontramos esta compra." + **Volver a Mis compras**.

## Compradores 02 · Recordatorio de calificación

Va en el `ListHeaderComponent` de Explorar, arriba del contador de resultados. Se pide en `useFocusEffect` y, si falla, no se muestra (FR-016).

- **Tarjeta** `surface`:
  - "Tu entrada fue utilizada" (caption, label);
  - "¿Cómo fue tu experiencia en {evento}?" (h5);
  - `SelectorEstrellas` chico;
  - `TextField` multiline "Contanos qué te pareció (opcional)" con `maxLength` 500;
  - **Calificar** (primario), deshabilitado sin estrellas y mientras se envía.
- **Al enviar con éxito**: la tarjeta se reemplaza por la confirmación en línea, con `check-circle` en acento y "Gracias, tu reseña ya es visible en los eventos del organizador.". La confirmación queda hasta que se vuelve a enfocar Explorar; en ese momento se pide de nuevo el pendiente.
- **Error al enviar**:
  - Sin conexión: el texto de siempre debajo del botón.
  - 409: se vuelve a pedir el pendiente.

## Compradores 08 y 09

- **PurchaseCard**: "Calificá tu experiencia" pasa a navegar (antes no tenía acción, FR-029 de la feature 004). "Calificaste ★★★★☆" queda igual.
- **Detalle de compra**: **Calificar experiencia** navega. Se muestra si `acciones.calificar`, en lugar de la condición actual `estado === 'Utilizada' && !calificacion`. La tarjeta "Tu calificación" queda igual.

## Cambios en `src/api/compras.ts`

```ts
type MotivoNoCalificable = 'YA_CALIFICADA' | 'NO_UTILIZADA';
// Compra: acciones: { completarPago; cancelar; calificar: boolean }; motivoNoCalificable: MotivoNoCalificable | null
calificarCompra(token, numero, { puntaje, comentario }): Promise<Compra>   // POST …/calificacion
obtenerPendienteDeCalificar(token): Promise<Compra | null>                // GET /compradores/calificaciones/pendiente
```
