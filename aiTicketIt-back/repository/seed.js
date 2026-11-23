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
  // Compradores de ejemplo de la feature 003 (specs/003-explorar-detalle-evento/data-model.md § Seed):
  // autores de las reseñas, para que cada organizador tenga puntaje (research R17).
  ...[
    ["cmp-2", "Martín", "Pérez", "martin.perez@correo.com"],
    ["cmp-3", "Lucía", "Fernández", "lucia.fernandez@correo.com"],
    ["cmp-4", "Diego", "Romero", "diego.romero@correo.com"],
    ["cmp-5", "Valentina", "Sosa", "valentina.sosa@correo.com"],
  ].map(([id, nombre, apellido, email]) => ({ id, nombre, apellido, email, contrasenaHash: HASH_CONTRASENA_DESARROLLO })),
  // Compradores de ejemplo de la feature 005 (specs/005-panel-evento/data-model.md § Comprador (seed)):
  // autores de las compras generadas, para que el panel del evento tenga ventas (research R8).
  ...[
    ["cmp-6", "Camila", "Torres", "camila.torres@correo.com"],
    ["cmp-7", "Joaquín", "Díaz", "joaquin.diaz@correo.com"],
    ["cmp-8", "Florencia", "Ruiz", "florencia.ruiz@correo.com"],
    ["cmp-9", "Tomás", "Herrera", "tomas.herrera@correo.com"],
    ["cmp-10", "Agustina", "Medina", "agustina.medina@correo.com"],
    ["cmp-11", "Nicolás", "Castro", "nicolas.castro@correo.com"],
    ["cmp-12", "Micaela", "Ríos", "micaela.rios@correo.com"],
    ["cmp-13", "Facundo", "Acosta", "facundo.acosta@correo.com"],
    ["cmp-14", "Julieta", "Benítez", "julieta.benitez@correo.com"],
    ["cmp-15", "Matías", "Molina", "matias.molina@correo.com"],
  ].map(([id, nombre, apellido, email]) => ({ id, nombre, apellido, email, contrasenaHash: HASH_CONTRASENA_DESARROLLO })),
  {
    id: "cmp-16",
    nombre: "Santiago",
    apellido: "Barrios",
    email: "santibarrios2000@gmail.com",
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
  {
    id: "org-4",
    nombre: "deamworks",
    email: "dreamworks@dreamworks.com",
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
  // Feature 003 (research R17): evento pasado de Club del Chiste, para que tenga reseñas.
  {
    id: "evt-9",
    organizadorId: "org-2",
    nombre: "Stand-up en el Sótano",
    descripcion: "Tres comediantes nuevos prueban material en un sótano de Palermo.",
    categoria: "Comedia",
    fechaHora: "2026-08-22T21:30:00-03:00",
    ubicacion: "La Tangente, Palermo",
    imagenId: "img-seed-sotano",
    materialMultimedia: [],
    tiposDeEntrada: [{ id: "tip-14", nombre: "General", cupo: 100, precio: 7000, vendidas: 100 }],
    estado: "Publicado",
    creadoEn: "2026-06-15T10:00:00-03:00",
  },
];

/** Imágenes de ejemplo (research R8): archivo en repository/imagenes-seed/ → id fijo. */
export const imagenesSeed = ["hamlet", "risas", "bodas", "cartas", "impro", "tango", "edipo", "gaviota", "sotano"].map(
  (nombre) => ({ id: `img-seed-${nombre}`, archivo: `${nombre}.png`, tipoMime: "image/png" }),
);

/**
 * Compras Utilizadas y calificadas (specs/003-explorar-detalle-evento/data-model.md § Seed, research R17).
 * La calificación vive en la compra (research R7). Promedios: La Trama 4.5, Lumbre 4.0, Club del Chiste 3.7.
 * Las vendidas de los tipos de entrada no se recalculan: el generador de abajo completa las compras que faltan.
 * `tipoDeEntradaNombre` y `precioUnitario` (copia del tipo, research R6 de la 004) los completa
 * comprasRepository.reiniciar() desde el evento.
 */
const compraCalificada = (numero, compradorId, eventoId, tipoDeEntradaId, cantidad, monto, medioDePago, dia, puntaje, comentario) => ({
  numero,
  compradorId,
  eventoId,
  tipoDeEntradaId,
  cantidad,
  monto,
  medioDePago,
  estado: "Utilizada",
  creadaEn: `${dia}T09:00:00-03:00`,
  calificacion: { puntaje, comentario, calificadaEn: `${dia}T18:00:00-03:00` },
});

const comprasCalificadas = [
  // Compañía La Trama · Edipo Rey (2026-09-12)
  compraCalificada("A-0655", "cmp-1", "evt-7", "tip-12", 1, 10000, "Tarjeta de débito", "2026-09-13", 4, "Muy buena puesta, el final te deja pensando."),
  compraCalificada("A-0612", "cmp-2", "evt-7", "tip-12", 2, 20000, "Tarjeta de crédito", "2026-09-14", 5, "Impecable. Los actores muy cerca del público."),
  compraCalificada("A-0618", "cmp-3", "evt-7", "tip-12", 1, 10000, "Mercado Pago", "2026-09-15", 5, null),
  compraCalificada("A-0631", "cmp-4", "evt-7", "tip-12", 1, 10000, "Transferencia", "2026-09-20", 4, "Buena, aunque la sala hacía mucho frío."),
  // Producciones Lumbre · Tango en el Conventillo (2026-10-18)
  compraCalificada("A-0820", "cmp-3", "evt-6", "tip-11", 2, 20000, "Tarjeta de crédito", "2026-10-19", 4, "Hermosa ambientación del conventillo."),
  compraCalificada("A-0834", "cmp-5", "evt-6", "tip-11", 1, 10000, "Tarjeta de débito", "2026-10-21", 4, null),
  // Club del Chiste · Stand-up en el Sótano (2026-08-22)
  compraCalificada("A-0540", "cmp-2", "evt-9", "tip-14", 1, 7000, "Mercado Pago", "2026-08-23", 3, "Algunos chistes funcionaron, otros no tanto."),
  compraCalificada("A-0547", "cmp-4", "evt-9", "tip-14", 1, 7000, "Tarjeta de crédito", "2026-08-24", 4, "Me reí mucho con el segundo comediante."),
  compraCalificada("A-0559", "cmp-5", "evt-9", "tip-14", 2, 14000, "Tarjeta de débito", "2026-08-25", 4, null),
];

/**
 * Compras de Sofía de pantallas.md que faltaban (mismos datos que el seed de la feature 004).
 * A-0655 ya está entre las calificadas.
 */
const compra = (numero, compradorId, eventoId, tipoDeEntradaId, cantidad, monto, medioDePago, estado, creadaEn) => ({
  numero,
  compradorId,
  eventoId,
  tipoDeEntradaId,
  cantidad,
  monto,
  medioDePago,
  estado,
  creadaEn,
  calificacion: null,
});

const comprasDeSofia = [
  compra("A-1042", "cmp-1", "evt-1", "tip-2", 2, 36000, "Tarjeta de crédito", "Confirmada", "2026-11-06T19:20:00-03:00"),
  compra("A-1037", "cmp-1", "evt-2", "tip-4", 1, 9000, "Mercado Pago", "Pendiente de pago", "2026-11-04T11:05:00-03:00"),
  compra("A-0871", "cmp-1", "evt-6", "tip-11", 2, 20000, "Tarjeta de débito", "Utilizada", "2026-10-05T16:40:00-03:00"),
  compra("A-0790", "cmp-1", "evt-4", "tip-9", 1, 19000, "Tarjeta de crédito", "Reembolsada", "2026-09-30T10:15:00-03:00"),
];

const comprasBase = [...comprasCalificadas, ...comprasDeSofia];

// Generador de ventas de ejemplo (specs/005-panel-evento/research.md R8; data-model.md § Seed de compras).
const REFERENCIA_SEED = new Date("2026-11-09T00:00:00-03:00").getTime();
const ULTIMO_DIA_DE_COMPRAS = new Date("2026-11-08T20:00:00-03:00").getTime();
const CICLO_DE_CANTIDADES = [2, 1, 4, 2, 3, 1, 2, 6, 2, 3];
const MEDIOS_DE_PAGO = ["Tarjeta de crédito", "Tarjeta de débito", "Mercado Pago", "Transferencia"];
const COMPRADORES_GENERADOS = Array.from({ length: 10 }, (_, i) => `cmp-${i + 6}`);
const ACTIVAS = new Set(["Pendiente de pago", "Confirmada", "Utilizada"]);
const UN_DIA = 86_400_000;

/** ISO con offset −03:00, redondeado al minuto. */
function isoArgentina(ms) {
  return `${new Date(Math.floor(ms / 60_000) * 60_000 - 3 * 3_600_000).toISOString().slice(0, 19)}-03:00`;
}

/**
 * Compras que faltan para que, en cada tipo de entrada, las compras activas sumen exactamente sus
 * `vendidas`. Determinística (sin azar): mismas entradas → mismas compras. No modifica sus argumentos.
 */
export function generarVentasDeEjemplo(eventos, comprasExistentes) {
  const usados = new Set(comprasExistentes.map((c) => c.numero));
  let siguiente = 100;
  const nuevoNumero = () => {
    while (usados.has(`A-${String(siguiente).padStart(4, "0")}`)) siguiente += 1;
    const numero = `A-${String(siguiente).padStart(4, "0")}`;
    usados.add(numero);
    siguiente += 1;
    return numero;
  };

  let rotacion = 0; // comprador y medio de pago rotan entre todas las compras generadas
  const generadas = [];

  for (const evento of eventos) {
    if (!evento.fechaHora) continue;
    const inicioEvento = new Date(evento.fechaHora).getTime();
    const futuro = inicioEvento > REFERENCIA_SEED;
    const existentes = comprasExistentes.filter((c) => c.eventoId === evento.id);

    // Filas del evento sin número ni fecha: primero las que completan vendidas, después las extra.
    const filas = [];
    let indice = 0; // cuenta desde 1 las compras que completan vendidas de este evento
    for (const tipo of evento.tiposDeEntrada) {
      let faltan =
        tipo.vendidas -
        existentes.filter((c) => c.tipoDeEntradaId === tipo.id && ACTIVAS.has(c.estado)).reduce((t, c) => t + c.cantidad, 0);
      while (faltan > 0) {
        const cantidad = Math.min(CICLO_DE_CANTIDADES[indice % CICLO_DE_CANTIDADES.length], faltan);
        faltan -= cantidad;
        indice += 1;
        const estado = futuro
          ? indice % 6 === 0
            ? "Pendiente de pago"
            : "Confirmada"
          : indice % 7 === 0
            ? "Confirmada"
            : "Utilizada";
        filas.push({ tipo, cantidad, estado });
      }
    }

    // Eventos futuros con ventas: una Cancelada y una Reembolsada (si no tenía ya una), que no ocupan lugares.
    const conVentas = evento.tiposDeEntrada.some((t) => t.vendidas > 0);
    if (futuro && conVentas) {
      const primerTipo = evento.tiposDeEntrada[0];
      filas.push({ tipo: primerTipo, cantidad: 1, estado: "Cancelada" });
      if (!existentes.some((c) => c.estado === "Reembolsada")) filas.push({ tipo: primerTipo, cantidad: 2, estado: "Reembolsada" });
    }

    // Fechas repartidas entre la creación del evento y el día anterior (o el 2026-11-08).
    const desde = new Date(evento.creadoEn).getTime();
    const hasta = Math.min(inicioEvento - UN_DIA, ULTIMO_DIA_DE_COMPRAS);
    filas.forEach(({ tipo, cantidad, estado }, j) => {
      generadas.push({
        numero: nuevoNumero(),
        compradorId: COMPRADORES_GENERADOS[rotacion % COMPRADORES_GENERADOS.length],
        eventoId: evento.id,
        tipoDeEntradaId: tipo.id,
        cantidad,
        monto: tipo.precio * cantidad,
        medioDePago: MEDIOS_DE_PAGO[rotacion % MEDIOS_DE_PAGO.length],
        estado,
        creadaEn: isoArgentina(desde + ((hasta - desde) * (j + 1)) / (filas.length + 1)),
        calificacion: null,
      });
      rotacion += 1;
    });
  }
  return generadas;
}

/**
 * Todas las compras del seed: calificadas (003), las de Sofía (pantallas.md, 004) y las generadas (005).
 * Las vendidas de cada tipo de entrada coinciden con sus compras activas (FR-018 de la feature 005).
 */
export const comprasSeed = [...comprasBase, ...generarVentasDeEjemplo(eventosSeed, comprasBase)];

// Consultas de ejemplo (specs/007-consultas-chat/data-model.md § Seed, FR-018).
// Ningún mensaje es anterior a su compra: los de las compras generadas se calculan desde su `creadaEn`.
const UNA_HORA = 3_600_000;

/** La primera compra generada (por número) de ese comprador en ese evento. */
function primeraCompraDe(eventoId, compradorId) {
  return comprasSeed
    .filter((c) => c.eventoId === eventoId && c.compradorId === compradorId)
    .sort((a, b) => (a.numero < b.numero ? -1 : 1))[0];
}

const despuesDe = (compraSeed, horas) => isoArgentina(new Date(compraSeed.creadaEn).getTime() + horas * UNA_HORA);
const hamletDeCamila = primeraCompraDe("evt-1", "cmp-6");
const bodasDeJoaquin = primeraCompraDe("evt-3", "cmp-7");

export const consultasSeed = [
  {
    // Sofía · Hamlet: el último es de Sofía y La Trama todavía no lo vio (contador 1 en el panel de Hamlet).
    compraNumero: "A-1042",
    eventoId: "evt-1",
    mensajes: [
      { id: "msj-1", autor: "comprador", texto: "Hola, ¿a qué hora abren la sala?", enviadoEn: "2026-11-07T10:12:00-03:00" },
      { id: "msj-2", autor: "organizador", texto: "Hola Sofía, abrimos 20:30.", enviadoEn: "2026-11-07T11:40:00-03:00" },
      { id: "msj-3", autor: "comprador", texto: "¿Se puede entrar con cochecito?", enviadoEn: "2026-11-08T18:05:00-03:00" },
    ],
    vistosPorOrganizador: 2,
    vistosPorComprador: 3,
  },
  {
    // Sofía · Risas: el último es de Club del Chiste y Sofía no lo leyó (punto en Mis compras).
    compraNumero: "A-1037",
    eventoId: "evt-2",
    mensajes: [
      { id: "msj-4", autor: "comprador", texto: "¿Puedo pagar en la boletería el día de la función?", enviadoEn: "2026-11-06T15:10:00-03:00" },
      { id: "msj-5", autor: "organizador", texto: "Sí, podés pagar en la boletería hasta una hora antes.", enviadoEn: "2026-11-06T16:30:00-03:00" },
    ],
    vistosPorOrganizador: 2,
    vistosPorComprador: 1,
  },
  {
    // Camila · Hamlet: leída por los dos.
    compraNumero: hamletDeCamila.numero,
    eventoId: "evt-1",
    mensajes: [
      { id: "msj-6", autor: "comprador", texto: "¿El estacionamiento es del teatro?", enviadoEn: despuesDe(hamletDeCamila, 1) },
      { id: "msj-7", autor: "organizador", texto: "No, pero hay una playa a media cuadra.", enviadoEn: despuesDe(hamletDeCamila, 5) },
    ],
    vistosPorOrganizador: 2,
    vistosPorComprador: 2,
  },
  {
    // Joaquín · Bodas de sangre: sin responder (contador 1 en el panel de Bodas).
    compraNumero: bodasDeJoaquin.numero,
    eventoId: "evt-3",
    mensajes: [{ id: "msj-8", autor: "comprador", texto: "¿La función dura más de dos horas?", enviadoEn: despuesDe(bodasDeJoaquin, 1) }],
    vistosPorOrganizador: 0,
    vistosPorComprador: 1,
  },
];
