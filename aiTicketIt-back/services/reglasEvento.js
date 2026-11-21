// Reglas de negocio de los eventos (research R4). Devuelven todos los errores juntos, uno por campo,
// con los mensajes del design system; el servicio los lanza como DatosInvalidos.
// El front replica estas reglas en src/lib/validacionEvento.ts (research R13).

const normalizarNombre = (nombre) => nombre.trim().toLowerCase();

/** Reglas para publicar (o guardar cambios de un Publicado): FR-011 y FR-012. */
export function validarParaPublicar(evento, ahora) {
  const errores = [];
  const agregar = (campo, mensaje) => errores.push({ campo, mensaje });

  if (!evento.nombre) agregar("nombre", "Poné un nombre al evento");

  if (!evento.fechaHora) agregar("fechaHora", "Elegí fecha y hora");
  else if (new Date(evento.fechaHora).getTime() <= ahora.getTime()) agregar("fechaHora", "La fecha tiene que ser futura");

  if (!evento.ubicacion) agregar("ubicacion", "Indicá dónde se hace el evento");

  const tipos = evento.tiposDeEntrada ?? [];
  if (tipos.length === 0) agregar("tiposDeEntrada", "Agregá al menos un tipo de entrada");

  const vistos = new Set();
  tipos.forEach((tipo, i) => {
    const campo = (nombre) => `tiposDeEntrada.${i}.${nombre}`;

    if (!tipo.nombre) agregar(campo("nombre"), "Poné un nombre");
    else if (vistos.has(normalizarNombre(tipo.nombre))) agregar(campo("nombre"), "Ya hay una entrada con este nombre");
    if (tipo.nombre) vistos.add(normalizarNombre(tipo.nombre));

    if (tipo.cupo === null || tipo.cupo === undefined) agregar(campo("cupo"), "Indicá el cupo");
    else if (tipo.cupo < 1) agregar(campo("cupo"), "El cupo tiene que ser 1 o más");

    if (tipo.precio === null || tipo.precio === undefined) agregar(campo("precio"), "Indicá el precio");
    else if (tipo.precio < 0) agregar(campo("precio"), "El precio no puede ser negativo");
  });

  return errores;
}

/**
 * Reglas de ventas al editar (FR-020, research R6): un tipo con ventas no se puede quitar ni quedar
 * con cupo menor a sus vendidas; un id de tipo tiene que ser de este evento. Nombre y precio sí cambian.
 */
export function validarCambiosConVentas(guardado, entrada) {
  const errores = [];
  const guardadosPorId = new Map(guardado.tiposDeEntrada.map((t) => [t.id, t]));
  const idsEnviados = new Set();

  entrada.tiposDeEntrada.forEach((tipo, i) => {
    if (tipo.id === undefined) return;
    const anterior = guardadosPorId.get(tipo.id);
    if (!anterior) {
      errores.push({ campo: `tiposDeEntrada.${i}.id`, mensaje: "Ese tipo de entrada no es de este evento" });
      return;
    }
    idsEnviados.add(tipo.id);
    if (anterior.vendidas > 0 && tipo.cupo !== null && tipo.cupo !== undefined && tipo.cupo < anterior.vendidas) {
      errores.push({
        campo: `tiposDeEntrada.${i}.cupo`,
        mensaje: `El cupo no puede ser menor a las vendidas (${anterior.vendidas})`,
      });
    }
  });

  const quitaUnoConVentas = guardado.tiposDeEntrada.some((t) => t.vendidas > 0 && !idsEnviados.has(t.id));
  if (quitaUnoConVentas) errores.push({ campo: "tiposDeEntrada", mensaje: "Tiene ventas: no se puede quitar" });

  return errores;
}
