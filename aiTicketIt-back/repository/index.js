import * as compradoresRepository from "./compradoresRepository.js";
import * as comprasRepository from "./comprasRepository.js";
import * as eventosRepository from "./eventosRepository.js";
import * as favoritosRepository from "./favoritosRepository.js";
import * as imagenesRepository from "./imagenesRepository.js";
import * as organizadoresRepository from "./organizadoresRepository.js";
import * as sesionesRepository from "./sesionesRepository.js";

/** Vuelve todos los repositorios al estado del seed (al iniciar y antes de cada test). */
export function reiniciarRepositorios() {
  compradoresRepository.reiniciar();
  organizadoresRepository.reiniciar();
  sesionesRepository.reiniciar();
  eventosRepository.reiniciar();
  imagenesRepository.reiniciar();
  comprasRepository.reiniciar();
  favoritosRepository.reiniciar();
}
