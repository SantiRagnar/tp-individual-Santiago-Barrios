# Research: Calificaciones y opiniones (feature 006)

No quedaron puntos marcados como NEEDS CLARIFICATION en el Technical Context. Las dos dudas de la spec se resolvieron en `/speckit-clarify`: alcanza con que la compra esté Utilizada y no hay plazo para calificar. Este documento registra las decisiones de diseño.

## R1 · Dónde vive la calificación

- **Decisión**: se sigue guardando en `Compra.calificacion` (`models/Compra.js`, clase `Calificacion` con `puntaje`, `comentario` y `calificadaEn`), como ya hacen el seed y las features 003 y 004. No se crea ninguna entidad ni repositorio nuevo.
- **Rationale**: el design system lo indica ("guardado en la compra"). Además, `comprasRepository` ya mantiene por organizador las compras calificadas ordenadas, junto con la suma y la cantidad de puntajes. El puntaje de Explorar, el orden por Puntaje y las reseñas del Detalle leen ese índice en cada request, así que se actualizan solos.
- **Alternativas**: un `calificacionesRepository` separado. Duplica el índice que ya existe y obliga a sincronizar dos repositorios. Se descarta.

## R2 · Cómo se actualiza el índice de calificaciones

- **Decisión**: el repositorio suma una función nueva, `calificar(numero, calificacion, { organizadorId })`. Asigna la calificación a la compra, la inserta ordenada en `calificacionesPorOrganizador` por `[calificadaEn desc, numero desc]` y actualiza `suma` y `cantidad`. Si la compra ya tiene calificación, lanza un error de programación: el servicio tiene que haberlo verificado antes.
- **Rationale**: hoy el índice solo se arma en `guardar()`. Volver a llamar a `guardar()` con una compra ya indexada la reinsertaría en los índices por evento y por comprador. Con una función propia, la escritura es explícita y testeable, y ninguna otra capa toca el índice.
- **Alternativas**: modificar `compra.calificacion` desde el servicio y recalcular el índice. Rompe el encapsulamiento del repositorio que exige la constitución. Se descarta.

## R3 · Reglas puras en `services/reglasCalificacion.js`

- **Decisión**: se crea `reglasCalificacion.js` con dos funciones puras:
  - `puedeCalificar(compra)`: `estado === "Utilizada" && calificacion === null`.
  - `motivoNoCalificable(compra)`: devuelve `"YA_CALIFICADA"`, `"NO_UTILIZADA"` o `null`. El orden de verificación es primero ya calificada y después no utilizada.

  El DTO de compra expone `acciones.calificar` y `motivoNoCalificable`.
- **Rationale**: sigue el patrón de `reglasCompra` y `reglasVenta`: pantalla y servicio usan la misma regla y no pueden discrepar. Así el front no recalcula reglas (CLAUDE.md, feature 004), y FR-011 puede mostrar la nota exacta. Por la clarificación, la regla no depende del reloj.
- **Alternativas**: que el front deduzca la regla del estado y de `calificacion`. Duplica la regla. Se descarta.

## R4 · Endpoint para calificar

- **Decisión**: `POST /compradores/compras/{numero}/calificacion` con body `{ puntaje, comentario? }`.
  - **Éxito**: 201 `{ compra }`, con el mismo DTO de Compra.
  - **Errores**:
    - 404 `COMPRA_NO_ENCONTRADA` si la compra es ajena o no existe.
    - 409 `COMPRA_YA_CALIFICADA`.
    - 409 `CALIFICACION_NO_PERMITIDA` si la compra no está Utilizada.
    - 400 `DATOS_INVALIDOS`.
- **Rationale**: es un sub-recurso de la compra, igual que `/pago` y `/cancelacion`. Vive en `routes/compras.js`, ya protegido con `requiereSesion("comprador")`. Devolver la compra completa permite que el Detalle se repinte sin otra request. Los dos 409 tienen códigos distintos porque el front muestra mensajes distintos (FR-011, FR-019).
- **Alternativas**:
  - `PUT` idempotente: confunde, porque la calificación no se puede reemplazar.
  - `POST /compradores/calificaciones` con `numero` en el body: rompe la simetría con las otras acciones de la compra.

## R5 · Validación de entrada

- **Decisión**: `schemas/calificacionSchema.js` (zod, estricto):
  - `puntaje`: entero de 1 a 5, con el mensaje "Elegí de 1 a 5 estrellas".
  - `comentario`: string opcional y nullable. Se recortan los espacios; si queda vacío se guarda `null`; si tiene más de 500 caracteres, el mensaje es "El comentario puede tener hasta 500 caracteres".
  - Cualquier otro campo se rechaza.
- **Rationale**: aplica FR-003 tal como está. Normalizar el comentario en el schema hace que el servicio reciba datos ya limpios. Como el límite se cuenta después de recortar, un texto de 500 caracteres con espacios alrededor es válido.

## R6 · Concurrencia: una sola calificación por compra

- **Decisión**: `comprasService.calificar` es **sincrónica**, como `comprar`, `completarPago` y `cancelar`. Hace tres pasos sin ningún `await` en el medio: busca la compra propia, verifica la regla y llama a `comprasRepository.calificar`. Se agrega un test de integración con N `POST` simultáneos a la misma compra. Resultado esperado: un 201, N−1 respuestas 409 `COMPRA_YA_CALIFICADA` y `cantidad` del organizador +1.
- **Rationale**: es el mismo invariante que la feature 004 (research R2). Node atiende las requests de a una en un solo hilo, así que un bloque sin `await` no se intercala con otra request. Cumple FR-002 y SC-003.

## R7 · Recordatorio de Explorar

