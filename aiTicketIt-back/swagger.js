import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Ticket It API",
      version: "1.0.0",
    },
  },
  // Documentación con comentarios @openapi en index.js y en las rutas
  apis: ["./index.js", "./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default function swaggerDocs(app) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (req, res) => res.json(swaggerSpec));
}
