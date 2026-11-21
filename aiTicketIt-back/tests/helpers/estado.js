import { reiniciarRepositorios } from "../../repository/index.js";
import { fijarAhora } from "../../services/reloj.js";

/** Cada test arranca desde el estado del seed (constitución: persistencia en memoria) y con el reloj real. */
export function reiniciarEstado() {
  reiniciarRepositorios();
  fijarAhora(null);
}
