import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Rutas absolutas: así la documentación se arma igual sin importar desde qué directorio se corre.
const raiz = fileURLToPath(new URL(".", import.meta.url));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Ticket It API",
      version: "1.0.0",
    },
  },
  // Documentación con comentarios @openapi en app.js y en las rutas
  apis: [`${raiz}app.js`, `${raiz}routes/*.js`],
};

const swaggerSpec = swaggerJsdoc(options);

export default function swaggerDocs(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (req, res) => res.json(swaggerSpec));
}
