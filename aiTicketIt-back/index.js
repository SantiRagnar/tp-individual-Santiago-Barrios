import app from "./app.js";
import { reiniciarRepositorios } from "./repository/index.js";
import { fijarAhoraDesdeEntorno } from "./services/reloj.js";

// Persistencia en memoria: al iniciar se carga el seed.
reiniciarRepositorios();

// Fecha simulada opcional para validar a mano con las fechas del seed (feature 004, research R15).
try {
  const fechaSimulada = fijarAhoraDesdeEntorno(process.env.FECHA_SIMULADA);
  if (fechaSimulada) console.log(`Fecha simulada: ${fechaSimulada}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/docs`);
});
