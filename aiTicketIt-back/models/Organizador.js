/** Ver data-model.md § Organizador. `nombre` es el nombre de la compañía. */
export class Organizador {
  constructor({ id, nombre, email, contrasenaHash }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email.trim().toLowerCase();
    this.contrasenaHash = contrasenaHash;
  }
}
