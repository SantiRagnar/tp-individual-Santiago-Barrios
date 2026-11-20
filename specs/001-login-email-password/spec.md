# Feature Specification: Ingreso con email y contraseña (compradores y organizadores)

**Feature Branch**: `Feature/001-login-email-password`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Login de compradores (email y contraseña) y de organizadores (email y contraseña), según Compradores 01 · Ingreso y Organizadores 01 · Ingreso en \"Diseño de AI Ticket It/pantallas.md\". Google, Apple y registro quedan fuera de esta feature."

**Pantallas cubiertas** (ver `Diseño de AI Ticket It/pantallas.md`):

- **Compradores 01 · Ingreso** (mobile, 390 × 844)
- **Organizadores 01 · Ingreso** (desktop, 1280 × 800; también usable desde 390 px de ancho)

## Clarifications

### Session 2026-11-19

- Q: ¿Qué pasa con "Ingresar con Google", "Ingresar con Apple" y "Registrate", que quedan fuera de esta feature? → A: Se muestran como en el diseño pero deshabilitados (FR-002).
- Q: ¿Entra "Cerrar sesión" en esta feature? → A: Solo la regla de negocio, sin interfaz; los botones llegan con la feature de cada menú (FR-018).

### Session 2026-11-20

- Q: Como compradores y organizadores conviven en un único front, ¿cómo llega cada persona al Ingreso que le corresponde? → A: Cada app tiene su propia dirección; la app arranca por defecto en Compradores 01 · Ingreso y al panel se entra por su dirección propia (p. ej. `/organizadores`), sin link visible desde el lado comprador (FR-020).
- Q: El enunciado pide que la app corra en un dispositivo mobile y el panel de organizadores está diseñado para desktop. ¿El Ingreso de organizadores tiene que funcionar también en una pantalla de celular? → A: Sí; se diseña para desktop, pero en pantallas chicas la misma tarjeta se adapta al ancho y se puede usar completa, sin scroll horizontal (FR-003).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El comprador ingresa con email y contraseña (Priority: P1)

Sofía abre la app de compradores y ve la pantalla de Ingreso: BrandMark, "AI Ticket It" y la línea "Ingresá para descubrir eventos y comprar entradas.". Escribe su email y su contraseña, toca **Ingresar** y llega a Explorar con su sesión iniciada.

**Why this priority**: sin ingreso, el comprador no puede llegar a ninguna pantalla de la app (Explorar, compras, favoritos, consultas). Es la puerta de entrada al lado de mayor volumen de uso.

**Independent Test**: con la cuenta de ejemplo `sofia.gomez@correo.com`, ingresar desde la pantalla de Ingreso de compradores y verificar que se llega a Explorar identificada como Sofía Gómez.

**Acceptance Scenarios**:

1. **Given** una cuenta de comprador existente, **When** el comprador ingresa su email y su contraseña correctos y toca **Ingresar**, **Then** queda con la sesión iniciada y ve Explorar (Compradores 02).
2. **Given** una cuenta de comprador existente, **When** ingresa el email correcto con una contraseña incorrecta, **Then** sigue en Ingreso, ve el mensaje "El email o la contraseña no son correctos." y el email escrito se conserva.
3. **Given** un email que no corresponde a ninguna cuenta de comprador, **When** intenta ingresar, **Then** ve exactamente el mismo mensaje que con contraseña incorrecta (no se revela si el email existe).
4. **Given** el email escrito con mayúsculas o espacios alrededor (p. ej. " Sofia.Gomez@correo.com "), **When** ingresa con la contraseña correcta, **Then** el ingreso funciona.
5. **Given** la pantalla de Ingreso recién abierta, **When** algún campo está vacío o el email no tiene formato válido, **Then** el botón **Ingresar** está deshabilitado (visible al 45%) y, para el campo con error ya tocado, se ve debajo la frase de qué falta.

---

### User Story 2 - El organizador ingresa al panel de organizadores (Priority: P1)

Un integrante de Compañía La Trama abre el panel de organizadores en la web y ve la tarjeta de Ingreso con BrandMark compacto, "AI Ticket It" y "Panel de organizadores". Escribe email y contraseña, hace clic en **Ingresar** y llega a Mis eventos, con el nombre de su compañía en la barra superior.

**Why this priority**: sin ingreso, el organizador no puede crear eventos, ver ventas ni responder consultas. Tiene la misma importancia que el ingreso del comprador; se separa porque es un flujo y una app distintos.

