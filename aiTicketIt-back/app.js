import cors from "cors";
import express from "express";
import swaggerDocs from "./swagger.js";
import { manejadorDeErrores } from "./errors/manejadorDeErrores.js";
import { crearRouterSesiones } from "./routes/sesiones.js";

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
    timestamp: new Date().toISOString(),
  });
});

app.use("/compradores/sesiones", crearRouterSesiones("comprador"));
app.use("/organizadores/sesiones", crearRouterSesiones("organizador"));

swaggerDocs(app);

app.use(manejadorDeErrores);

export default app;
