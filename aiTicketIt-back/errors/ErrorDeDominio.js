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
