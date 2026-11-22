# Research: Compra, pago simulado y Mis compras

Decisiones técnicas de la feature 004. Parten de lo construido en las features 001 a 003: capas del backend, `requiereSesion`, `validar`, `comprasRepository`, `reloj.js`, `visibilidadEvento.js` y las pestañas de compradores. No quedan puntos `NEEDS CLARIFICATION`: los de la spec se resolvieron en sus Clarifications.

## R1. Endpoints: un recurso `compras` con acciones explícitas

- **Decision**: router nuevo montado en `/compradores/compras`, siempre con `requiereSesion("comprador")`:
  - `POST /compradores/compras`: pagar, es decir, crear una compra Confirmada (FR-009).
  - `GET /compradores/compras`: Mis compras, sin paginar (FR-013).
  - `GET /compradores/compras/{numero}`: Detalle de compra (FR-018).
  - `POST /compradores/compras/{numero}/pago`: **Completar pago** (FR-022).
  - `POST /compradores/compras/{numero}/cancelacion`: **Cancelar compra** (FR-024).
- **Rationale**: cada acción tiene reglas de negocio propias (quién puede, en qué estado, qué pasa con los lugares). Un endpoint por acción deja esas reglas en `services/` y hace que el contrato diga qué se puede hacer, no qué campo se pisa. Elegir entradas no necesita endpoint propio: usa `GET /compradores/eventos/{id}`, que ya devuelve `tiposDeEntrada [{ id, nombre, precio, disponibles }]` (feature 003).
- **Alternatives considered**: `PATCH /compras/{numero} { estado }` se descartó porque deja la máquina de estados a cargo del cliente y obliga a validar transiciones arbitrarias. `POST /pagos` separado de `POST /compras` se descartó porque el pago es simulado y crear la compra y pagarla son un único paso (06 · Pago).

## R2. Concurrencia: sección crítica sincrónica

- **Decision**: `comprasService.comprar()` es una función **sincrónica**. Valida visibilidad, tipo, precio, lugares y cantidad, incrementa `tipo.vendidas`, asigna número y guarda la compra, sin ningún `await` ni callback en el medio. Con el mismo criterio son sincrónicas `completarPago()` y `cancelar()` (esta última libera los lugares), y el controller llama al servicio sin `await`. Se documenta en el servicio como invariante: "no agregar `await` entre la verificación y el descuento".
- **Rationale**: Node ejecuta JavaScript en un solo hilo y la persistencia es en memoria (constitución). Un bloque sin puntos de suspensión no puede intercalarse con otra request, así que verificar y descontar en ese bloque es atómico. Cumple FR-010 y SC-003 sin locks. `eventosService.editar()` del organizador también es sincrónico, así que un cambio de precio o de tipos tampoco puede caer en medio de un pago.
- **Verificación**: test de integración `concurrencia.test.js`. Crea un evento visible con un tipo de cupo 10 y dispara 50 `POST /compradores/compras` de cantidad 1 en paralelo (`Promise.all`). Espera exactamente 10 respuestas 201 y 40 respuestas 409 `LUGARES_INSUFICIENTES`, y que `vendidas` quede en 10. Un test unitario verifica que `comprar()` no devuelve una `Promise`, para detectar si alguien la vuelve `async`.
- **Alternatives considered**: un mutex por tipo de entrada (p. ej. `async-mutex`) se descartó porque suma una dependencia para resolver algo que el modelo de ejecución ya garantiza. Reservas temporales con vencimiento al entrar a Pago se descartaron porque el diseño no las tiene y la spec solo pide no sobrevender.

## R3. Precio que vio el comprador

- **Decision**: el body de `POST /compradores/compras` incluye `precioUnitario`, el precio que mostró el Resumen de Pago. El servicio rechaza con `409 PRECIO_CAMBIADO` si el tipo ya no existe en el evento o si su precio actual es distinto. El monto se calcula en el servidor como `precio × cantidad`, nunca se toma del cliente.
- **Rationale**: cumple FR-030 (nunca se cobra un monto distinto del mostrado) sin guardar estado de la sesión de compra en el servidor. El cliente no puede bajar el precio, porque si `precioUnitario` no coincide se rechaza.
- **Alternatives considered**: mandar el `monto` total (equivalente, pero mezcla precio y cantidad en el error). Versionar el evento con un `version`/ETag se descartó porque rechazaría pagos por cambios irrelevantes, como la descripción.

