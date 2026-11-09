import cors from "cors";
import express from "express";
import swaggerDocs from "./swagger.js";
// import { conectarDB } from "./db.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : true,
  }),
);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Estado del servicio
 *     responses:
 *       200:
 *         description: El servicio está levantado
 */
app.get("/health", (req, res) => {
  res.json({ 
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
 });
});

swaggerDocs(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Documentación en http://localhost:${PORT}/docs`);
});