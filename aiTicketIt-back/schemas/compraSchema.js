import { z } from "zod";

// Body de POST /compradores/compras (specs/004-compra-pago-mis-compras/data-model.md § Validaciones de
// entrada). Solo la forma: que el evento sea visible, el precio coincida y haya lugares lo decide el servicio
// (research R4). Estricto: el pago es simulado y no recibe datos de tarjeta ni monto (FR-008).

export const MEDIOS_DE_PAGO = ["Tarjeta de crédito", "Tarjeta de débito", "Mercado Pago", "Transferencia"];

const MENSAJE_CANTIDAD = "La cantidad tiene que ser de 1 a 10";
const MENSAJE_PRECIO = "Indicá el precio de la entrada";

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
    precioUnitario: z.number({ error: MENSAJE_PRECIO }).int({ error: MENSAJE_PRECIO }).min(0, { error: MENSAJE_PRECIO }),
  },
  { error: "Hay datos que no corresponden a una compra" },
);
