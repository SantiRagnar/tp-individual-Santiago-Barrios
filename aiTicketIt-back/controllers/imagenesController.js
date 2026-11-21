import * as imagenesService from "../services/imagenesService.js";

/** Traduce HTTP ↔ imagenesService. */
export const imagenesController = {
  /** Requiere requiereSesion("organizador") y express.raw antes: req.body es el Buffer del archivo. */
  subir(req, res) {
    const datos = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const imagen = imagenesService.subir(req.sesion.usuario.id, req.get("Content-Type"), datos);
    res.status(201).json({ id: imagen.id, url: `/imagenes/${imagen.id}` });
  },

  servir(req, res) {
    const imagen = imagenesService.obtener(req.params.id);
    res.set("Content-Type", imagen.tipoMime);
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.send(imagen.datos);
  },
};
