# Quickstart: Consultas (chat de la compra)

Guía para validar la feature de punta a punta. Endpoints: [contracts/consultas.openapi.yaml](contracts/consultas.openapi.yaml). Pantallas: [contracts/rutas-front.md](contracts/rutas-front.md). Datos del seed: [data-model.md § Seed](data-model.md#seed-consultasseed-en-repositoryseedjs-fr-018).

## Levantar (puertos de esta feature, research R13)

```bash
# Backend en el 3007 (la feature 006 usa otros puertos en paralelo)
cd aiTicketIt-back
PORT=3007 npm start

# Front en el 8087, apuntando a ese backend
cd aiTicketIt-front
EXPO_PUBLIC_API_URL=http://localhost:3007 npx expo start --port 8087
```

- **Comprador**: web mobile (DevTools en 390 × 844) o Expo Go, con `sofia.gomez@correo.com` / `Entradas2026`.
- **Organizador**: otra ventana de navegador (o una ventana privada, para que la sesión sea independiente) en `/organizadores`, con `produccion@latrama.com.ar` / `Entradas2026`.

## Tests automáticos

```bash
cd aiTicketIt-back && npm test        # todos verdes, incluidos los consultas*.test.js nuevos
cd aiTicketIt-front && npm run lint && npx tsc --noEmit
```

`/docs` en `http://localhost:3007/docs` muestra los tags **Consultas (comprador)** y **Consultas (organizador)**.

## Escenarios manuales

| # | Pasos | Resultado esperado | Cubre |
|---|---|---|---|
| 1 | Sofía → Menú de perfil → Mis compras | La tarjeta #A-1037 (Risas) tiene el punto de no leído; #A-1042 no | FR-023, seed |
| 2 | Abrir #A-1037 | **Tengo una consulta** tiene el punto | FR-023 |
| 3 | Tocar **Tengo una consulta** | AppBar "Risas a Domicilio" / "Club del Chiste · Compra #A-1037"; mensajes de Sofía a la derecha, del organizador a la izquierda, con hora "Vie 6 nov · 16:30" (no son de hoy); la vista termina en el último | US1 1–2, FR-005 |
| 4 | Volver al Detalle y a Mis compras | Ya no hay punto en #A-1037 | US6 2 |
| 5 | Abrir el chat de una compra sin mensajes (p. ej. #A-0790) | "Todavía no hay mensajes — Escribí tu consulta y Producciones Lumbre te va a responder acá."; el compositor funciona aunque la compra esté Reembolsada | US1 5–6, FR-026 |
| 6 | Escribir solo espacios | El botón enviar está deshabilitado; Enter no envía | US1 4 |
| 7 | Organizador: Mis eventos → Hamlet en el Galpón | **Consultas del evento** habilitado con contador **1** | US2 1, FR-009 |
| 8 | Clic en **Consultas del evento** | La lista tiene la conversación de Sofía (#A-1042, con punto) y la de `cmp-6` (sin punto), la de Sofía primero; a la derecha, "Elegí una conversación para ver los mensajes." | US2 2–3, US3 5 |
| 9 | Abrir la conversación de Sofía | Cabecera "Sofía Gómez", "Compra #A-1042 · Platea × 2 · $ 36.000", Tag Confirmada; desaparece el punto | US2 4, US3 2 |
| 10 | Con el chat de #A-1042 abierto en las **dos** ventanas, el organizador responde "Sí, hay lugar para dejarlo en el hall." | Para el organizador, aparece a la derecha y la conversación sube primera. **En menos de 5 s**, para Sofía aparece a la izquierda sin tocar nada y no hay toast | US2 5, FR-021, US6 5 |
| 11 | Sofía va a Explorar; el organizador escribe otro mensaje en #A-1042 | En menos de 5 s aparece el toast "Nuevo mensaje de Compañía La Trama" / "Hamlet en el Galpón · Compra #A-1042"; tocarlo abre el chat | US6 3–4, FR-024 |
| 12 | Repetir el 11 sin tocar el toast | El toast se va a los 5 s; Mis compras muestra el punto en #A-1042; no vuelve a aparecer el toast al cambiar de pantalla | US6 4, FR-025 |
| 13 | Sofía responde desde el chat; el organizador está en Consultas de Hamlet sin elegir la conversación | En menos de 5 s, la conversación de Sofía muestra el punto y sube primera; al volver al panel, el contador es 1 | US3 1 y 3, FR-021 |
| 14 | Panel de Hamlet → botón de chat de una fila sin mensajes | Consultas con esa compra abierta: "Todavía no hay mensajes con {comprador}."; no está en la lista. Al enviar, aparece primera en la lista | US4 |
| 15 | Panel de Impro Express (Club del Chiste) con la sesión de La Trama, escribiendo a mano `/organizadores/eventos/{id}/consultas` | "No encontramos el evento." + link a Mis eventos | US5 2 |
| 16 | Sofía abre a mano `/compras/A-9999/consulta` | "No encontramos esta compra." + **Volver a Mis compras** | US5 1 |
| 17 | Cortar el backend con el chat abierto e intentar enviar | El texto queda en el compositor y aparece "No pudimos conectarnos. Probá de nuevo en un rato."; al levantar el backend, se reenvía bien | FR-019 |
| 18 | Pegar 1001 caracteres | El compositor corta en 1000 y muestra "1000/1000" | FR-003, edge case |

## Con `curl` (opcional)

```bash
TOKEN=$(curl -s -X POST localhost:3007/compradores/sesiones -H 'Content-Type: application/json' \
  -d '{"email":"sofia.gomez@correo.com","contrasena":"Entradas2026"}' | jq -r .token)
curl -s localhost:3007/compradores/consultas/no-leidas -H "Authorization: Bearer $TOKEN" | jq
curl -s -X POST localhost:3007/compradores/compras/A-1042/mensajes -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"texto":"   "}' | jq   # 400 DATOS_INVALIDOS "Escribí un mensaje"
```
