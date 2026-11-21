/** Ver data-model.md § Imagen. `organizadorId` es null en las imágenes del seed (research R8). */
export class Imagen {
  constructor({ id, organizadorId = null, tipoMime, datos }) {
    this.id = id;
    this.organizadorId = organizadorId;
    this.tipoMime = tipoMime;
    this.datos = datos;
  }
}
