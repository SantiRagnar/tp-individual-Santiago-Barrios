import { reiniciarRepositorios } from "../../repository/index.js";

/** Cada test arranca desde el estado del seed (constitución: persistencia en memoria). */
export function reiniciarEstado() {
  reiniciarRepositorios();
}
