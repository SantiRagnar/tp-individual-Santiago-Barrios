/**
 * Ver specs/007-consultas-chat/data-model.md § Consulta y § Mensaje.
 * Una Consulta es la conversación de una compra entre su comprador y el organizador del evento.
 * `vistosPor…` cuenta cuántos mensajes había cuando cada parte la abrió por última vez (research R2).
 */
export class Mensaje {
  constructor({ id, autor, texto, enviadoEn }) {
    this.id = id;
    this.autor = autor; // "comprador" | "organizador": lo define la sesión, nunca el body
    this.texto = texto;
    this.enviadoEn = enviadoEn;
  }
}

export class Consulta {
  constructor({ compraNumero, eventoId, mensajes = [], vistosPorOrganizador = 0, vistosPorComprador = 0 }) {
    this.compraNumero = compraNumero;
    this.eventoId = eventoId;
    this.mensajes = mensajes.map((m) => (m instanceof Mensaje ? m : new Mensaje(m)));
    this.vistosPorOrganizador = vistosPorOrganizador;
    this.vistosPorComprador = vistosPorComprador;
  }
}
