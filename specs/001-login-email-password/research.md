# Research: Ingreso con email y contraseña

**Feature**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md) · **Fecha**: 2026-11-20

Esta es la primera feature del proyecto, así que varias decisiones (framework de tests, validación, formato de errores, sesión) pasan a ser el estándar del proyecto, como pide la constitución.

## R1. Framework de tests del backend

- **Decision**: `node:test` (el runner que ya trae Node) + `node:assert/strict`, y **supertest** (7.x) para los tests de integración HTTP. Script: `npm test` → `node --test`.
- **Rationale**: el backend usa ES modules. `node:test` los corre sin configuración ni transpilar, y no suma dependencias para los tests unitarios. Con supertest se le pegan requests al `app` de Express sin levantar un puerto.
- **Alternatives considered**: Jest (su soporte de ESM sigue siendo experimental y necesita flags); Vitest (buena opción, pero suma una dependencia grande sin una ventaja concreta para un backend chico).

## R2. Separar `app` de `listen`

- **Decision**: `app.js` crea y configura la app de Express y la exporta, sin escuchar en ningún puerto. `index.js` carga el seed, importa `app` y llama a `listen`.
- **Rationale**: supertest necesita el `app` sin un puerto abierto, y cada test necesita reiniciar el estado en memoria antes de correr.
- **Alternatives considered**: levantar el servidor en un puerto por test (es más lento y aparecen conflictos de puertos).

## R3. Validación de la entrada (`schemas/`)

- **Decision**: **zod** 4.x. Un schema `ingresoSchema` (email recortado y en minúsculas, con formato válido; contraseña string no vacía, sin recortar), aplicado por un middleware `validar(schema)` antes del controller.
- **Rationale**: la constitución exige validar contra un schema antes de llegar al servicio. zod da mensajes por campo, normaliza (`trim`/`toLowerCase`) en el mismo paso y es el estándar de facto en Node.
- **Alternatives considered**: validación a mano (se repite en cada endpoint futuro); Joi y AJV (más verbosos; AJV tiene sentido si se generan schemas desde OpenAPI, y acá no hace falta).

## R4. Guardar las contraseñas protegidas (FR-012, SC-004)

- **Decision**: `crypto.scrypt` de Node, con un salt aleatorio de 16 bytes por cuenta y una clave de 64 bytes, guardado como `scrypt$<saltHex>$<hashHex>`. La comparación usa `crypto.timingSafeEqual`.
- **Rationale**: no suma dependencias y scrypt es una KDF recomendada para contraseñas. El seed guarda **hashes ya calculados**, nunca la contraseña legible. Las contraseñas de desarrollo se documentan solo en [quickstart.md](quickstart.md).
- **Alternatives considered**: bcrypt (tiene binarios nativos y es una dependencia extra); argon2 (también nativo); calcular el hash al iniciar desde contraseñas planas guardadas en el código (dejaría las contraseñas legibles en el repo).

## R5. No revelar si el email existe (FR-011)

- **Decision**: si el email no existe en el tipo de cuenta pedido, igual se verifica la contraseña contra un hash ficticio fijo, para que el tiempo de respuesta sea parecido. Cualquier fallo devuelve el mismo `401 CREDENCIALES_INVALIDAS` con el mismo mensaje.
- **Rationale**: el mensaje igual no alcanza si la respuesta es mucho más rápida cuando el email no existe.
- **Alternatives considered**: responder rápido cuando no existe (deja enumerar cuentas por el tiempo de respuesta).

## R6. Representación de la sesión (FR-013, FR-015 a FR-018)

- **Decision**: **token opaco** aleatorio (32 bytes, base64url) que el cliente manda como `Authorization: Bearer <token>`. El backend guarda en `sesionesRepository` (en memoria) el **SHA-256 del token** junto con el `tipo` (`comprador`/`organizador`), el `usuarioId` y la fecha `creadaEn`. Cerrar sesión borra la entrada. Reiniciar el backend vacía el repositorio y todas las sesiones dejan de valer, que es lo que espera la spec.
- **Rationale**: FR-018 exige poder invalidar una sesión. Con un token opaco alcanza con borrarlo; con JWT haría falta una lista de revocados. Guardar solo el hash evita que un volcado de memoria o de logs exponga tokens que sirvan.
- **Alternatives considered**: JWT (no se puede invalidar sin estado extra y no sobrevive bien a la regla "reinicio = sesiones caídas"); cookies de sesión (en React Native nativo son incómodas y el front tiene que andar en mobile y web).

## R7. Separación por tipo de cuenta (FR-009, FR-016)

- **Decision**: rutas separadas por tipo: `/compradores/sesiones` y `/organizadores/sesiones`. El middleware `requiereSesion(tipo)` rechaza con `401 SESION_INVALIDA` un token válido de otro tipo, igual que uno inexistente.
- **Rationale**: cada app busca solo en su repositorio de cuentas. El mismo email puede existir en los dos tipos sin conflicto (Assumptions de la spec).
- **Alternatives considered**: un único `/sesiones` con un campo `tipo` en el body (mezcla los flujos que la constitución pide separados); responder 403 a una sesión de otro tipo (revela que el token existe; 401 alcanza para mandar al Ingreso).