## R4. Errores nuevos y orden de las verificaciones

| Error (`errors/ErrorDeDominio.js`) | HTTP | `codigo` | Cuándo |
|---|---|---|---|
| `EventoNoEncontrado` (existente) | 404 | `EVENTO_NO_ENCONTRADO` | Comprar en un evento inexistente o no visible (FR-001 de la 003) |
| `PrecioCambiado` | 409 | `PRECIO_CAMBIADO` | El tipo no existe o su precio ≠ `precioUnitario` |
| `LugaresInsuficientes` | 409 | `LUGARES_INSUFICIENTES` | `cantidad > cupo − vendidas` |
| `CompraNoEncontrada` | 404 | `COMPRA_NO_ENCONTRADA` | Número inexistente **o de otro comprador** (SC-004) |
| `PagoNoPermitido` | 409 | `PAGO_NO_PERMITIDO` | Completar pago de una compra que no está Pendiente o de un evento que ya ocurrió |
| `CancelacionNoPermitida` | 409 | `CANCELACION_NO_PERMITIDA` | Cancelar fuera de las reglas (FR-024) |

Orden en `comprar()`: 1) evento visible → 404; 2) tipo existe y precio igual → 409 `PRECIO_CAMBIADO`; 3) lugares → 409 `LUGARES_INSUFICIENTES`. Así un tipo eliminado nunca se informa como "sin lugares". La forma (cantidad entera 1–10, medio de pago válido, ids presentes, `precioUnitario` entero ≥ 0) la valida zod antes, con 400 `DATOS_INVALIDOS`.

Los textos de pantalla los arma el front a partir del `codigo` (R10), porque incluyen el nombre del tipo que el front ya conoce, incluso si el tipo se eliminó.

## R5. Lugares: `vendidas` sigue siendo la fuente de verdad

- **Decision**: `TipoDeEntrada.vendidas` (feature 002) sigue siendo el contador de lugares ocupados. Comprar lo incrementa en `cantidad`. Cancelar una Pendiente o una Confirmada lo decrementa. Completar pago y Utilizada no lo cambian. Las `vendidas` del seed ya incluyen las compras de ejemplo, así que no se recalculan desde las compras.
- **Rationale**: Explorar (agotado, `disponibles`), las reglas de edición del organizador (cupo ≥ vendidas, no quitar tipos con ventas) y la disponibilidad del panel ya leen `vendidas`. Mantenerlo evita recalcular sumas en cada pedido y no cambia ningún contrato existente.
- **Alternatives considered**: derivar `vendidas` sumando compras activas se descartó porque obliga a recorrer compras en cada tarjeta de Explorar y no cuadra con los números del seed, que tienen más vendidas que compras cargadas.

## R6. La compra guarda una copia del tipo de entrada

- **Decision**: `Compra` suma `tipoDeEntradaNombre` y `precioUnitario`, copiados al pagar. Mis compras y el Detalle de compra muestran esos valores, no los actuales del evento.
- **Rationale**: después de cancelar, un tipo puede quedar con 0 vendidas y el organizador puede borrarlo o renombrarlo. La compra tiene que seguir diciendo "Platea × 2" y su total (Assumption "precio congelado"). Del evento se siguen mostrando los datos actuales: nombre, fecha, sala e imagen.
- **Alternatives considered**: resolver siempre contra el evento se descartó porque rompe con tipos eliminados. Copiar el evento entero se descartó: es innecesario, y si el organizador corrige la sala, el comprador tiene que ver la nueva.

## R7. Reglas de compra en un servicio puro, acciones calculadas en el servidor

