import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import * as imagenesService from "../../services/imagenesService.js";
import { ImagenInvalida } from "../../errors/ErrorDeDominio.js";
import { reiniciarEstado } from "../helpers/estado.js";

beforeEach(() => reiniciarEstado());

export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
export const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PDF = Buffer.from("%PDF-1.7\n");

describe("imagenesService.subir — firma de bytes (research R7)", () => {
  it("acepta un JPG y un PNG y los guarda con un UUID del organizador", () => {
    for (const [tipoMime, datos] of [
      ["image/jpeg", JPG],
      ["image/png", PNG],
    ]) {
      const imagen = imagenesService.subir("org-1", tipoMime, datos);
      assert.match(imagen.id, /^[0-9a-f-]{36}$/);
      assert.equal(imagen.organizadorId, "org-1");
      assert.equal(imagen.tipoMime, tipoMime);
      assert.equal(imagenesService.obtener(imagen.id).datos, datos);
    }
  });

  it("rechaza bytes que no coinciden con el tipo declarado", () => {
    assert.throws(() => imagenesService.subir("org-1", "image/jpeg", Buffer.from("no soy una imagen")), ImagenInvalida);
    assert.throws(() => imagenesService.subir("org-1", "image/jpeg", PNG), ImagenInvalida);
  });

  it("rechaza un buffer vacío, un PDF y un tipo que no es imagen", () => {
    assert.throws(() => imagenesService.subir("org-1", "image/png", Buffer.alloc(0)), ImagenInvalida);
    assert.throws(() => imagenesService.subir("org-1", "image/png", PDF), ImagenInvalida);
    assert.throws(() => imagenesService.subir("org-1", "application/pdf", PDF), ImagenInvalida);
  });
});

describe("imagenesService.esDelOrganizador", () => {
  it("una imagen subida es solo de quien la subió", () => {
    const { id } = imagenesService.subir("org-1", "image/png", PNG);
    assert.equal(imagenesService.esDelOrganizador("org-1", id), true);
    assert.equal(imagenesService.esDelOrganizador("org-2", id), false);
    assert.equal(imagenesService.esDelOrganizador("org-1", "no-existe"), false);
  });

  it("las imágenes del seed solo valen para el evento del seed que ya las usa", () => {
    assert.equal(imagenesService.esDelOrganizador("org-1", "img-seed-hamlet"), false);
  });
});
