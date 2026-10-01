// `node --experimental-strip-types lib/arca/fiscal.check.ts`
import assert from "node:assert/strict"
import {
  tipoComprobante, documentoReceptor, importes, cuitValido, urlQr, numeroComprobante, fechaArca,
  CONDICION_RECEPTOR as C, CBTE, DOC, ErrorFiscal,
} from "./fiscal.ts"

// Letra
assert.equal(tipoComprobante("MT", C.RESPONSABLE_INSCRIPTO), CBTE.C)
assert.equal(tipoComprobante("EX", C.CONSUMIDOR_FINAL), CBTE.C)
assert.equal(tipoComprobante("RI", C.RESPONSABLE_INSCRIPTO), CBTE.A)
assert.equal(tipoComprobante("RI", C.MONOTRIBUTO), CBTE.A)
assert.equal(tipoComprobante("RI", C.CONSUMIDOR_FINAL), CBTE.B)
assert.equal(tipoComprobante("RI", C.EXENTO), CBTE.B)

// CUIT
assert.ok(cuitValido("20111111112"))
assert.ok(cuitValido("30500010912")) // CUIT público conocido
assert.ok(!cuitValido("20111111113"))
assert.ok(!cuitValido("2011111111"))

// Documento del receptor
assert.deepEqual(documentoReceptor({ condicion: C.CONSUMIDOR_FINAL }, 5000), { DocTipo: DOC.SIN_IDENTIFICAR, DocNro: 0 })
assert.deepEqual(documentoReceptor({ condicion: C.CONSUMIDOR_FINAL, dni: "30123456" }, 5000), { DocTipo: DOC.DNI, DocNro: 30123456 })
assert.deepEqual(documentoReceptor({ condicion: C.RESPONSABLE_INSCRIPTO, cuit: "20111111112" }, 1), { DocTipo: DOC.CUIT, DocNro: 20111111112 })
assert.throws(() => documentoReceptor({ condicion: C.CONSUMIDOR_FINAL }, 10_000_000), ErrorFiscal)
assert.throws(() => documentoReceptor({ condicion: C.RESPONSABLE_INSCRIPTO }, 100), ErrorFiscal)
assert.throws(() => documentoReceptor({ condicion: C.MONOTRIBUTO, cuit: "20111111113" }, 100), ErrorFiscal)

// Importes: neto + IVA siempre suma el total exacto
for (const total of [100, 1234.56, 0.01, 999999.99, 3333.33]) {
  const i = importes(CBTE.B, total, 21)
  assert.equal(Math.round((i.ImpNeto + i.ImpIVA) * 100), Math.round(total * 100), `total ${total}`)
  assert.equal(i.Iva![0].Id, 5)
  assert.equal(i.Iva![0].BaseImp, i.ImpNeto)
}
assert.deepEqual(importes(CBTE.B, 121, 21).ImpNeto, 100)
assert.equal(importes(CBTE.A, 110.5, 10.5).Iva![0].Id, 4)
const c = importes(CBTE.C, 500, 21)
assert.equal(c.ImpNeto, 500); assert.equal(c.ImpIVA, 0); assert.equal(c.Iva, undefined)
assert.throws(() => importes(CBTE.B, 100, 19), ErrorFiscal)

// Formatos
assert.equal(numeroComprobante(1, 23), "00001-00000023")
assert.equal(fechaArca(new Date("2026-10-01T02:00:00Z")), "20260930") // 23 h del 30/09 en Argentina
const qr = urlQr({ fecha: "2026-10-01", cuit: 20111111112, ptoVta: 1, tipoCmp: 6, nroCmp: 5, importe: 121, tipoDocRec: 99, nroDocRec: 0, cae: "76123456789012" })
const json = JSON.parse(Buffer.from(qr.split("p=")[1], "base64").toString())
assert.equal(json.codAut, 76123456789012)
assert.equal(json.tipoCodAut, "E")
console.log("fiscal ok")