**Independent Test**: con la cuenta de ejemplo `produccion@latrama.com.ar`, ingresar desde Organizadores 01 y verificar que se llega a Mis eventos identificado como Compañía La Trama.

**Acceptance Scenarios**:

1. **Given** una cuenta de organizador existente, **When** ingresa su email y su contraseña correctos y hace clic en **Ingresar** (o presiona Enter en un campo), **Then** queda con la sesión iniciada y ve Mis eventos (Organizadores 02) con el nombre de su compañía.
2. **Given** una cuenta de organizador existente, **When** ingresa una contraseña incorrecta, **Then** sigue en Ingreso y ve "El email o la contraseña no son correctos.".
3. **Given** la pantalla de Ingreso de organizadores, **Then** no hay botones de Google ni Apple ni link de registro.
4. **Given** el Ingreso de organizadores abierto en una pantalla de 390 px de ancho, **When** el organizador ingresa sus datos correctos, **Then** puede completar el ingreso sin scroll horizontal y llega a Mis eventos.

---

### User Story 3 - Cada app solo acepta su propio tipo de cuenta (Priority: P2)

Las dos apps tienen flujos de ingreso separados. Una cuenta de comprador no puede entrar al panel de organizadores y una cuenta de organizador no puede entrar a la app de compradores.

**Why this priority**: protege la información del organizador (ventas, compradores, consultas) y evita que un usuario quede en una app que no le corresponde. Depende de que existan las historias 1 y 2.

**Independent Test**: intentar ingresar con `sofia.gomez@correo.com` en el panel de organizadores y con `produccion@latrama.com.ar` en la app de compradores; los dos intentos deben fallar con el mensaje genérico.

**Acceptance Scenarios**:

1. **Given** una cuenta de comprador, **When** se usa para ingresar en Organizadores 01 con su contraseña correcta, **Then** el ingreso se rechaza con "El email o la contraseña no son correctos.".
2. **Given** una cuenta de organizador, **When** se usa para ingresar en Compradores 01 con su contraseña correcta, **Then** el ingreso se rechaza con el mismo mensaje.
3. **Given** un comprador con sesión iniciada, **When** intenta abrir una pantalla interna del panel de organizadores, **Then** es llevado a Organizadores 01 · Ingreso.

---

### User Story 4 - Las pantallas internas requieren sesión (Priority: P2)

Quien no ingresó no puede ver pantallas internas: si intenta abrir una directamente, se lo lleva al Ingreso de su app. Quien ya tiene sesión y abre la app no vuelve a ver el Ingreso.

**Why this priority**: sin esta protección el ingreso no sirve para nada; pero se puede demostrar el ingreso (P1) antes de proteger todas las rutas.

**Independent Test**: sin sesión, abrir la dirección de Explorar y la de Mis eventos y verificar que cada una lleva al Ingreso de su app; después ingresar y volver a abrir la app sin pasar por el Ingreso.

**Acceptance Scenarios**:

1. **Given** nadie ingresó, **When** se abre una pantalla interna de compradores, **Then** se muestra Compradores 01 · Ingreso.
2. **Given** nadie ingresó, **When** se abre una pantalla interna de organizadores, **Then** se muestra Organizadores 01 · Ingreso.
3. **Given** un comprador con sesión iniciada, **When** vuelve a abrir la app, **Then** llega a Explorar sin volver a ingresar.
4. **Given** una sesión que dejó de ser válida, **When** el usuario hace una acción que la necesita, **Then** es llevado al Ingreso de su app.
5. **Given** nadie ingresó, **When** se abre la app sin indicar una dirección, **Then** se muestra Compradores 01 · Ingreso; **and When** se abre la dirección del panel de organizadores, **Then** se muestra Organizadores 01 · Ingreso.

---

### Edge Cases

- Toque en **Ingresar con Google**, **Ingresar con Apple** o **Registrate**: no pasa nada; se ven deshabilitados (FR-002).
- Sesión cerrada (FR-018): una acción posterior con esa sesión lleva al Ingreso, igual que una sesión vencida.

