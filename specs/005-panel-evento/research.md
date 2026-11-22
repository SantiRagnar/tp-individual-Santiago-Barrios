# Research: Panel del evento (organizadores)

Decisiones técnicas de la feature 005. Parten de lo construido en las features 001 a 003: capas del backend, `requiereSesion`, `validarQuery`, `cursor.js`, `reloj.js`, `comprasRepository` y la versión mínima de Organizadores 04. También se alinean con el plan de la feature 004 (compra, pago y Mis compras), que se desarrolla en paralelo en `Feature/004-compra-pago-mis-compras` y toca las mismas compras y el mismo seed. No quedan puntos `NEEDS CLARIFICATION`: los de la spec se resolvieron en sus Clarifications.

## R1. Endpoints: uno para la cabecera y la disponibilidad, otro para ventas y resumen

- **Decision**:
  - La cabecera y la **Disponibilidad por tipo de entrada** usan el endpoint existente `GET /organizadores/eventos/{id}`. Ya devuelve título, fecha, ubicación, estado y, por tipo, `nombre`, `cupo`, `precio`, `vendidas` y `disponibles`. No cambia.
  - `GET /organizadores/eventos/{id}/ventas?estado=&cursor=` devuelve `{ resumen, ventas, siguiente }`. `resumen` tiene `recaudado`, `entradasVendidas`, `comprasActivas` y `porEstado` (contador de cada chip). `ventas` es una página de hasta 20 filas.
  - `POST /organizadores/eventos/{id}/ventas/{numero}/utilizacion` marca una compra como utilizada y devuelve `{ venta, resumen }`.
- **Rationale**: el evento ya tiene su contrato y lo usan el Detalle mínimo y Editar evento, así que agregarle ventas lo engordaría para Editar. Si `resumen` viaja con cada página de ventas, los contadores de los chips y Recaudado quedan siempre al día: al cambiar de chip, al tocar **Ver más** y después de marcar utilizada. Además el front no tiene que calcular nada. El verbo de acción (`POST …/utilizacion`) sigue el patrón de la feature 004 (`POST /compradores/compras/{numero}/pago`, `…/cancelacion`).
- **Alternatives considered**: `PATCH /compras/{numero} { estado }` se descartó por la misma razón que en la 004: deja la máquina de estados en manos del cliente. Un `GET …/resumen` separado se descartó porque obliga a coordinar dos pedidos cada vez que cambia algo. Calcular Recaudado en el front a partir de los tipos se descartó porque `comprasActivas` y `porEstado` igual salen del servidor, y la constitución (III) pide que los cálculos de negocio vivan en `services/`.

## R2. Recaudado y contadores

- **Decision**: `ventasService.resumen(evento)` calcula:
  - `recaudado` = Σ (`tipo.vendidas` × `tipo.precio`), con precio `null` = 0 (Borrador incompleto).
  - `entradasVendidas` = Σ `tipo.vendidas`.
  - `comprasActivas` = cantidad de compras del evento que no están Canceladas ni Reembolsadas.
  - `porEstado` = `{ Todas, "Pendiente de pago", Confirmada, Utilizada, Cancelada, Reembolsada }`, con el total del evento en cada estado.
  Se recorren las compras del evento (como mucho unas cientos) en cada pedido.
- **Rationale**: es la fórmula de `pantallas.md` ("Recaudado = Σ vendidas × precio por tipo") y FR-006. Recorrer cientos de compras en memoria es instantáneo; un acumulado incremental como el de reseñas (research R8 de la 003) agregaría estado que mantener en tres lugares (comprar, cancelar, marcar) sin ganancia visible.
- **Alternatives considered**: sumar los `monto` de las compras activas se descartó porque contradice la fórmula del diseño y porque las `vendidas` son la fuente de verdad de los lugares (R5 de la 004).

## R3. Índice de compras por evento y paginación por cursor

- **Decision**: `comprasRepository` suma un índice `Map<eventoId, Compra[]>` ordenado por `[creadaEn desc, numero desc]`, mantenido con inserción ordenada en `guardar()` (igual que el índice de calificadas). Operaciones nuevas:
  - `listarPorEvento(eventoId, { estado, despuesDe, limite })`: filtra por estado si se indica y empieza después de la clave `[creadaEn, numero]`.
  - `todasDelEvento(eventoId)`: para el resumen.
  `ventasService.pagina(organizadorId, eventoId, { estado, cursor })` pide 21 compras y devuelve 20 más `siguiente = codificar([creadaEn, numero])` de la última si había una de más (mismo truco que `resenasService`). El cursor se decodifica con `cursor.js`. Uno inválido responde 400 `DATOS_INVALIDOS` en el campo `cursor`.
