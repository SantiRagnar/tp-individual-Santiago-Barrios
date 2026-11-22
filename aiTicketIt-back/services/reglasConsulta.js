// Reglas de lectura de una consulta (specs/007-consultas-chat/data-model.md § Consulta; research R2).
// Una consulta null equivale a una conversación sin mensajes (research R1).

const CAMPO_VISTOS = { organizador: "vistosPorOrganizador", comprador: "vistosPorComprador" };
const OTRA_PARTE = { organizador: "comprador", comprador: "organizador" };

export function ultimoMensaje(consulta) {
  return consulta?.mensajes.at(-1) ?? null;
}

/**
 * No leída para `parte` ("organizador" | "comprador"): el último mensaje es de la otra parte y `parte`
 * no abrió la conversación desde que llegó (FR-015, FR-022).
 */
export function noLeidaPara(consulta, parte) {
  const ultimo = ultimoMensaje(consulta);
  if (!ultimo || ultimo.autor !== OTRA_PARTE[parte]) return false;
  return consulta[CAMPO_VISTOS[parte]] < consulta.mensajes.length;
}