- Doble toque/clic en **Ingresar**: se envía un solo intento; mientras se procesa, el botón queda deshabilitado.
- El servicio no responde o no hay conexión: el usuario sigue en Ingreso, ve "No pudimos conectarnos. Probá de nuevo en un rato." y sus datos escritos se conservan.
- Contraseña con espacios al principio o al final: se respeta tal cual (no se recorta), a diferencia del email.
- Email con formato inválido (p. ej. "sofia@"): "Ingresá un email válido" debajo del campo y **Ingresar** deshabilitado.
- Campo vacío ya tocado: "Ingresá tu email" / "Ingresá tu contraseña".
- Muchos intentos fallidos seguidos: en esta feature no se bloquea la cuenta (ver Assumptions).
- Reinicio del servicio: como los datos viven en memoria, las sesiones abiertas dejan de valer y el usuario vuelve a Ingreso (comportamiento esperado según la constitución).

## Requirements *(mandatory)*

### Functional Requirements

**Pantallas**

- **FR-001**: La app de compradores MUST mostrar Compradores 01 · Ingreso como se describe en `pantallas.md`: BrandMark, "AI Ticket It", "Ingresá para descubrir eventos y comprar entradas.", campos **Email** (placeholder `nombre@correo.com`) y **Contraseña**, y botón primario **Ingresar**.
- **FR-002**: Los elementos del diseño que quedan fuera de esta feature (separador "o", **Ingresar con Google**, **Ingresar con Apple** y "¿No tenés cuenta? **Registrate**") MUST mostrarse como en el diseño pero deshabilitados (45% de opacidad, sin esconderse): no responden al toque y no llevan a ningún flujo hasta que exista su feature.
- **FR-003**: El panel de organizadores MUST mostrar Organizadores 01 · Ingreso: tarjeta con BrandMark compacto, "AI Ticket It", "Panel de organizadores", campos **Email** y **Contraseña** y botón **Ingresar**, sin Google, Apple ni registro. La referencia es desktop (1280 × 800), pero en pantallas chicas (desde 390 px de ancho) la misma tarjeta MUST adaptarse al ancho disponible con el margen lateral del design system: campos y botón visibles y usables, sin scroll horizontal.
- **FR-004**: Las dos pantallas MUST usar los componentes, tokens y la voz del design system (labels arriba del campo, voseo, sentence case, errores sin rojo, botón deshabilitado al 45% sin esconderse).
- **FR-005**: El campo **Contraseña** MUST ocultar lo que se escribe.

**Validación del formulario**

- **FR-006**: Los campos MUST validarse mientras se escribe: email obligatorio y con formato válido; contraseña obligatoria. Mensajes: "Ingresá tu email", "Ingresá un email válido", "Ingresá tu contraseña".
- **FR-007**: **Ingresar** MUST quedar deshabilitado mientras haya un campo vacío o inválido, y mientras un intento de ingreso esté en curso.
- **FR-008**: En el panel de organizadores, presionar Enter en un campo MUST equivaler a hacer clic en **Ingresar** (si el botón está habilitado).

**Autenticación**

- **FR-009**: El sistema MUST verificar el email y la contraseña contra las cuentas existentes del tipo que corresponde a la app (comprador en la app de compradores, organizador en el panel de organizadores).
- **FR-010**: El email MUST compararse sin distinguir mayúsculas y sin espacios al principio ni al final. La contraseña MUST compararse exactamente.
- **FR-011**: Ante cualquier fallo de credenciales (email inexistente, contraseña incorrecta o cuenta del otro tipo), el sistema MUST responder con el mismo mensaje: "El email o la contraseña no son correctos.", sin revelar cuál de los datos falló.
- **FR-012**: Las contraseñas MUST guardarse de forma que no puedan leerse (nunca en texto legible) y MUST NOT aparecer en respuestas, registros ni mensajes de error.
- **FR-013**: Tras un ingreso correcto, el sistema MUST iniciar una sesión que identifique al usuario y su tipo (comprador u organizador), y que las demás funciones usen para saber quién hace cada acción.
- **FR-014**: Tras un ingreso correcto, el comprador MUST ser llevado a Explorar (Compradores 02) y el organizador a Mis eventos (Organizadores 02).

**Sesión y acceso**

