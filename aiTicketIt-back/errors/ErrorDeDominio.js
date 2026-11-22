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
