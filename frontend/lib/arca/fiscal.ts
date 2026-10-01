// Reglas fiscales de facturación electrónica (WSFEv1, ARCA). Puras: sin red ni base de datos.
// Fuente de cada regla en docs/facturacion-arca.md.

// Condición frente al IVA del EMISOR (el comercio)
export type CondicionEmisor = "RI" | "MT" | "EX" // Responsable Inscripto, Monotributo, Exento

// Condición frente al IVA del RECEPTOR: códigos de FEParamGetCondicionIvaReceptor (RG 5616)
export const CONDICION_RECEPTOR = {
  RESPONSABLE_INSCRIPTO: 1,
  EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
  MONOTRIBUTO: 6,
  NO_CATEGORIZADO: 7,
  MONOTRIBUTO_SOCIAL: 13,
  MONOTRIBUTO_PROMOVIDO: 16,
} as const

export const CONDICIONES_RECEPTOR_UI = [
  { id: CONDICION_RECEPTOR.RESPONSABLE_INSCRIPTO, label: "Responsable inscripto" },
  { id: CONDICION_RECEPTOR.MONOTRIBUTO, label: "Monotributista" },
  { id: CONDICION_RECEPTOR.EXENTO, label: "Exento" },
  { id: CONDICION_RECEPTOR.CONSUMIDOR_FINAL, label: "Consumidor final" },
] as const

export const CBTE = { A: 1, B: 6, C: 11 } as const
export const LETRA: Record<number, "A" | "B" | "C"> = { 1: "A", 6: "B", 11: "C" }

export const DOC = { CUIT: 80, DNI: 96, SIN_IDENTIFICAR: 99 } as const

// IDs de alícuota de IVA en WSFE
const ALICUOTA_ID: Record<number, number> = { 0: 3, 2.5: 9, 5: 8, 10.5: 4, 21: 5, 27: 6 }

// RG 5700/2025: identificar al consumidor final solo desde este monto
export const UMBRAL_IDENTIFICACION_CF = 10_000_000

const r2 = (n: number) => Math.round(n * 100) / 100

// Letra del comprobante según quién emite y quién recibe
export function tipoComprobante(emisor: CondicionEmisor, receptor: number): number {
  if (emisor !== "RI") return CBTE.C // Monotributo y Exento emiten siempre C
  const recibeA: number[] = [
    CONDICION_RECEPTOR.RESPONSABLE_INSCRIPTO,
    CONDICION_RECEPTOR.MONOTRIBUTO, // RG 5003: monotributistas reciben A
    CONDICION_RECEPTOR.MONOTRIBUTO_SOCIAL,
    CONDICION_RECEPTOR.MONOTRIBUTO_PROMOVIDO,
  ]
  return recibeA.includes(receptor) ? CBTE.A : CBTE.B
}

export interface Receptor {
  condicion: number
  cuit?: string | null // 11 dígitos
  dni?: string | null
}

export function documentoReceptor(r: Receptor, total: number): { DocTipo: number; DocNro: number } {
  if (r.cuit) {
    if (!cuitValido(r.cuit)) throw new ErrorFiscal("El CUIT del cliente no es válido. Revisá los 11 dígitos.")
    return { DocTipo: DOC.CUIT, DocNro: Number(r.cuit) }
  }
  if (r.condicion !== CONDICION_RECEPTOR.CONSUMIDOR_FINAL)
    throw new ErrorFiscal("Para facturar a un cliente que no es consumidor final hace falta su CUIT.")
  if (r.dni) return { DocTipo: DOC.DNI, DocNro: Number(r.dni) }
  if (total >= UMBRAL_IDENTIFICACION_CF)
    throw new ErrorFiscal("Desde $10.000.000 hay que identificar al consumidor final con DNI o CUIT.")
  return { DocTipo: DOC.SIN_IDENTIFICAR, DocNro: 0 }
}

// Desglose de importes. El total cargado en la venta es precio final (IVA incluido).
export function importes(cbteTipo: number, total: number, alicuota: number) {
  total = r2(total)
  if (cbteTipo === CBTE.C) return { ImpTotal: total, ImpNeto: total, ImpIVA: 0, ImpTotConc: 0, ImpOpEx: 0, ImpTrib: 0, Iva: undefined }
  const id = ALICUOTA_ID[alicuota]
  if (!id) throw new ErrorFiscal(`Alícuota de IVA no soportada: ${alicuota} %`)
  const neto = r2(total / (1 + alicuota / 100))
  const iva = r2(total - neto) // por diferencia: neto + iva == total exacto
  return {
    ImpTotal: total, ImpNeto: neto, ImpIVA: iva, ImpTotConc: 0, ImpOpEx: 0, ImpTrib: 0,
    Iva: [{ Id: id, BaseImp: neto, Importe: iva }],
  }
}

// Dígito verificador de CUIT/CUIL (módulo 11)
export function cuitValido(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const suma = pesos.reduce((s, p, i) => s + p * Number(cuit[i]), 0)
  let dv = 11 - (suma % 11)
  if (dv === 11) dv = 0
  if (dv === 10) return false
  return dv === Number(cuit[10])
}

export const fechaArca = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).replaceAll("-", "")

// Formato de número de comprobante impreso: 00001-00000023
export const numeroComprobante = (ptoVta: number, nro: number) =>
  `${String(ptoVta).padStart(5, "0")}-${String(nro).padStart(8, "0")}`

// QR obligatorio en el comprobante impreso (RG 4291). fecha: YYYY-MM-DD
export function urlQr(c: {
  fecha: string; cuit: number; ptoVta: number; tipoCmp: number; nroCmp: number; importe: number
  tipoDocRec: number; nroDocRec: number; cae: string
}) {
  const datos = {
    ver: 1, fecha: c.fecha, cuit: c.cuit, ptoVta: c.ptoVta, tipoCmp: c.tipoCmp, nroCmp: c.nroCmp,
    importe: c.importe, moneda: "PES", ctz: 1, tipoDocRec: c.tipoDocRec, nroDocRec: c.nroDocRec,
    tipoCodAut: "E", codAut: Number(c.cae),
  }
  const b64 = typeof btoa === "function" ? btoa(JSON.stringify(datos)) : Buffer.from(JSON.stringify(datos)).toString("base64")
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`
}

export class ErrorFiscal extends Error {}
