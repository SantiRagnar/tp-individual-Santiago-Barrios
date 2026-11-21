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

/**
 * Eventos de ejemplo (specs/002-eventos-organizador/data-model.md § Seed, research R18).
 * Fecha de referencia de los tests: 2026-11-09. `estado` es el guardado: Tango y Edipo Rey
 * se ven Finalizados porque su fecha ya pasó (research R1).
 */
export const eventosSeed = [
  {
    id: "evt-1",
    organizadorId: "org-1",
    nombre: "Hamlet en el Galpón",
    descripcion: "La tragedia de Shakespeare en una puesta íntima, con el público alrededor de la escena.",
    categoria: "Teatro",
    fechaHora: "2026-11-21T21:00:00-03:00",
    ubicacion: "Galpón de Guevara, Chacarita",
    imagenId: "img-seed-hamlet",
    materialMultimedia: [
      { nombre: "trailer.mp4", tipo: "video" },
      { nombre: "ensayo-01.jpg", tipo: "foto" },
    ],
    tiposDeEntrada: [
      { id: "tip-1", nombre: "General", cupo: 150, precio: 12000, vendidas: 66 },
      { id: "tip-2", nombre: "Platea", cupo: 80, precio: 18000, vendidas: 68 },
      { id: "tip-3", nombre: "VIP", cupo: 20, precio: 26000, vendidas: 20 },
    ],
    estado: "Publicado",
    creadoEn: "2026-09-01T10:00:00-03:00",
  },
  {
    id: "evt-2",
    organizadorId: "org-2",
    nombre: "Risas a Domicilio",
    descripcion: "Stand-up con cuatro comediantes que se turnan el micrófono. Cada función es distinta.",
    categoria: "Comedia",
    fechaHora: "2026-11-14T22:30:00-03:00",
    ubicacion: "Paseo La Plaza, Sala Neruda",
    imagenId: "img-seed-risas",
    materialMultimedia: [],
    tiposDeEntrada: [
      { id: "tip-4", nombre: "General", cupo: 120, precio: 9000, vendidas: 95 },
      { id: "tip-5", nombre: "Mesa preferencial", cupo: 30, precio: 14000, vendidas: 22 },
    ],
    estado: "Publicado",
    creadoEn: "2026-09-10T10:00:00-03:00",
  },
  {
    id: "evt-3",
    organizadorId: "org-1",
    nombre: "Bodas de sangre",
    descripcion: "El clásico de Lorca, con música en vivo y un elenco de doce actores.",
    categoria: "Drama",
    fechaHora: "2026-12-05T20:00:00-03:00",
    ubicacion: "Teatro San Martín, Sala Casacuberta",
    imagenId: "img-seed-bodas",
    materialMultimedia: [],
    tiposDeEntrada: [
      { id: "tip-6", nombre: "General", cupo: 200, precio: 15000, vendidas: 80 },
      { id: "tip-7", nombre: "Platea", cupo: 60, precio: 21000, vendidas: 30 },
    ],
    estado: "Publicado",
    creadoEn: "2026-09-15T10:00:00-03:00",
  },
  {
    id: "evt-4",
    organizadorId: "org-3",
    nombre: "Cartas a Julieta",
    descripcion: "Una historia de amor contada a través de cartas que nunca llegaron a destino.",
    categoria: "Amor",
    fechaHora: "2026-11-28T20:30:00-03:00",
    ubicacion: "Centro Cultural Konex",
    imagenId: "img-seed-cartas",
    materialMultimedia: [],
    tiposDeEntrada: [
      { id: "tip-8", nombre: "General", cupo: 100, precio: 11000, vendidas: 40 },
      { id: "tip-9", nombre: "Pareja", cupo: 40, precio: 19000, vendidas: 12 },
    ],
    estado: "Publicado",
    creadoEn: "2026-09-20T10:00:00-03:00",
  },
  {
    id: "evt-5",
    organizadorId: "org-2",
    nombre: "Impro Express",
    descripcion: "Improvisación a partir de las propuestas del público. Nada está escrito.",
    categoria: "Comedia",
    fechaHora: "2026-12-12T21:30:00-03:00",
    ubicacion: "La Tangente, Palermo",
    imagenId: "img-seed-impro",
    materialMultimedia: [],
    tiposDeEntrada: [{ id: "tip-10", nombre: "General", cupo: 80, precio: 8000, vendidas: 10 }],
    estado: "Publicado",
    creadoEn: "2026-10-01T10:00:00-03:00",
  },
  {
    id: "evt-6",
    organizadorId: "org-3",
    nombre: "Tango en el Conventillo",
    descripcion: "Teatro y tango en un conventillo de 1910: una noche en el Buenos Aires de principios de siglo.",
    categoria: "Teatro",
    fechaHora: "2026-10-18T21:00:00-03:00",
    ubicacion: "Conventillo de la Paloma",
    imagenId: "img-seed-tango",
    materialMultimedia: [],
    tiposDeEntrada: [{ id: "tip-11", nombre: "General", cupo: 90, precio: 10000, vendidas: 90 }],
    estado: "Publicado",
    creadoEn: "2026-08-15T10:00:00-03:00",
  },
  {
    id: "evt-7",
    organizadorId: "org-1",
    nombre: "Edipo Rey",
    descripcion: "La tragedia de Sófocles en una versión contemporánea y despojada.",
    categoria: "Drama",
    fechaHora: "2026-09-12T21:00:00-03:00",
    ubicacion: "Galpón de Guevara, Chacarita",
    imagenId: "img-seed-edipo",
    materialMultimedia: [],
    tiposDeEntrada: [{ id: "tip-12", nombre: "General", cupo: 150, precio: 10000, vendidas: 142 }],
    estado: "Publicado",
    creadoEn: "2026-07-01T10:00:00-03:00",
  },
  {
    id: "evt-8",
    organizadorId: "org-1",
    nombre: "La gaviota",
    descripcion: "Chéjov en clave de comedia triste. Elenco en formación.",
    categoria: null,
    fechaHora: "2027-03-06T20:30:00-03:00",
    ubicacion: "A confirmar",
    imagenId: "img-seed-gaviota",
    materialMultimedia: [],
    tiposDeEntrada: [{ id: "tip-13", nombre: "General", cupo: 120, precio: 14000, vendidas: 0 }],
    estado: "Borrador",
    creadoEn: "2026-11-02T10:00:00-03:00",
  },
];

/** Imágenes de ejemplo (research R8): archivo en repository/imagenes-seed/ → id fijo. */
export const imagenesSeed = ["hamlet", "risas", "bodas", "cartas", "impro", "tango", "edipo", "gaviota"].map(
  (nombre) => ({ id: `img-seed-${nombre}`, archivo: `${nombre}.png`, tipoMime: "image/png" }),
);
