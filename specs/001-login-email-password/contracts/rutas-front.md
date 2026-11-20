# Contrato de rutas del front (expo-router)

Rutas que esta feature define y que las próximas features tienen que respetar (FR-014, FR-015, FR-017 y FR-020). Cómo se protegen está en [research.md](../research.md) (R9).

| Dirección | Archivo en `src/app/` | Pantalla | Se muestra si | Si no, va a |
|---|---|---|---|---|
| `/` | `(compradores)/index.tsx` | Compradores 01 · Ingreso | no hay sesión de comprador | `/explorar` |
| `/explorar` | `(compradores)/explorar.tsx` | Compradores 02 · Explorar (versión mínima en esta feature) | hay sesión de comprador | `/` |
| `/organizadores` | `organizadores/index.tsx` | Organizadores 01 · Ingreso | no hay sesión de organizador | `/organizadores/mis-eventos` |
| `/organizadores/mis-eventos` | `organizadores/mis-eventos.tsx` | Organizadores 02 · Mis eventos (versión mínima en esta feature) | hay sesión de organizador | `/organizadores` |

Reglas:

- Las pantallas internas que se agreguen después en `(compradores)/` van dentro del `Stack.Protected` que pide sesión de comprador. Las de `organizadores/` van dentro del que pide sesión de organizador.
- Ninguna pantalla de `(compradores)` enlaza a `/organizadores` (FR-020).
- Si una llamada a la API responde `401 SESION_INVALIDA`, se borra la sesión guardada de ese tipo. El guard deja de cumplirse y el router lleva al Ingreso que corresponde (US4, escenario 4).
- Versiones mínimas de esta feature: Explorar muestra "Hola, {nombre}" y Mis eventos muestra el DesktopNav con el nombre de la compañía y sus iniciales. El resto del contenido llega con sus propias features.

## Textos de las pantallas de Ingreso

| Elemento | Compradores 01 | Organizadores 01 |
|---|---|---|
| Bajada | "Ingresá para descubrir eventos y comprar entradas." | "Panel de organizadores" |
| Label / placeholder email | "Email" / `nombre@correo.com` | "Email" / `nombre@correo.com` |
| Label contraseña | "Contraseña" | "Contraseña" |
| Botón | "Ingresar" | "Ingresar" (también con Enter) |
| Fuera de alcance, visibles y deshabilitados (FR-002) | "o", "Ingresar con Google", "Ingresar con Apple", "¿No tenés cuenta? Registrate" | — |
| Errores de campo | "Ingresá tu email" · "Ingresá un email válido" · "Ingresá tu contraseña" | ídem |
| Nota cuando el botón está deshabilitado por un error | "Revisá los campos marcados para ingresar." | ídem |
| Credenciales incorrectas (401) | "El email o la contraseña no son correctos." | ídem |
| Sin conexión o error inesperado | "No pudimos conectarnos. Probá de nuevo en un rato." | ídem |
