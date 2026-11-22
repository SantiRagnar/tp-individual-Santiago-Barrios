import { puedeMarcarUtilizada } from "../services/reglasVenta.js";

// Fila de la tabla de Ventas (specs/005-panel-evento/data-model.md § Venta; contracts/ventas.openapi.yaml Venta).
// No expone el email del comprador (salvo que no tenga nombre) ni ids internos (research R7).

/** Nombre y apellido del comprador, o su email si faltan (también lo usa dto/consultaDto.js). */
export function nombreDelComprador(comprador) {
  if (!comprador) return "";
  const completo = [comprador.nombre, comprador.apellido].filter(Boolean).join(" ");
  return completo || comprador.email;
}

export function aVentaDto(compra, { comprador, evento, ahora }) {
  const tipo = evento.tiposDeEntrada.find((t) => t.id === compra.tipoDeEntradaId);
  return {
    numero: compra.numero,
    comprador: { nombre: nombreDelComprador(comprador) },
    tipoDeEntrada: { id: compra.tipoDeEntradaId, nombre: compra.tipoDeEntradaNombre ?? tipo?.nombre ?? null },
    cantidad: compra.cantidad,
    estado: compra.estado,
    medioDePago: compra.medioDePago,
    monto: compra.monto,
    creadaEn: compra.creadaEn,
    acciones: { marcarUtilizada: puedeMarcarUtilizada(compra, evento, ahora) },
  };
}
