"use client"

import { useState } from "react"
import { Venta } from "../types"
import { ventaService } from "@/services/venta-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, ShieldCheck, AlertTriangle, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { useBusiness } from "@/context/business-context"
import { supabase } from "@/lib/supabase"
import { DOC } from "@/lib/arca/fiscal"

interface VentaDetalleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: Venta | null
  onVentaUpdated?: () => void
}

const MEDIO: Record<string, string> = {
  efectivo: "Efectivo", debito: "Débito", credito: "Crédito", transferencia: "Transferencia", qr: "QR", otro: "Otro",
}
const money = (n: number) => `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
const fecha = (iso?: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "")

export function VentaDetalleDialog({ open, onOpenChange, venta, onVentaUpdated }: VentaDetalleDialogProps) {
  const { toast } = useToast()
  const { businessName } = useBusiness()
  const [facturando, setFacturando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState(false)

  if (!venta) return null
  const v = venta as any

  const handleFacturar = async () => {
    setFacturando(true)
    try {
      const f = await ventaService.facturar(venta.id)
      toast({ title: `${f.tipo_comprobante} ${f.nro_comprobante} autorizada`, description: `CAE ${f.cae}` })
    } catch (e: any) {
      toast({ title: "Factura no emitida", description: e.message, variant: "destructive", duration: 10000 })
    } finally {
      setFacturando(false)
      onVentaUpdated?.()
    }
  }

  const handlePrint = async () => {
    setImprimiendo(true)
    try {
      const { data: fiscal } = await supabase.from("comercio_fiscal").select("*").maybeSingle()
      await generateInvoicePDF(v, fiscal, businessName)
    } catch (error) {
      console.error("Error PDF:", error)
      toast({ title: "No se pudo generar el PDF", description: "Probá de nuevo.", variant: "destructive" })
    } finally {
      setImprimiendo(false)
    }
  }

  const receptor =
    v.doc_tipo === DOC.CUIT ? `CUIT ${v.doc_nro}` : v.doc_tipo === DOC.DNI ? `DNI ${v.doc_nro}` : v.cliente_cuit ? `CUIT ${v.cliente_cuit}` : "Consumidor final"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-bold">Venta #{venta.id}</DialogTitle>
          <DialogDescription>
            {fecha(venta.fecha)}, {venta.hora?.substring(0, 5)} h · Caja #{venta.id_caja}
            {v.medio_pago && ` · ${MEDIO[v.medio_pago]}`}
          </DialogDescription>
        </DialogHeader>

        {/* Estado fiscal: siempre con ícono + texto */}
        <section className="rounded-md border p-4 text-sm">
          {v.estado_fiscal === "autorizada" ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-ok" aria-hidden /> {v.tipo_comprobante} {v.nro_comprobante}
              </p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                <div><dt className="text-muted-foreground">CAE</dt><dd className="font-medium break-all">{v.cae}</dd></div>
                <div><dt className="text-muted-foreground">Vence</dt><dd className="font-medium">{fecha(v.vto_cae)}</dd></div>
                <div><dt className="text-muted-foreground">Cliente</dt><dd className="font-medium">{receptor}</dd></div>
              </dl>
            </div>
          ) : v.estado_fiscal === "no_aplica" || !v.estado_fiscal ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground">Esta venta se registró sin factura.</p>
              <Button variant="outline" size="sm" onClick={handleFacturar} disabled={facturando}>
                {facturando && <Loader2 className="animate-spin" />} Emitir factura
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  {v.estado_fiscal === "error" ? (
                    <><AlertTriangle className="h-4 w-4 text-destructive" aria-hidden /> La factura no se emitió</>
                  ) : (
                    <><Clock className="h-4 w-4" aria-hidden /> Factura pendiente</>
                  )}
                </p>
                {v.error_fiscal && <p className="text-muted-foreground">{v.error_fiscal}</p>}
                {v.estado_fiscal === "procesando" && (
                  <p className="text-muted-foreground">Se está pidiendo el CAE. Si sigue así varios minutos, revisá en ARCA antes de reintentar.</p>
                )}
              </div>
              {v.estado_fiscal !== "procesando" && (
                <Button size="sm" onClick={handleFacturar} disabled={facturando} className="font-semibold">
                  {facturando && <Loader2 className="animate-spin" />} {v.estado_fiscal === "error" ? "Reintentar" : "Facturar ahora"}
                </Button>
              )}
            </div>
          )}
        </section>

        <div className="max-h-[300px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.venta_detalle?.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.descripcion || d.producto?.nombre || "Producto borrado del inventario"}
                    {d.producto?.codigo && <span className="block text-xs text-muted-foreground">{d.producto.codigo}</span>}
                  </TableCell>
                  <TableCell className="text-right">{d.cantidad}</TableCell>
                  <TableCell className="text-right">{money(d.precio_unitario || d.producto?.precio_lista || 0)}</TableCell>
                  <TableCell className="text-right font-semibold">{money(d.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center sm:justify-between">
          <Button variant="outline" onClick={handlePrint} disabled={imprimiendo}>
            {imprimiendo ? <Loader2 className="animate-spin" /> : <Printer />}
            {v.estado_fiscal === "autorizada" ? "Descargar factura" : "Descargar comprobante"}
          </Button>
          <p className="font-display text-4xl font-bold">{money(venta.total)}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
