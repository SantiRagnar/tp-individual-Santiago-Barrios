/** Ver data-model.md § Comprador. */
export class Comprador {
  constructor({ id, nombre, apellido, email, contrasenaHash }) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email.trim().toLowerCase();
    this.contrasenaHash = contrasenaHash;
  }
}