- **FR-015**: Toda pantalla interna de cada app y toda operación que requiera un usuario MUST exigir una sesión válida del tipo correspondiente; sin ella, se lleva al usuario al Ingreso de su app.
- **FR-016**: Una sesión de comprador MUST NOT dar acceso al panel de organizadores, ni una de organizador a la app de compradores.
- **FR-017**: Si el usuario ya tiene una sesión válida al abrir su app, MUST ir directo a su pantalla inicial (Explorar o Mis eventos) sin ver el Ingreso.
- **FR-018**: El sistema MUST permitir cerrar una sesión: desde ese momento la sesión deja de ser válida y cualquier acción que la necesite lleva al Ingreso de su app. En esta feature no se agrega interfaz para cerrar sesión: el botón "Cerrar sesión" del Menú de perfil del comprador (Compradores 03) y su equivalente para organizadores llegan con la feature de cada menú y usan esta regla.

- **FR-020**: Cada app MUST tener su propia dirección de entrada. Abrir la app sin indicar una dirección MUST llevar al lado compradores (Compradores 01 · Ingreso, o Explorar si ya hay sesión de comprador). Al panel de organizadores se entra solo por su dirección propia (p. ej. `/organizadores`), que lleva a Organizadores 01 · Ingreso (o a Mis eventos si ya hay sesión de organizador). Ninguna pantalla del lado compradores MUST mostrar un link al panel de organizadores.

**Datos de ejemplo**

- **FR-019**: Al iniciar, el sistema MUST tener cargadas las cuentas de ejemplo de `pantallas.md`: comprador Sofía Gómez (`sofia.gomez@correo.com`) y organizadores Compañía La Trama (`produccion@latrama.com.ar`), Club del Chiste y Producciones Lumbre, cada una con una contraseña conocida y documentada para desarrollo y pruebas.

### Key Entities

- **Comprador**: persona que compra entradas. Datos para esta feature: nombre, apellido, email (único entre compradores) y contraseña protegida.
- **Organizador**: compañía o productora dueña de eventos (p. ej. "Compañía La Trama"). Datos para esta feature: nombre de la compañía, email (único entre organizadores) y contraseña protegida.
- **Sesión**: acceso iniciado por un comprador o un organizador tras ingresar. Sabe a qué usuario y a qué tipo de cuenta pertenece y si sigue siendo válida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con su cuenta puede pasar de la pantalla de Ingreso a su pantalla inicial (Explorar o Mis eventos) en menos de 30 segundos, y el paso posterior a tocar **Ingresar** tarda menos de 2 segundos.
- **SC-002**: El 100% de los intentos con credenciales incorrectas, emails inexistentes o cuentas del otro tipo se rechazan con el mismo mensaje genérico.
- **SC-003**: El 100% de las pantallas internas de las dos apps, abiertas sin sesión, terminan en el Ingreso de su app.
- **SC-004**: Ninguna contraseña aparece legible en datos guardados, respuestas ni registros (verificable revisando los datos de ejemplo y las respuestas de ingreso).
- **SC-005**: Las cuatro cuentas de ejemplo (1 comprador y 3 organizadores) pueden ingresar en su app en el primer intento usando las contraseñas documentadas.
- **SC-006**: Las dos pantallas de Ingreso coinciden con el diseño: textos, elementos y estados (vacío, error de campo, credenciales incorrectas, deshabilitado y enviando).

## Assumptions

- **Fuera de alcance**: ingreso con Google y Apple, registro de compradores y de organizadores, recuperación de contraseña ("Olvidé mi contraseña" no está en el diseño), cambio de contraseña y los botones de "Cerrar sesión" (la regla sí entra, FR-018).
- La sesión dura hasta que se cierra (FR-018) o el servicio se reinicia.
- Las cuentas existen solo por los datos de ejemplo cargados al iniciar; no hay forma de crearlas desde la app en esta feature.
- Los organizadores Club del Chiste y Producciones Lumbre no tienen email en el diseño; se les asigna uno de ejemplo con el mismo estilo que el de La Trama.
- Compradores y organizadores son tipos de cuenta separados: el mismo email podría existir en los dos sin conflicto, y cada app solo busca en su tipo.
- No hay vencimiento de sesión por inactividad en esta feature (los datos viven en memoria).
- No se bloquean cuentas ni se limitan intentos fallidos: es un trabajo práctico con datos de ejemplo; queda como mejora futura.
- Los mensajes de error están definidos en `pantallas.md` (Compradores 01 y Organizadores 01 · Ingreso).
- Si Explorar o Mis eventos todavía no están construidas, el destino tras el ingreso es una versión mínima de esa pantalla que muestra quién ingresó; su contenido corresponde a otras features.
