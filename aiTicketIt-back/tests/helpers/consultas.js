import * as comprasRepository from "../../repository/comprasRepository.js";
import * as consultasRepository from "../../repository/consultasRepository.js";

/** Escribe un mensaje directo en el repositorio, para preparar escenarios (specs/007-consultas-chat). */
export function enviarMensaje(numero, autor, texto = "Mensaje de prueba") {
  const compra = comprasRepository.buscarPorNumero(numero);
  return consultasRepository.agregarMensaje({
    compraNumero: numero,
    eventoId: compra.eventoId,
    autor,
    texto,
    enviadoEn: new Date().toISOString(),
  }).mensaje;
}

/** Id del último mensaje de la compra, o null. */
export function ultimoId(numero) {
  return consultasRepository.buscar(numero)?.mensajes.at(-1)?.id ?? null;
}

/** Una compra del evento sin mensajes en el seed (la primera por número). */
export function compraSinMensajes(eventoId) {
  return comprasRepository
    .todasDelEvento(eventoId)
    .filter((c) => !consultasRepository.buscar(c.numero))
    .sort((a, b) => (a.numero < b.numero ? -1 : 1))[0];
}