- **Decision**: `services/reglasCompra.js` con funciones puras que reciben `(compra, evento, ahora)`:
  - `puedeCompletarPago` → `estado === "Pendiente de pago" && fechaHora > ahora`.
  - `motivoNoCancelable` → `null` si se puede cancelar; si no, `UTILIZADA`, `EVENTO_REALIZADO`, `REEMBOLSADA` o `CANCELADA`, en ese orden de prioridad.
  - `estadoTrasCancelar` → Confirmada → Reembolsada, Pendiente → Cancelada.
  - `diasParaEvento` → `ceil((fechaHora − ahora) / 1 día)`, solo si está Confirmada y el evento es futuro; si no, `null`.

  El DTO expone `diasParaEvento`, `acciones { completarPago, cancelar }` y `motivoNoCancelable`.
- **Rationale**: "hoy" sale de `reloj.js` (los tests fijan 2026-11-09). Si el front recalculara con su reloj, los tests de integración no podrían verificar las notas ni la cuenta regresiva, y el front podría mostrar botones que el servidor rechaza. Las mismas funciones protegen los endpoints, así que pantalla y servicio no pueden discrepar.
- **Alternatives considered**: replicar las reglas en el front, como `validacionEvento.ts`, se descartó porque aquí dependen del reloj del servidor y no hay un formulario que validar en vivo.

## R8. Número de compra

- **Decision**: `comprasRepository.siguienteNumero()` lleva un contador inicializado con el mayor número del seed (A-1042) y devuelve `A-` + el número con al menos 4 dígitos (`A-1043`, …, `A-9999`, `A-10000`). Se llama dentro de la sección crítica de R2.
- **Rationale**: es el formato de `pantallas.md` y sigue el mismo patrón que `siguienteIdEvento()` (FR-027). Como el contador es secuencial, el número también desempata el orden de Mis compras.
- **Alternatives considered**: un número aleatorio se descartó porque puede colisionar y no ordena.

## R9. Seed: compras de Sofía

