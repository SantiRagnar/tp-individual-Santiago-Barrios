import app from "./app.js";
import { reiniciarRepositorios } from "./repository/index.js";

// Persistencia en memoria: al iniciar se carga el seed.
reiniciarRepositorios();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/docs`);
});
