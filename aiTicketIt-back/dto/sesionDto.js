// Solo los campos del contrato (contracts/sesiones.openapi.yaml). Nunca contrasenaHash (FR-012).

export function aCompradorDto({ id, nombre, apellido, email }) {
  return { id, nombre, apellido, email };
}

export function aOrganizadorDto({ id, nombre, email }) {
  return { id, nombre, email };
}
