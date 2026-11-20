/**
 * Datos de ejemplo (data-model.md § Seed, "Diseño de AI Ticket It/pantallas.md").
 * Las contraseñas se guardan solo como hash. La contraseña de desarrollo está
 * documentada en specs/001-login-email-password/quickstart.md.
 */
const HASH_CONTRASENA_DESARROLLO =
  "scrypt$05afc88ee80a7136d2e6ae7869280498$a62b95615e44dc5facf68e36422be8df2f9ebe3bfb89056d5684c189e6e7696348a87485ef0b2a4d66154d18a4780a251c1638b09e12bd2b33a05406a094b99e";

export const compradoresSeed = [
  {
    id: "cmp-1",
    nombre: "Sofía",
    apellido: "Gómez",
    email: "sofia.gomez@correo.com",
    contrasenaHash: HASH_CONTRASENA_DESARROLLO,
  },
];

export const organizadoresSeed = [
  {
    id: "org-1",
    nombre: "Compañía La Trama",
    email: "produccion@latrama.com.ar",
    contrasenaHash: HASH_CONTRASENA_DESARROLLO,
  },
  {
    id: "org-2",
    nombre: "Club del Chiste",
    email: "hola@clubdelchiste.com.ar",
    contrasenaHash: HASH_CONTRASENA_DESARROLLO,
  },
  {
    id: "org-3",
    nombre: "Producciones Lumbre",
    email: "contacto@lumbre.com.ar",
    contrasenaHash: HASH_CONTRASENA_DESARROLLO,
  },
];