- **Decisión**: `GET /compradores/calificaciones/pendiente` devuelve 200 `{ compra: Compra | null }`. Elige la compra Utilizada sin calificar del comprador cuyo evento tiene la `fechaHora` más reciente; a igual fecha, la de número mayor. Va en un router nuevo, `routes/calificaciones.js`, montado en `/compradores/calificaciones`. Para calificar desde el recordatorio se usa el mismo `POST …/compras/{numero}/calificacion`.
- **Rationale**:
  - El orden lo decide el servidor (FR-014), así que el front no recalcula reglas.
  - Explorar hace una request chica en lugar de traer todas las compras.
  - Devolver la compra completa da el nombre del evento y el número para calificar.
  - Usar un path aparte evita que `pendiente` choque con `/compras/:numero`.
  - Recorrer `listarPorComprador` alcanza: son pocas compras por comprador, como en Mis compras.
- **Alternativas**:
  - `GET /compradores/compras?pendienteDeCalificar=true`: mezcla un filtro con una selección de un único elemento.
  - Filtrar en el front a partir de Mis compras: duplica el orden de la regla.

## R8 · Autor de la reseña

- **Decisión**: no hay cambios. `dto/eventoCompradorDto.js` ya arma la reseña con autor "Nombre I.", puntaje, evento y comentario (feature 003). Se agrega un test de integración que califica y después lee `GET /compradores/eventos/{id}` y `/compradores/organizadores/{id}/resenas` para verificar que la reseña nueva sale primera y que el resumen cambió (US2).

## R9 · Navegación del front

- **Decisión**:
  - **Ruta nueva**: `/(compradores)/compras/[numero]/calificar.tsx`, dentro del `Stack.Protected` de compradores.
  - **Desde el Detalle de compra**: se abre con `push` y el parámetro `desde=detalle`. Al enviar se hace `router.back()`. El Detalle se recarga solo con su `useFocusEffect`.
  - **Desde Mis compras**: se abre con `push` y sin el parámetro. Al enviar se hace `router.replace` al Detalle de esa compra, así que Volver desde el Detalle lleva a Mis compras y nunca regresa a Calificar (FR-010). Mis compras ya se recarga con su `useFocusEffect` (FR-013).
- **Rationale**: es el comportamiento que pide el diseño ("Al enviar vuelve al Detalle de compra") sin apilar pantallas repetidas.

## R10 · Componentes del front

- **Decisión**:
  - **`SelectorEstrellas`** (nuevo, `components/ds/`): 5 `Pressable`.
    - Accesibilidad: rol botón, `accessibilityLabel` "N estrellas" y `accessibilityState.selected` en la elegida, equivalente a `aria-pressed`.
    - Íconos llenos hasta la elegida, en `accent-300`.
    - Prop `tamano`: `size` de 36 en Calificar experiencia y uno más chico en el recordatorio.
  - **`RecordatorioCalificacion`** (nuevo): tarjeta `surface` con los textos del diseño, `SelectorEstrellas`, un `TextField` multiline con `maxLength` 500 y **Calificar**. Después de enviar, muestra la confirmación en línea con `check-circle`.
  - **`lib/formato.ts`**: se agregan `palabraPuntaje(n)` ("Malo" … "Excelente" o "Elegí de 1 a 5 estrellas") y `contadorCaracteres(n)` ("N/500").
  - **`api/compras.ts`**: se agregan `calificarCompra` y `obtenerPendienteDeCalificar`, y en `Compra` los campos `acciones.calificar` y `motivoNoCalificable`.
- **Rationale**: solo usa tokens y componentes existentes (Principio I). Las estrellas para calificar están descritas en design-system § Rating, pero todavía no existían como componente.
- **Explorar**: el recordatorio va en el `ListHeaderComponent`, arriba del contador. Se carga en `useFocusEffect`, así que vuelve a pedirse al entrar a la pestaña (FR-015). Si la request falla, no se muestra (FR-016).

## R11 · Mensajes que no están en el diseño

- **Decisión**: "Esta compra ya fue calificada." y "Solo podés calificar una entrada utilizada." se agregan a `pantallas.md` (Compradores 12), junto con la regla "sin plazo; alcanza con Utilizada", antes de implementar la pantalla, como pide el Principio I. El `mensaje` de los errores de dominio usa esos mismos textos.

## R12 · Tests (Principio II)

- **Unitarios**:
  - `reglasCalificacion.test.js`: cada estado y ya calificada.
  - `calificacionSchema.test.js`: límites 1 y 5, decimales, 0 y 6, comentario con 500 y 501 caracteres, solo espacios, recorte, campos extra.
  - `comprasRepository.test.js` (+ `calificar`): el índice queda ordenado; suma y cantidad; error si ya estaba calificada.
  - `comprasService.test.js` (+ `calificar` y `pendienteDeCalificar`): propiedad, estados, orden del recordatorio.
  - `compraDto.test.js` (+ `acciones.calificar`, `motivoNoCalificable`).
- **Integración**, un archivo por historia:
  - `calificarCompra.test.js` (US1): 201; 404 ajena o inexistente; 409 por cada estado; 409 ya calificada; 400 por validaciones; 401 sin sesión.
  - `resenaPublicada.test.js` (US2): reseña primera, total y puntaje; organizador sin reseñas que pasa a tenerlas; orden por puntaje en Explorar.
  - `recordatorioCalificacion.test.js` (US3): null sin pendientes; orden por evento más reciente; pasa a la siguiente después de calificar.
  - `concurrencia.test.js` (+ calificaciones simultáneas).
  - `docs.test.js` (+ paths nuevos).
