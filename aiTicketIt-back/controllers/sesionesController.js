import { autenticacionService } from "../services/autenticacionService.js";
import { aCompradorDto, aOrganizadorDto } from "../dto/sesionDto.js";

const DTO_POR_TIPO = { comprador: aCompradorDto, organizador: aOrganizadorDto };

/** Traduce HTTP ↔ autenticacionService para un tipo de cuenta. */
export function crearSesionesController(tipo) {
  const aDto = DTO_POR_TIPO[tipo];

  return {
    async ingresar(req, res) {
      const { email, contrasena } = req.body;
      const { token, usuario } = await autenticacionService.ingresar(tipo, email, contrasena);
      res.status(201).json({ token, [tipo]: aDto(usuario) });
    },

    /** Requiere requiereSesion(tipo) antes. */
    actual(req, res) {
      res.json({ [tipo]: aDto(req.sesion.usuario) });
    },

    /** Requiere requiereSesion(tipo) antes. */
    cerrar(req, res) {
      autenticacionService.cerrarSesion(tipo, req.sesion.token);
      res.status(204).end();
    },
  };
}