- **Rationale**: reutiliza el cursor opaco de la 003 y su patrón "pedir uno de más". La clave `[creadaEn, numero]` es única y no cambia al marcar utilizada, así que la paginación es estable aunque cambien los estados. Si una compra deja de cumplir el filtro entre dos páginas, simplemente no aparece: no hay saltos ni repetidos.
- **Alternatives considered**: offset/limit se descartó por la convención de la 003 (paginación por cursor, CLAUDE.md). Recorrer todas las compras (`porNumero`) en cada página se descartó porque crece con todas las compras del sistema, no con las del evento.

## R4. Ventana para marcar utilizada: desde el día del evento, hora de Argentina

- **Decision**: `reglasVenta.puedeMarcarUtilizada(compra, evento, ahora)` es `true` si `compra.estado === "Confirmada"` y `ahora ≥ inicioDelDiaEnArgentina(evento.fechaHora)`. `inicioDelDiaEnArgentina(iso)` toma el instante, le resta 3 horas, se queda con la fecha (año-mes-día UTC) y devuelve `YYYY-MM-DDT00:00:00-03:00`. Argentina usa UTC−3 fijo, sin horario de verano. Un evento sin `fechaHora` (Borrador) no tiene compras, y la función devuelve `false`. La misma función:
  - Arma `acciones.marcarUtilizada` de cada fila (el front muestra el botón solo si es `true`).
  - Protege el endpoint: si no es Confirmada responde 409 `COMPRA_NO_CONFIRMADA`, y si todavía no es el día, 409 `EVENTO_NO_COMENZO`.
- **Rationale**: Clarification del 2026-11-22. Que la regla viva en el servidor y salga en la respuesta (como `acciones` en la 004) evita que el reloj del navegador muestre un botón que el servidor después rechaza, y permite probarla con `fijarAhora()`.
- **Alternatives considered**: comparar contra `fechaHora` exacta se descartó porque la clarificación dice "desde las 00:00 del día" (el ingreso empieza antes de la función). Usar la zona horaria del proceso (`toLocaleDateString`) se descartó porque depende de la máquina donde corre el backend.

## R5. Concurrencia al marcar utilizada

- **Decision**: `ventasService.marcarUtilizada` es sincrónico: busca, verifica con `reglasVenta` y cambia `compra.estado`, todo sin `await` en el medio. Una segunda marca sobre la misma compra encuentra `Utilizada` y responde 409 `COMPRA_NO_CONFIRMADA` ("La compra ya no está confirmada."). Ante ese 409, el front recarga la primera página y el resumen (US3 escenario 4).
- **Rationale**: Node atiende un pedido por vez entre `await`s; es el mismo criterio que el R2 de la 004. No hace falta ningún lock.
- **Alternatives considered**: hacer idempotente la marca (responder 200 si ya está Utilizada) se descartó porque la spec pide avisar al segundo organizador que la compra ya no estaba Confirmada.

## R6. Propiedad: compra de un evento ajeno = inexistente

- **Decision**: `ventasService` primero llama a `eventosService.obtener(organizadorId, eventoId)`, que lanza 404 `EVENTO_NO_ENCONTRADO` si el evento es ajeno o no existe. Al marcar, además exige `compra.eventoId === eventoId`: si la compra no existe o es de otro evento, responde 404 `COMPRA_NO_ENCONTRADA` ("No encontramos la compra."). Usa el mismo código que la 004 para no duplicar errores al mergear.
- **Rationale**: FR-003, FR-014 y US4. Anidar la compra bajo el evento hace que no se pueda marcar una compra ajena cambiando solo el número.
- **Alternatives considered**: `POST /organizadores/ventas/{numero}/utilizacion` sin el evento se descartó porque obliga a buscar el organizador a partir de la compra y abre la puerta a mensajes distintos para compras ajenas e inexistentes.

## R7. Vista de una venta (fila de la tabla)

- **Decision**: `dto/ventaDto.js` arma `{ numero, comprador: { nombre }, tipoDeEntrada: { id, nombre }, cantidad, estado, medioDePago, monto, creadaEn, acciones: { marcarUtilizada } }`.
  - `comprador.nombre` es "Nombre Apellido" o, si falta, el email.
  - `tipoDeEntrada.nombre` sale del tipo actual del evento buscado por id. Un tipo con ventas no se puede quitar (feature 002), así que siempre existe. Cuando se mergee la 004, se prefiere `compra.tipoDeEntradaNombre` si existe.
  El número viaja sin "#" y el front lo muestra como "#A-1042". El front no trae ni muestra el email cuando hay nombre.
