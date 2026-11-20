import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ingresoSchema } from "../../schemas/ingresoSchema.js";

function mensajesDe(resultado) {
  return Object.fromEntries(
    resultado.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
}

describe("ingresoSchema", () => {
  it("recorta y pasa a minúsculas el email", () => {
    const r = ingresoSchema.safeParse({
      email: "  Sofia.Gomez@Correo.com ",
      contrasena: "x",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.email, "sofia.gomez@correo.com");
  });

  it("no recorta la contraseña", () => {
    const r = ingresoSchema.safeParse({
      email: "a@b.com",
      contrasena: " con espacios ",
    });
    assert.equal(r.success, true);
    assert.equal(r.data.contrasena, " con espacios ");
  });

  it("pide el email si falta o está vacío", () => {
    for (const email of [undefined, "", "   "]) {
      const r = ingresoSchema.safeParse({ email, contrasena: "x" });
      assert.equal(r.success, false);
      assert.equal(mensajesDe(r).email, "Ingresá tu email");
    }
  });

  it("rechaza un email con formato inválido", () => {
    for (const email of ["sofia@", "sofia", "sofia@correo", "@correo.com"]) {
      const r = ingresoSchema.safeParse({ email, contrasena: "x" });
      assert.equal(r.success, false, email);
      assert.equal(mensajesDe(r).email, "Ingresá un email válido");
    }
  });

  it("pide la contraseña si falta o está vacía", () => {
    for (const contrasena of [undefined, ""]) {
      const r = ingresoSchema.safeParse({ email: "a@b.com", contrasena });
      assert.equal(r.success, false);
      assert.equal(mensajesDe(r).contrasena, "Ingresá tu contraseña");
    }
  });
});
