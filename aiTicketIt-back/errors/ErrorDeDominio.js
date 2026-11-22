export class ErrorDeDominio extends Error {
  constructor({ codigo, mensaje, status, campos }) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigo = codigo;
    this.mensaje = mensaje;
    this.status = status;
    this.campos = campos;
  }
}

export class CredencialesInvalidas extends ErrorDeDominio {
  constructor() {
    super({
      codigo: "CREDENCIALES_INVALIDAS",
      mensaje: "El email o la contraseña no son correctos.",
      status: 401,
    });
  }
}

export class SesionInvalida extends ErrorDeDominio {
  constructor() {
    super({
      codigo: "SESION_INVALIDA",
      mensaje: "Tu sesión no es válida. Ingresá de nuevo.",
      status: 401,
    });
  }
}

export class DatosInvalidos extends ErrorDeDominio {
  constructor(campos) {
    super({
      codigo: "DATOS_INVALIDOS",
      mensaje: "Revisá los datos enviados.",
      status: 400,
      campos,
    });
  }
}

export class EventoNoEncontrado extends ErrorDeDominio {
  constructor() {
    super({ codigo: "EVENTO_NO_ENCONTRADO", mensaje: "No encontramos el evento.", status: 404 });
  }
}

export class EventoFinalizado extends ErrorDeDominio {
  constructor() {
    super({ codigo: "EVENTO_FINALIZADO", mensaje: "El evento ya se realizó: no se puede editar.", status: 409 });
  }
}

export class NoSePuedeDespublicar extends ErrorDeDominio {
  constructor() {
    super({
      codigo: "NO_SE_PUEDE_DESPUBLICAR",
      mensaje: "Un evento publicado no puede volver a borrador.",
      status: 409,
    });
  }
}

export class ImagenInvalida extends ErrorDeDominio {
  constructor() {
    super({ codigo: "IMAGEN_INVALIDA", mensaje: "La imagen tiene que ser JPG o PNG", status: 415 });
  }
}

export class ImagenMuyGrande extends ErrorDeDominio {
  constructor() {
    super({ codigo: "IMAGEN_MUY_GRANDE", mensaje: "La imagen no puede pesar más de 5 MB", status: 413 });
  }
}

export class ImagenNoEncontrada extends ErrorDeDominio {
  constructor() {
    super({ codigo: "IMAGEN_NO_ENCONTRADA", mensaje: "No encontramos la imagen.", status: 404 });
  }
}

export class OrganizadorNoEncontrado extends ErrorDeDominio {
  constructor() {
    super({ codigo: "ORGANIZADOR_NO_ENCONTRADO", mensaje: "No encontramos el organizador.", status: 404 });
  }
}

// Feature 004 · compras (specs/004-compra-pago-mis-compras/research.md R4). Los textos de pantalla los arma
// el front a partir del código, porque incluyen el nombre del tipo de entrada.

export class PrecioCambiado extends ErrorDeDominio {
  constructor() {
    super({ codigo: "PRECIO_CAMBIADO", mensaje: "El precio de la entrada cambió. Revisá tu compra.", status: 409 });
  }
}

export class LugaresInsuficientes extends ErrorDeDominio {
  constructor() {
    super({ codigo: "LUGARES_INSUFICIENTES", mensaje: "Ya no quedan suficientes entradas.", status: 409 });
  }
}

// La usan la feature 004 (compras del comprador) y la 005 (panel del evento) con el mismo código y texto.
export class CompraNoEncontrada extends ErrorDeDominio {
  constructor() {
    super({ codigo: "COMPRA_NO_ENCONTRADA", mensaje: "No encontramos esta compra.", status: 404 });
  }
}

export class PagoNoPermitido extends ErrorDeDominio {
  constructor() {
    super({ codigo: "PAGO_NO_PERMITIDO", mensaje: "Esta compra no tiene un pago pendiente.", status: 409 });
  }
}

export class CancelacionNoPermitida extends ErrorDeDominio {
  constructor() {
    super({ codigo: "CANCELACION_NO_PERMITIDA", mensaje: "Esta compra no se puede cancelar.", status: 409 });
  }
}

// Feature 005 (specs/005-panel-evento/data-model.md § Errores nuevos).
export class CompraNoConfirmada extends ErrorDeDominio {
  constructor() {
    super({ codigo: "COMPRA_NO_CONFIRMADA", mensaje: "La compra ya no está confirmada.", status: 409 });
  }
}

export class EventoNoComenzo extends ErrorDeDominio {
  constructor() {
    super({ codigo: "EVENTO_NO_COMENZO", mensaje: "Todavía no es el día del evento.", status: 409 });
  }
}