- **Rationale**: la tabla solo necesita esas columnas. No exponer email ni ids internos del comprador minimiza los datos personales que ve el organizador. La 004 copia el nombre del tipo al comprar, pero hasta que se mergee no existe ese campo.
- **Alternatives considered**: reutilizar la vista `Compra` de la 004 se descartó porque está pensada para el comprador (incluye cuenta regresiva y acciones de cancelar o pagar) y todavía no existe en este branch.

## R8. Seed: compras que suman exactamente las vendidas

- **Decision**: `repository/seed.js` agrega una función pura `generarVentasDeEjemplo(eventos, comprasExistentes)` que produce, en orden y de forma determinística (sin `Math.random`), las compras que faltan para que cada tipo de entrada cuadre:
  1. **Compras base**: las calificadas de la 003, más las cuatro de Sofía de `pantallas.md` (A-1042, A-1037, A-0871, A-0790). Estas últimas van con los mismos datos y el mismo `creadaEn` que el data-model de la 004, para que el merge sea idéntico.
  2. **Faltantes por tipo**: `faltan = vendidas − Σ cantidad de compras base Pendientes, Confirmadas o Utilizadas`. Se cubren con compras de cantidad tomada del ciclo `[2, 1, 4, 2, 3, 1, 2, 6, 2, 3]` (la última se recorta a lo que falta).
  3. **Compradores**: diez compradores nuevos (`cmp-6` a `cmp-15`), rotando. No se usan Sofía (`cmp-1`) ni los autores de reseñas (`cmp-2` a `cmp-5`), para no cambiar Mis compras de la 004 ni los tests de la 003.
  4. **Medio de pago**: rota entre los cuatro.
  5. **Estado**, según la fecha del evento comparada con la referencia del seed (2026-11-09):
     - Eventos pasados: Utilizada, y cada 7.ª Confirmada (sin usar). El índice cuenta las compras generadas de cada evento desde 1, recorriendo sus tipos en orden.
     - Eventos futuros: Confirmada, y cada 6.ª Pendiente de pago.
     Las generadas nunca tienen calificación, así que los puntajes 4.5 / 4.0 / 3.7 de la 003 no cambian.
  6. **Canceladas y Reembolsadas**: cada evento futuro con ventas suma una Cancelada (cantidad 1) y una Reembolsada (cantidad 2). Cartas a Julieta solo suma la Cancelada, porque ya tiene A-0790 Reembolsada. No cuentan en las vendidas.
  7. **`creadaEn`**: se reparte uniformemente entre `creadoEn` del evento y el día anterior a la fecha del evento, o 2026-11-08 si el evento es posterior. Hora 10:00 + índice, para que no haya empates.
  8. **Números**: `A-0100` en adelante, saltando los existentes. Quedan todos por debajo de `A-0540`, así que el próximo número de la 004 (`A-1043`, el mayor + 1) no cambia.
  El seed exporta `comprasSeed = [...base, ...generarVentasDeEjemplo(eventosSeed, base)]`. Un test unitario verifica, para cada tipo, que Σ cantidad de compras activas = `vendidas`, y que los números sean únicos.
- **Rationale**: Clarification Q3 / FR-018. Generar en vez de escribir a mano unas 300 filas mantiene el seed legible y la suma correcta por construcción. Elegir compradores, números y calificaciones que no se pisen con los de la 003 y la 004 evita romper sus tests.
- **Alternatives considered**: escribir las ~300 compras a mano se descartó por ilegible y propenso a errores. Recalcular `vendidas` desde las compras se descartó en la spec (Q3 opción C). Usar a Sofía y a los autores de reseñas se descartó por lo dicho en el punto 3.

## R9. Fecha simulada para probar a mano

- **Decision**: se adopta tal cual la decisión de la 004: `index.js` lee `FECHA_SIMULADA` (ISO 8601) y, si es válida, llama a `fijarAhora()` antes de `listen`. Si la de la 004 se mergea primero, esta tarea se omite.
- **Rationale**: con el reloj real (hoy, 2026-11-22), Hamlet y Risas ya se ven Finalizados y sus Confirmadas se pueden marcar, pero no se puede ver el caso "evento futuro sin botón" con datos del seed salvo con Bodas o Impro. Con `FECHA_SIMULADA=2026-11-21T20:00:00-03:00` se prueba Hamlet en su propio día.
- **Alternatives considered**: mover fechas del seed se descartó por romper tests de 002 y 003.

## R10. Front: pantalla, componentes y paginación

