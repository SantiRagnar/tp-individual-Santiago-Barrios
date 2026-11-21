/**
 * Ver data-model.md § Evento, § TipoDeEntrada y § MaterialMultimedia.
 * `estado` es el estado guardado (Borrador | Publicado); Finalizado se deriva (research R1).
 */
export class Evento {
  constructor({
    id,
    organizadorId,
    nombre = null,
    descripcion = null,
    categoria = null,
    fechaHora = null,
    ubicacion = null,
    imagenId = null,
    materialMultimedia = [],
    tiposDeEntrada = [],
    estado,
    creadoEn,
  }) {
    this.id = id;
    this.organizadorId = organizadorId;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.categoria = categoria;
    this.fechaHora = fechaHora;
    this.ubicacion = ubicacion;
    this.imagenId = imagenId;
    this.materialMultimedia = materialMultimedia.map((m) => new MaterialMultimedia(m));
    this.tiposDeEntrada = tiposDeEntrada.map((t) => new TipoDeEntrada(t));
    this.estado = estado;
    this.creadoEn = creadoEn;
  }

  /** Publicado con fecha ya pasada → Finalizado; si no, el estado guardado (research R1). */
  estadoVisible(ahora) {
    if (this.estado === "Publicado" && this.fechaHora && new Date(this.fechaHora) <= ahora) return "Finalizado";
    return this.estado;
  }

  get cupoTotal() {
    return this.tiposDeEntrada.reduce((total, t) => total + (t.cupo ?? 0), 0);
  }

  get vendidasTotal() {
    return this.tiposDeEntrada.reduce((total, t) => total + t.vendidas, 0);
  }
}

export class TipoDeEntrada {
  constructor({ id, nombre = null, cupo = null, precio = null, vendidas = 0 }) {
    this.id = id;
    this.nombre = nombre;
    this.cupo = cupo;
    this.precio = precio;
    this.vendidas = vendidas;
  }
}

export class MaterialMultimedia {
  constructor({ nombre, tipo }) {
    this.nombre = nombre;
    this.tipo = tipo;
  }
}
