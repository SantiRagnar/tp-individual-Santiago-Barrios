# Quickstart: validar Compra, pago simulado y Mis compras

Guía para comprobar la feature de punta a punta.

- Contratos: [compras.openapi.yaml](contracts/compras.openapi.yaml) y [rutas-front.md](contracts/rutas-front.md).
- Reglas, estados y seed: [data-model.md](data-model.md) (§ Seed).

Cuenta: `sofia.gomez@correo.com` con la contraseña de desarrollo `Entradas2026`.

Para que los resultados coincidan con el seed, el backend se levanta con `FECHA_SIMULADA=2026-11-09T12:00:00-03:00` (research R15), la misma hora que fijan los tests. Sin esa variable se usa el reloj real, y desde el 22/11 Hamlet y Risas a Domicilio ya ocurrieron.

## 1. Backend

```bash
cd aiTicketIt-back
npm test        # todo en verde: features 001–003 y los tests nuevos (comprar, misCompras, detalleCompra,
                # completarPago, cancelarCompra, concurrencia, docs)
FECHA_SIMULADA=2026-11-09T12:00:00-03:00 npm start
```

Con el backend levantado:

```bash
TOKEN=$(curl -s -X POST localhost:3000/compradores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"sofia.gomez@correo.com","contrasena":"Entradas2026"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
AUTH="Authorization: Bearer $TOKEN"
JSON='Content-Type: application/json'

# Mis compras → A-1042, A-1037, A-0871, A-0790, A-0655 (en ese orden).
# A-1042 con diasParaEvento 13; A-0655 con calificación 4.
curl -s localhost:3000/compradores/compras -H "$AUTH"

# Comprar Platea × 2 de Hamlet → 201, número A-1043, monto 36000, Confirmada
curl -s -X POST localhost:3000/compradores/compras -H "$AUTH" -H "$JSON" \
  -d '{"eventoId":"evt-1","tipoDeEntradaId":"tip-2","cantidad":2,"medioDePago":"Tarjeta de crédito","precioUnitario":18000}'

# La Platea pasó de 12 a 10 disponibles
curl -s localhost:3000/compradores/eventos/evt-1 -H "$AUTH"

# Precio distinto del actual → 409 PRECIO_CAMBIADO (no se crea nada)
curl -s -X POST localhost:3000/compradores/compras -H "$AUTH" -H "$JSON" \
  -d '{"eventoId":"evt-1","tipoDeEntradaId":"tip-2","cantidad":1,"medioDePago":"Mercado Pago","precioUnitario":15000}'

# Más lugares que los disponibles (VIP agotado) → 409 LUGARES_INSUFICIENTES
curl -s -X POST localhost:3000/compradores/compras -H "$AUTH" -H "$JSON" \
  -d '{"eventoId":"evt-1","tipoDeEntradaId":"tip-3","cantidad":1,"medioDePago":"Mercado Pago","precioUnitario":26000}'

# Cantidad 11 → 400 DATOS_INVALIDOS. Evento Borrador (evt-8) → 404 EVENTO_NO_ENCONTRADO.
curl -s -X POST localhost:3000/compradores/compras -H "$AUTH" -H "$JSON" \
  -d '{"eventoId":"evt-1","tipoDeEntradaId":"tip-1","cantidad":11,"medioDePago":"Mercado Pago","precioUnitario":12000}'
curl -s -X POST localhost:3000/compradores/compras -H "$AUTH" -H "$JSON" \
  -d '{"eventoId":"evt-8","tipoDeEntradaId":"tip-13","cantidad":1,"medioDePago":"Mercado Pago","precioUnitario":14000}'

# Completar pago de A-1037 → 200, Confirmada. Repetirlo → 409 PAGO_NO_PERMITIDO.
curl -s -X POST localhost:3000/compradores/compras/A-1037/pago -H "$AUTH"
curl -s -X POST localhost:3000/compradores/compras/A-1037/pago -H "$AUTH"

# Cancelar A-1042 → 200, Reembolsada; la Platea suma 2 disponibles.
# Cancelar A-0871 (Utilizada) → 409 CANCELACION_NO_PERMITIDA.
curl -s -X POST localhost:3000/compradores/compras/A-1042/cancelacion -H "$AUTH"
curl -s -X POST localhost:3000/compradores/compras/A-0871/cancelacion -H "$AUTH"

# Compra de otro comprador (A-0612 es de Martín) → 404 COMPRA_NO_ENCONTRADA
curl -s localhost:3000/compradores/compras/A-0612 -H "$AUTH"
```

