import app from "./app.js";
import { reiniciarRepositorios } from "./repository/index.js";
import { fijarAhora } from "./services/reloj.js";

// Persistencia en memoria: al iniciar se carga el seed.
reiniciarRepositorios();

// FECHA_SIMULADA (ISO 8601) fija "hoy" para probar a mano reglas que dependen de la fecha
// (specs/005-panel-evento/research.md R9; misma decisión que la feature 004).
const fechaSimulada = process.env.FECHA_SIMULADA;
if (fechaSimulada) {
  if (Number.isNaN(new Date(fechaSimulada).getTime())) {
    console.error(`FECHA_SIMULADA no es una fecha válida (ISO 8601): "${fechaSimulada}"`);
    process.exit(1);
  }
  fijarAhora(fechaSimulada);
  console.log(`Fecha simulada: ${new Date(fechaSimulada).toISOString()}`);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/docs`);
});
