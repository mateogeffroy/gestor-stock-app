import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import QRCode from "qrcode"
import { LETRA, CBTE, DOC, CONDICIONES_RECEPTOR_UI, urlQr } from "@/lib/arca/fiscal"

export interface ComercioFiscal {
  cuit: string
  razon_social: string
  condicion_iva: "RI" | "MT" | "EX"
  punto_venta: number
  domicilio?: string | null
  ingresos_brutos?: string | null
  inicio_actividades?: string | null
}

const CONDICION_EMISOR = { RI: "IVA Responsable Inscripto", MT: "Responsable Monotributo", EX: "IVA Sujeto Exento" }
const money = (n: number) => `$ ${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fecha = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "-")
const cuitFmt = (c?: string | number | null) => {
  const s = String(c ?? "")
  return s.length === 11 ? `${s.slice(0, 2)}-${s.slice(2, 10)}-${s.slice(10)}` : s
}

// Comprobante en PDF. Con CAE: factura electrónica con los datos de RG 1415, QR (RG 4291) y,
// en Factura B, el IVA contenido (Ley 27.743). Sin CAE: constancia interna "no válida como factura".
export async function generateInvoicePDF(venta: any, fiscal: ComercioFiscal | null, nombreComercio: string) {
  const doc = new jsPDF()
  const W = doc.internal.pageSize.width
  const M = 12
  const esFactura = venta.estado_fiscal === "autorizada" && venta.cae && fiscal
  const letra = esFactura ? LETRA[venta.cbte_tipo] : "X"

  // Recuadro de encabezado con la letra al centro
  doc.setDrawColor(0)
  doc.rect(M, M, W - 2 * M, 46)
  doc.line(W / 2, M + 16, W / 2, M + 46)
  doc.rect(W / 2 - 8, M, 16, 16)
  doc.setFont("helvetica", "bold").setFontSize(20)
  doc.text(letra, W / 2, M + 10, { align: "center" })
  doc.setFontSize(6)
  doc.text(esFactura ? `COD. ${String(venta.cbte_tipo).padStart(3, "0")}` : "", W / 2, M + 14.5, { align: "center" })

  // Emisor (izquierda)
  doc.setFontSize(13).text(fiscal?.razon_social || nombreComercio || "Mi comercio", M + 4, M + 24)
  doc.setFont("helvetica", "normal").setFontSize(8.5)
  let y = M + 30
  if (fiscal) {
    for (const linea of [fiscal.domicilio || "", CONDICION_EMISOR[fiscal.condicion_iva]]) {
      doc.text(linea, M + 4, y)
      y += 4.5
    }
  }

  // Datos del comprobante (derecha)
  const X = W / 2 + 6
  doc.setFont("helvetica", "bold").setFontSize(13)
  doc.text(esFactura ? "FACTURA" : "COMPROBANTE INTERNO", X, M + 24)
  doc.setFontSize(9)
  doc.text(esFactura ? `Nº ${venta.nro_comprobante}` : `Venta #${venta.id}`, X, M + 30)
  doc.setFont("helvetica", "normal").setFontSize(8.5)
  y = M + 35
  const derecha = [`Fecha de emisión: ${fecha(venta.fecha)}`]
  if (fiscal)
    derecha.push(
      `CUIT: ${cuitFmt(fiscal.cuit)}`,
      `Ingresos Brutos: ${fiscal.ingresos_brutos || cuitFmt(fiscal.cuit)}`,
      `Inicio de actividades: ${fecha(fiscal.inicio_actividades)}`
    )
  for (const l of derecha) {
    doc.text(l, X, y)
    y += 4
  }

  // Receptor
  y = M + 54
  const condicion = CONDICIONES_RECEPTOR_UI.find((c) => c.id === (venta.condicion_iva_receptor ?? 5))?.label ?? "Consumidor final"
  const docRec =
    venta.doc_tipo === DOC.CUIT ? `CUIT: ${cuitFmt(venta.doc_nro)}`
    : venta.doc_tipo === DOC.DNI ? `DNI: ${venta.doc_nro}`
    : venta.cliente_cuit ? `CUIT: ${cuitFmt(venta.cliente_cuit)}` : "Sin identificar"
  doc.rect(M, y - 5, W - 2 * M, 14)
  doc.text(`${docRec}`, M + 4, y)
  doc.text(`Apellido y nombre / Razón social: ${venta.cliente_nombre || "Consumidor final"}`, X - 30, y)
  doc.text(`Condición frente al IVA: ${condicion}`, M + 4, y + 5)
  doc.text(`Domicilio: ${venta.cliente_direccion || "-"}`, X - 30, y + 5)

  // Ítems. En Factura A los precios van sin IVA; en B y C, con IVA incluido.
  const discrimina = esFactura && venta.cbte_tipo === CBTE.A
  const factor = discrimina ? Number(venta.imp_neto) / Number(venta.total) : 1
  autoTable(doc, {
    startY: y + 14,
    head: [["Descripción", "Cant.", discrimina ? "Precio unit. (neto)" : "Precio unit.", "Bonif. %", discrimina ? "Subtotal (neto)" : "Subtotal"]],
    body: (venta.venta_detalle ?? []).map((i: any) => [
      (i.descripcion || i.producto?.nombre || "").slice(0, 60),
      i.cantidad,
      money(Number(i.precio_unitario || 0) * factor),
      Number(i.descuento || 0) ? `${i.descuento}` : "",
      money(Number(i.subtotal) * factor),
    ]),
    theme: "plain",
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", cellWidth: 14 }, 2: { halign: "right", cellWidth: 32 }, 3: { halign: "right", cellWidth: 16 }, 4: { halign: "right", cellWidth: 32 } },
  })

  // Totales
  y = (doc as any).lastAutoTable.finalY + 8
  const fila = (label: string, valor: string, negrita = false) => {
    doc.setFont("helvetica", negrita ? "bold" : "normal").setFontSize(negrita ? 11 : 9)
    doc.text(label, W - M - 60, y)
    doc.text(valor, W - M, y, { align: "right" })
    y += negrita ? 7 : 5
  }
  if (discrimina) {
    fila("Importe neto gravado:", money(venta.imp_neto))
    fila(`IVA:`, money(venta.imp_iva))
  }
  fila("Importe total:", money(venta.total), true)

  if (esFactura && venta.cbte_tipo === CBTE.B) {
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text("Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)", M, y)
    doc.text(`IVA contenido: ${money(venta.imp_iva)}`, M, y + 4)
    doc.text("Otros impuestos nacionales indirectos: $ 0,00", M, y + 8)
    y += 12
  }

  // Pie: CAE + QR, o leyenda de comprobante no fiscal
  const H = doc.internal.pageSize.height
  if (esFactura) {
    const qr = await QRCode.toDataURL(
      urlQr({
        fecha: venta.fecha,
        cuit: Number(fiscal!.cuit),
        ptoVta: venta.pto_vta,
        tipoCmp: venta.cbte_tipo,
        nroCmp: Number(venta.cbte_nro),
        importe: Number(venta.total),
        tipoDocRec: venta.doc_tipo ?? DOC.SIN_IDENTIFICAR,
        nroDocRec: Number(venta.doc_nro ?? 0),
        cae: venta.cae,
      }),
      { margin: 0, width: 300 }
    )
    doc.addImage(qr, "PNG", M, H - 42, 30, 30)
    doc.setFont("helvetica", "bold").setFontSize(9)
    doc.text("Comprobante autorizado", M + 34, H - 36)
    doc.setFont("helvetica", "normal").setFontSize(8)
    doc.text("Esta factura fue autorizada por ARCA. Verificala escaneando el código QR.", M + 34, H - 31)
    doc.setFont("helvetica", "bold").setFontSize(9)
    doc.text(`CAE Nº: ${venta.cae}`, W - M, H - 36, { align: "right" })
    doc.text(`Vencimiento CAE: ${fecha(venta.vto_cae)}`, W - M, H - 31, { align: "right" })
  } else {
    doc.setFont("helvetica", "bold").setFontSize(10)
    doc.text("DOCUMENTO NO VÁLIDO COMO FACTURA", W / 2, H - 30, { align: "center" })
  }

  doc.save(esFactura ? `Factura-${letra}-${venta.nro_comprobante}.pdf` : `Comprobante-${venta.id}.pdf`)
}
