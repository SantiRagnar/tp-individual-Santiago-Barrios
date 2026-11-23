import { z } from "zod";

// Body de POST /compradores/compras (specs/004-compra-pago-mis-compras/data-model.md § Validaciones de
// entrada). Solo la forma: que el evento sea visible, el tipo exista y haya lugares lo decide el servicio
// (research R4). Estricto: el pago es simulado y no recibe datos de tarjeta, monto ni precio unitario (FR-008).
// El precio unitario se toma del repository y el monto se calcula en el backend (precioUnitario × cantidad).

export const MEDIOS_DE_PAGO = ["Tarjeta de crédito", "Tarjeta de débito", "Mercado Pago", "Transferencia"];

const MENSAJE_CANTIDAD = "La cantidad tiene que ser de 1 a 10";

const idObligatorio = (mensaje) => z.string({ error: mensaje }).trim().min(1, { error: mensaje });

export const compraSchema = z.strictObject(
  {
    eventoId: idObligatorio("Indicá el evento"),
    tipoDeEntradaId: idObligatorio("Elegí un tipo de entrada"),
    cantidad: z
      .number({ error: MENSAJE_CANTIDAD })
      .int({ error: MENSAJE_CANTIDAD })
      .min(1, { error: MENSAJE_CANTIDAD })
      .max(10, { error: MENSAJE_CANTIDAD }),
    medioDePago: z.enum(MEDIOS_DE_PAGO, { error: "Elegí un medio de pago" }),
  },
  { error: "Hay datos que no corresponden a una compra" },
);
