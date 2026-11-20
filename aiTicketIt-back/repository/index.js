import * as compradoresRepository from "./compradoresRepository.js";
import * as organizadoresRepository from "./organizadoresRepository.js";
import * as sesionesRepository from "./sesionesRepository.js";

/** Vuelve todos los repositorios al estado del seed (al iniciar y antes de cada test). */
export function reiniciarRepositorios() {
  compradoresRepository.reiniciar();
  organizadoresRepository.reiniciar();
  sesionesRepository.reiniciar();
}