En `http://localhost:3000/docs` aparece el tag **Compras** con los 5 endpoints, sus cuerpos y sus errores.

## 2. Front

```bash
cd aiTicketIt-front
npx expo start      # una vez, para regenerar .expo/types con las rutas nuevas
npm run lint
npx tsc --noEmit
```

Antes de probar el front, verificar que `Diseño de AI Ticket It/pantallas.md` tiene los textos nuevos de 05, 08 y 09 (research R12).

Recorrido en mobile (390 × 844) o en web, después de reiniciar el backend para volver al seed:

| # | Paso | Resultado esperado | Cubre |
|---|---|---|---|
| 1 | Ingresar y tocar el Avatar en Explorar | BottomSheet con "Sofía Gómez", "Mi perfil", Mis compras, Favoritos, Datos personales y Cerrar sesión | US2-1, FR-002 |
| 2 | Tocar **Datos personales** | No pasa nada | FR-029 |
| 3 | **Mis compras** | 5 PurchaseCard en orden A-1042 → A-0655; Hamlet "Faltan 13 días"; Cartas con la imagen al 40 %; Edipo "Calificaste ★★★★☆"; Tango "Calificá tu experiencia" (sin acción) | US2-3 a 6, FR-014, FR-029 |
| 4 | Abrir A-1042 | Tag grande Confirmada + "Faltan 13 días"; Fecha, Lugar, Entradas "Platea × 2", Total "$ 36.000", Pago "Tarjeta de crédito", Compra "#A-1042"; **Tengo una consulta** (sin acción) y **Cancelar compra** | US3-1 |
| 5 | Abrir A-0871 y A-0790 | Notas "No se puede cancelar: la entrada ya fue utilizada." y "Compra cancelada. El reembolso ya fue acreditado."; sin **Cancelar compra** | US3-3 |
| 6 | Explorar → Hamlet → **Comprar** | "Elegí tus entradas" · "Hamlet en el Galpón · Sáb 21 nov · 21:00"; VIP "Agotada" deshabilitada; General preseleccionada "Quedan 84"; cantidad 1, "Máximo 10" | US1-1 a 3 |
| 7 | Elegir Platea y subir a 2; probar subir más allá de 10 con General | "Total $ 36.000"; el stepper no pasa de 10 | US1-3, 4 |
| 8 | **Continuar al pago** | Resumen, 4 medios sin elegir, nota de pago simulado, **Pagar $ 36.000** deshabilitado | US1-5, 6 |
| 9 | Elegir Tarjeta de crédito → **Pagar $ 36.000** | "¡Compra confirmada!", "Hamlet en el Galpón · Platea × 2", "Compra #A-1043", "Faltan 13 días para el evento." | US1-7, 8 |
| 10 | Volver (gesto o botón atrás) | Vuelve al Detalle del evento, no a Pago | US1-9, FR-011 |
| 11 | Abrir Mis compras | A-1043 primera | SC-002 |
| 12 | Comprar de nuevo Platea: en Pago, sin pagar, ejecutar con curl una compra de 9 plateas; después tocar **Pagar** con cantidad 2 | Vuelve a Elegir entradas con "Ya no quedan suficientes entradas de Platea." y "Quedan 1" | FR-028 |
| 13 | En Pago, cambiar el precio de la Platea desde el panel del organizador (`produccion@latrama.com.ar`); después **Pagar** | "El precio de Platea cambió. Revisá tu compra." en Elegir entradas, con el precio nuevo | FR-030 |
| 14 | Abrir A-1037 → **Completar pago** | Pasa a Confirmada con cuenta regresiva; desaparece **Completar pago** | US4 |
| 15 | Abrir A-1042 → **Cancelar compra** → **Volver** | Dialog con "Se reintegrarán $ 36.000 a tu Tarjeta de crédito. Esta acción no se puede deshacer."; Volver no cambia nada | US5-2, 4 |
| 16 | **Cancelar compra** → confirmar | Reembolsada, imagen al 40 % en Mis compras, nota "Compra cancelada. El reembolso ya fue acreditado."; en Elegir entradas de Hamlet, la Platea suma 2 lugares | US5-3 |
| 17 | Ingresar con `martin.perez@correo.com` → Mis compras | Solo sus compras de la feature 003; ninguna de Sofía | FR-001, SC-004 |
| 18 | Abrir `/compras/A-1042` siendo Martín | "No encontramos esta compra." + **Volver a Mis compras** | FR-021 |
| 19 | Cortar el backend y tocar **Pagar** | "No pudimos conectarnos. Probá de nuevo en un rato."; no se crea ninguna compra | Edge cases |
| 20 | Menú de perfil → **Cerrar sesión** | Vuelve al Ingreso | FR-002 |

