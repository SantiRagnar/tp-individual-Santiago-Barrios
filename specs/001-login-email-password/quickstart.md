# Quickstart: validar el ingreso de compradores y organizadores

Guía para comprobar de punta a punta que la feature funciona. Contratos: [sesiones.openapi.yaml](contracts/sesiones.openapi.yaml) y [rutas-front.md](contracts/rutas-front.md). Datos: [data-model.md](data-model.md).

## Cuentas de ejemplo

Todas usan la contraseña de desarrollo **`Entradas2026`**. Es solo para desarrollo: en el seed se guarda únicamente su hash.

| App | Email |
|---|---|
| Compradores | `sofia.gomez@correo.com` |
| Organizadores | `produccion@latrama.com.ar` |
| Organizadores | `hola@clubdelchiste.com.ar` |
| Organizadores | `contacto@lumbre.com.ar` |

## 1. Backend

```bash
cd aiTicketIt-back
npm install
npm test          # todos los tests en verde (node --test)
npm start         # http://localhost:3000, docs en /docs
```

Comprobar a mano (con el backend levantado):

```bash
# Ingreso correcto de comprador → 201 con token y comprador (sin contraseña ni hash)
curl -s -X POST localhost:3000/compradores/sesiones \
  -H 'Content-Type: application/json' \
  -d '{"email":" Sofia.Gomez@correo.com ","contrasena":"Entradas2026"}'

# Contraseña incorrecta → 401 CREDENCIALES_INVALIDAS "El email o la contraseña no son correctos."
# Cuenta de organizador en /compradores/sesiones → mismo 401
# Email inválido → 400 DATOS_INVALIDOS con campos[].mensaje "Ingresá un email válido"

# Sesión actual y cierre (reemplazar $TOKEN)
curl -s localhost:3000/compradores/sesiones/actual -H "Authorization: Bearer $TOKEN"     # 200
curl -s localhost:3000/organizadores/sesiones/actual -H "Authorization: Bearer $TOKEN"   # 401 (otro tipo)
curl -s -X DELETE localhost:3000/compradores/sesiones/actual -H "Authorization: Bearer $TOKEN"  # 204
curl -s localhost:3000/compradores/sesiones/actual -H "Authorization: Bearer $TOKEN"     # 401
```

Resultado esperado en `/docs`: aparecen los 6 endpoints de los dos tags de sesiones, con las respuestas 201, 200, 204, 400 y 401 documentadas.

## 2. Front

```bash
cd aiTicketIt-front
npx expo install   # dependencias nuevas de la feature
# En un dispositivo físico: EXPO_PUBLIC_API_URL=http://<IP-de-tu-máquina>:3000
npx expo start     # w para web, a/i para emulador o Expo Go
npm run lint && npx tsc --noEmit
```

## 3. Escenarios de aceptación

| # | Paso | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Abrir la app (dirección `/`) sin sesión | Compradores 01 · Ingreso. "o", Google, Apple y "Registrate" visibles al 45% y sin respuesta al toque | US1, FR-002, FR-020 |
| 2 | Escribir "sofia@" y salir del campo | "Ingresá un email válido" debajo del campo, **Ingresar** deshabilitado | US1-5, FR-006/007 |
| 3 | Ingresar `sofia.gomez@correo.com` con una contraseña incorrecta | "El email o la contraseña no son correctos.", el email se conserva | US1-2 |
| 4 | Ingresar " Sofia.Gomez@correo.com " / `Entradas2026` | Llega a Explorar con "Hola, Sofía" | US1-1/4 |
| 5 | Cerrar y volver a abrir la app | Entra directo a Explorar | US4-3, FR-017 |
| 6 | Reiniciar el backend y hacer algo que pida sesión o reabrir la app | Vuelve a Compradores 01 · Ingreso | US4-4 |
| 7 | Abrir `/organizadores` | Organizadores 01 · Ingreso, sin Google/Apple/registro | US2-3, FR-020 |
| 8 | Ingresar ahí con `sofia.gomez@correo.com` | Mensaje genérico de credenciales | US3-1 |
| 9 | Ingresar `produccion@latrama.com.ar` / `Entradas2026` con Enter | Mis eventos con "Compañía La Trama" en el DesktopNav | US2-1, FR-008 |
| 10 | Repetir el 9 con la ventana a 390 px de ancho | Tarjeta adaptada al ancho, sin scroll horizontal | US2-4 |
| 11 | Abrir `/organizadores/mis-eventos` sin sesión de organizador | Organizadores 01 · Ingreso | US4-2, US3-3 |
| 12 | Doble clic rápido en **Ingresar** | Un solo intento, botón deshabilitado mientras se envía | Edge cases |
| 13 | Con el backend apagado, intentar ingresar | "No pudimos conectarnos. Probá de nuevo en un rato." y los datos se conservan | Edge cases |
| 14 | Revisar la consola del backend y las respuestas | Ninguna contraseña ni hash, ni el token completo | SC-004 |