- **Decision**:
  - `src/app/organizadores/eventos/[id]/index.tsx` deja de ser la versión mínima. Mantiene la cabecera y agrega las secciones `Disponibilidad`, `StatCard` y `Ventas`.
  - Componentes nuevos del design system en `src/components/ds/`:
    - `StatCard` (kicker, cifra `type-stat` tabular y aclaración).
    - `DisponibilidadTipo` (nombre · precio, `ProgressBar` variante `lg` y textos).
    - `TablaVentas` (DataTable con encabezado en mayúsculas 11px muted, filas `type-body-sm`, números y montos tabulares, montos y acciones a la derecha).
    - `TagEstadoCompra` (estados de compra).
  - `ProgressBar` suma la prop `variante: 'fino' | 'lg'`. `lg` mide 10px con degradé `accent-700` → `accent`; en web va como `background-image` y en nativo como un color plano `accent`, porque el proyecto no usa `expo-linear-gradient`.
  - Los chips usan el `FilaDeChips` existente, con la etiqueta "Confirmadas 12".
  - La tabla usa `useListaPaginada` (003) con `clave = estado` e `id = numero`, y **Ver más** en vez de scroll infinito: el hook expone `cargarMas()`, y la pantalla lo llama desde el botón.
  - Llamadas nuevas en `src/api/ventas.ts`: `listarVentas(token, eventoId, { estado, cursor, signal })` y `marcarUtilizada(token, eventoId, numero)`. Pasan `token` y `tipo: 'organizador'` a `pedir()`.
  - Después de marcar, la fila se reemplaza en el lugar. Si el filtro activo es Confirmadas, se quita. El `resumen` de la respuesta actualiza los chips y el StatCard sin recargar la lista (SC-004). Ante 409, se recarga.
  - "1 entrada vendida" / "N entradas vendidas" y "1 compra activa" / "N compras activas" van en `src/lib/formato.ts`.
- **Rationale**: reusa el hook de paginación y los chips existentes; los componentes nuevos son los que el design system ya define (StatCard, DataTable, `progress-lg`), sin inventar UI (principio I). Si la 004 también crea `TagEstadoCompra`, se queda una sola versión al mergear.
- **Alternatives considered**: agregar `expo-linear-gradient` solo para la barra se descartó por ser una dependencia nueva para un detalle visual que en web sale con CSS. Usar scroll infinito como Explorar se descartó porque la clarificación pidió **Ver más**.

## R11. Puertos de desarrollo de esta sesión

- **Decision**: mientras dure esta feature, el backend corre con `PORT=3005 npm start` y el front con `EXPO_PUBLIC_API_URL=http://localhost:3005 npx expo start --web --port 8085`. No se cambian los valores por defecto del código (3000 y 8081); solo se usan variables y flags al levantar.
- **Rationale**: lo pidió el usuario porque hay otra sesión (feature 004) usando los puertos por defecto al mismo tiempo. `ALLOWED_ORIGINS` no se define, así que CORS acepta el origen `http://localhost:8085`.
- **Alternatives considered**: cambiar el puerto por defecto en `index.js` o en `app.json` se descartó porque afectaría a la otra sesión y al resto del equipo después del merge.

## R12. Tests

- **Unitarios** (`tests/unit/`):
  - `reglasVenta.test.js`: Confirmada antes, durante y después del día del evento; borde 00:00 −03:00 y 23:59 del día anterior; cada estado no Confirmado.
  - `ventasService.test.js`: resumen con y sin ventas y con precio `null`; página de 20, `siguiente`, filtro, cursor inválido; marcar OK, ajena, otro evento, no Confirmada, antes de tiempo; no devuelve `Promise`.
  - `comprasRepository.test.js`: `listarPorEvento` con orden, filtro y cursor.
  - `ventaDto.test.js`: nombre o email y acciones.
  - `seed.test.js`: suma = vendidas por tipo, números únicos y < A-0540, sin calificaciones nuevas, al menos una Cancelada o Reembolsada por evento futuro con ventas.
  - `ventasSchema.test.js`: estado válido o inválido y cursor.
- **Integración, un archivo por historia** (`tests/integration/`):
  - `panelDisponibilidad.test.js` (US1): `GET /organizadores/eventos/evt-1` y el resumen de `/ventas` con Hamlet (recaudado 2.536.000, 154 vendidas), Borrador en 0.
  - `panelVentas.test.js` (US2): columnas, orden, chips, filtro sin resultados, 20 + Ver más hasta el final.
  - `marcarUtilizada.test.js` (US3): con `fijarAhora` el día del evento, 200 y resumen actualizado; el día anterior, 409; doble marca, 409.
  - `panelPropiedad.test.js` (US4): evento ajeno o inexistente 404 en los dos endpoints, sin sesión 401, compra de otro evento 404.
  - `docs.test.js`: suma los dos paths nuevos.
  - Los tests de la 002 y la 003 que dependan de la cantidad de compradores o compras del seed se revisan. Hoy ninguno cuenta compras ni compradores.