Los casos de concurrencia (SC-003), el día del evento (cuenta regresiva "Falta 1 día") y el evento que deja de estar visible durante la compra los cubren los tests de integración (`concurrencia.test.js` y `comprar.test.js`).

## Validación realizada (2026-11-22)

- **Backend**: `npm test` → 390 tests en verde (features 001–004). Los curls de la sección 1, con `FECHA_SIMULADA=2026-11-09T12:00:00-03:00`, dieron exactamente lo esperado: orden de Mis compras, A-1043 Confirmada por $ 36.000, Platea 12 → 10, `PRECIO_CAMBIADO`, `LUGARES_INSUFICIENTES`, `DATOS_INVALIDOS`, `EVENTO_NO_ENCONTRADO`, `PAGO_NO_PERMITIDO`, `CANCELACION_NO_PERMITIDA`, `COMPRA_NO_ENCONTRADA` y los 4 paths en `/docs.json`.
- **Front** (`npx tsc --noEmit` y `npm run lint` sin errores ni warnings). Se recorrió en web (Chrome, ventana de escritorio: el resize a 390 px no se aplicó) con el backend en el puerto 3100 y la fecha simulada. Pasos verificados:
  - 1 y 3: menú de perfil y Mis compras con las 5 compras, "Faltan 13 días", Cartas atenuada y "Calificaste ★★★★☆".
  - 4: Detalle de A-1042 con los 6 datos.
  - 15 y 16: Dialog con el texto de reintegro, **Volver** sin cambios, cancelación → Reembolsada con su nota; en Elegir entradas, la Platea muestra "Quedan 14".
  - 6 a 10: Elegir entradas (General preseleccionada "Quedan 84", VIP Agotada), Platea × 2 = $ 36.000, Pago con **Pagar** deshabilitado sin medio, confirmación #A-1043 con "Faltan 13 días para el evento.", y atrás vuelve a Explorar, no a Pago.
  - 11: A-1043 primera en Mis compras.
  - 14: **Completar pago** de A-1037 → Confirmada.
  - 18: A-0612 → "No encontramos esta compra." + **Volver a Mis compras**.
- **Quedan cubiertos solo por tests**: 12 y 13 (lugares agotados y precio cambiado entre Elegir y Pagar: `comprar.test.js`, que verifica la respuesta 409; la navegación de vuelta con el aviso no se probó en el navegador), 17 (compras de otro comprador: `misCompras.test.js`), 19 (sin conexión), 20 (cerrar sesión), concurrencia (`concurrencia.test.js`) y "Falta 1 día" (`reglasCompra.test.js`).
- Se corrigió durante el recorrido: el número de compra de la confirmación no estaba centrado.