## R8. Formato de errores JSON

- **Decision**: siempre `{ "error": { "codigo": string, "mensaje": string, "campos"?: [{ "campo", "mensaje" }] } }`. Los errores de dominio son subclases de `ErrorDeDominio` (en `errors/`) con su status HTTP. Un único manejador de errores de Express traduce cualquier error a ese formato, y un error inesperado responde 500 `ERROR_INTERNO` sin detalles.
- **Rationale**: la constitución pide un formato consistente. Este queda como estándar para las próximas features.

## R9. Rutas del front y protección (FR-014, FR-015, FR-017, FR-020)

- **Decision**: expo-router (SDK 58) con **`Stack.Protected`**:
  - Grupo `(compradores)`: `index` (= `/`, Compradores 01 · Ingreso) protegido con `guard={!sesionComprador}` y `explorar` con `guard={!!sesionComprador}`.
  - Carpeta `organizadores/`: `index` (= `/organizadores`, Organizadores 01 · Ingreso) con `guard={!sesionOrganizador}` y `mis-eventos` con `guard={!!sesionOrganizador}`.
  - Mientras se lee la sesión guardada, se mantiene la splash, así no se ve el Ingreso un instante y después salta.
- **Rationale**: según la documentación de Expo Router, si el guard es `false` se redirige a la primera pantalla disponible del stack. Eso resuelve FR-015 y FR-017 de forma declarativa. Las direcciones quedan como pide FR-020 (`/` para compradores, `/organizadores` para el panel, sin link entre los dos lados). La documentación aclara que la protección del cliente no reemplaza la del servidor: por eso el backend valida la sesión en cada operación (FR-015).
- **Alternatives considered**: `<Redirect>` manual en cada layout (más código y más fácil de olvidar); una pantalla selectora de app (descartada en la clarificación del 2026-11-20).

## R10. Dónde guardar la sesión en el dispositivo (FR-017)

- **Decision**: **expo-secure-store** en Android/iOS y `localStorage` en web, detrás del mismo módulo `almacenamientoSesion` (`.ts` nativo y `.web.ts`). Hay una clave por tipo: `sesion.comprador` y `sesion.organizador`.
- **Rationale**: la documentación de secure-store lista solo Android, iOS y tvOS, sin web. Se usa la convención de extensiones de plataforma que el proyecto ya tiene (`*.web.ts`). Si el backend responde 401 a la sesión guardada, se borra y se vuelve al Ingreso (US4, escenario 4).
- **Alternatives considered**: AsyncStorage en todas las plataformas (en nativo guarda el token sin cifrar).

## R11. Validar la sesión al abrir la app (FR-017, US4-3/4)

- **Decision**: al iniciar, si hay un token guardado, se llama a `GET /{tipo}/sesiones/actual`. Con 200 se entra directo. Con 401 se borra el token y se muestra el Ingreso. Si hay error de red, se mantiene el token y se muestra la pantalla interna; la próxima operación decide.
- **Rationale**: después de reiniciar el backend, el token guardado deja de valer, así que hay que comprobarlo y no confiar en el almacenamiento local.

## R12. Design system en React Native

- **Decision**: `src/theme/tokens.ts` copia los tokens de `design-system.md` (color, tipografía, espaciado, radios, alturas) y reemplaza los colores claro/oscuro del template de Expo, que no se usan (hay un solo tema, oscuro). Tipografía Inter con `@expo-google-fonts/inter` + `expo-font`. Íconos Phosphor con `phosphor-react-native` (requiere `react-native-svg`). Todo se instala con `npx expo install`.
- **Componentes de esta feature**: `BrandMark` (tamaño normal y compacto), `Button` (`primary`/`secondary`/`cta`, con estado `disabled` al 45% y estado enviando), `TextField` (label arriba, `aria-invalid`, `FieldError` con `warning-circle`), `Divider` con texto "o".
- **Riesgo**: hay que confirmar que `phosphor-react-native` es compatible con RN 0.88 al instalarlo. Si no lo es, el plan B es usar los SVG de Phosphor directamente con `react-native-svg`.

## R13. URL del backend desde el front

- **Decision**: la variable `EXPO_PUBLIC_API_URL`, con valor por defecto `http://localhost:3000`. En un dispositivo físico se usa la IP de la máquina en la red local (ver [quickstart.md](quickstart.md)). El backend ya permite cualquier origen si no se define `ALLOWED_ORIGINS`.

## R14. Datos de ejemplo de cuentas

- **Decision**: una sola contraseña de desarrollo para las cuatro cuentas, documentada en quickstart. Emails nuevos para los organizadores que no tienen uno en el diseño: `hola@clubdelchiste.com.ar` (Club del Chiste) y `contacto@lumbre.com.ar` (Producciones Lumbre).
- **Rationale**: SC-005 pide que las cuatro cuentas ingresen al primer intento con contraseñas documentadas; con una sola es más simple de probar.