Se agregan a `comprasSeed` las cuatro compras de Sofía que faltaban (A-0655 ya existe) con un helper `compra(...)` que no califica. Las fechas `creadaEn` se eligen para respetar el orden del prototipo (A-1042 → A-0655). Detalle en [data-model.md](data-model.md#seed). Ninguna cambia `vendidas`, por R5.

## R10. Front: rutas y flujo

- **Decision**: pantallas nuevas dentro del `Stack.Protected guard={!!comprador}` de `(compradores)/_layout.tsx`:
  - `eventos/[id]/entradas`: Elegir entradas.
  - `eventos/[id]/pago`: Pago, con `tipo` y `cantidad` como parámetros. Pide el evento de nuevo para armar el Resumen con el precio vigente, y ese es el `precioUnitario` que se envía.
  - `compras/[numero]/confirmada`: Compra confirmada.
  - `mis-compras`: Mis compras.
  - `compras/[numero]`: Detalle de compra.

  El Menú de perfil es un componente `BottomSheet` (un `Modal`) que abre el Avatar de Explorar, no una ruta. Detalle en [contracts/rutas-front.md](contracts/rutas-front.md).
- **Navegación tras pagar**: `router.dismiss(2)` saca Pago y Elegir entradas y deja arriba la pantalla donde se tocó **Comprar** (Explorar o el Detalle del evento, sin que Pago necesite saber cuál). Después se hace `push` de Compra confirmada. **Ver mi compra** hace `replace` de la confirmación por el Detalle de compra. Así, Volver nunca vuelve al flujo de compra (FR-011, US1-9, US3-5).
- **409 en Pago**: `router.back()` a Elegir entradas y `setParams` con `aviso` (`lugares` | `precio`) y el nombre del tipo. Elegir entradas muestra el aviso, vuelve a pedir el evento, ajusta la cantidad y, si el tipo quedó Agotada o ya no existe, preselecciona el primer tipo con lugares (FR-028, FR-030). Un 404 muestra la pantalla "Este evento no está disponible." de la feature 003.
- **Recarga**: Mis compras y el Detalle de compra piden los datos con `useFocusEffect` cada vez que se muestran (FR-017).
- **Alternatives considered**: guardar el flujo en un contexto global de "carrito" se descartó porque los parámetros de ruta bastan y sobreviven a una recarga en web.

## R11. Componentes del design system nuevos

Todos están definidos en `design-system.md`, así que no hace falta inventar componentes:

- `RadioCard` (tipo de entrada y medio de pago, con estado deshabilitado "Agotada").
- `QuantityStepper` (con ayuda "Máximo N" / "Sin cupo").
- `PurchaseCard`, `DetailList`, `Dialog`, `BottomSheet` y `TagCompra` (estado de compra con ícono, `tag-lg` en el detalle).
- `MarcaDeExito` (marca de Compra confirmada).
- `ResumenCompra` (tarjeta Resumen de Pago).

Se reutilizan AppBar, ActionFooter, Button (primary, secondary, ghost, cta), Avatar, EstadoVacio e ImagenEvento.

## R12. Textos nuevos en `pantallas.md` antes del front (Principio I)

Se agregan antes de cualquier tarea de front:

- **Compradores 05 · Elegir entradas**: los avisos "Ya no quedan suficientes entradas de {tipo}." y "El precio de {tipo} cambió. Revisá tu compra.".
- **Compradores 08 · Mis compras**: el estado vacío "Todavía no compraste entradas — Cuando compres, vas a encontrarlas acá." con **Explorar eventos** (secundario).
- **Compradores 09 · Detalle de compra**: "No encontramos esta compra." con **Volver a Mis compras**.
- Que **Tengo una consulta**, **Calificar experiencia**, "Calificá tu experiencia" y **Datos personales** se ven pero no tienen acción hasta su feature (FR-029).

## R13. Formatos nuevos (`lib/formato.ts`)

- `cuentaRegresiva(dias)` → "Faltan N días" / "Falta 1 día", con la variante "… para el evento." para la confirmación.
- `entradas(tipo, cantidad)` → "Platea × 2".
- `numeroCompra(numero)` → "#A-1042".
- `fechaYHoraLarga(iso)` → "Sábado 21 de noviembre · 21:00 h" para el dato Fecha del Detalle de compra.

Se reutilizan `plata`, `fechaCorta`, `fechaLarga`, `hora` y `estrellas`.

## R14. Tests

- **Unitarios**: `reglasCompra` (cada transición, cada motivo, cuenta regresiva con redondeo hacia arriba y el mismo día), `comprasService` (comprar: visibilidad, precio, tipo eliminado, lugares, descuento, número, copia de tipo y precio, no devuelve `Promise`; completarPago; cancelar con liberación; listar ordenado; compra ajena → no encontrada), `comprasRepository` (siguienteNumero, listarPorComprador), `compraDto` y `comprarSchema`.
- **Integración, un archivo por historia**: `comprar.test.js` (US1), `misCompras.test.js` (US2), `detalleCompra.test.js` (US3), `completarPago.test.js` (US4), `cancelarCompra.test.js` (US5), `concurrencia.test.js` (SC-003). Además, `docs.test.js` suma los paths nuevos, y los tests de la 003 que cuentan compras del seed se revisan por las 4 compras nuevas.

## R15. Fecha simulada para la validación manual

- **Decision**: la lógica vive en `services/reloj.js` como `fijarAhoraDesdeEntorno(valor)`, con tests unitarios escritos antes (constitución, Principio II: no hay lógica nueva sin test):
  - Sin valor, no hace nada.
  - Con un ISO válido, fija el reloj y lo devuelve.
  - Con un valor inválido, lanza un error que nombra `FECHA_SIMULADA`.

  `index.js` solo la llama con `process.env.FECHA_SIMULADA` antes de `listen`: loguea la fecha o, si lanza, muestra el mensaje y termina. Sin la variable, todo sigue igual y se usa el reloj real.
- **Rationale**: las compras de ejemplo de Sofía dependen de "hoy" = 2026-11-09. Con el reloj real, A-1042 (Hamlet, 21/11) y A-1037 (Risas, 14/11) ya ocurrieron, y no se podrían probar a mano **Completar pago** ni **Cancelar compra** (US4, US5). `reloj.js` ya permite fijar la fecha (feature 002), así que solo falta exponerlo al arrancar.
- **Alternatives considered**: mover las fechas del seed al futuro se descartó porque rompe los ejemplos de `pantallas.md` y los tests de las features 002 y 003. Crear compras a mano para validar se descartó por tedioso y porque no cubre la compra Pendiente.
