"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Venta } from "../types"

interface VentaDetalleDialogProps {
  venta: Venta | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VentaDetalleDialog({ venta, open, onOpenChange }: VentaDetalleDialogProps) {
  if (!venta) return null

  const totalSinDescuento = venta.detalles.reduce((sum, detalle) => {
    return sum + (Number(detalle.precio_unitario) * detalle.cantidad)
  }, 0)
  
  const totalDescuentos = totalSinDescuento - Number(venta.importe_total)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de Venta #{venta.id}</DialogTitle>
          <DialogDescription>
            Realizada el {new Date(venta.fecha_y_hora).toLocaleString('es-AR')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>Desc. Ind.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.detalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">{detalle.producto?.nombre || 'N/A'}</TableCell>
                  <TableCell>{detalle.cantidad}</TableCell>
                  <TableCell>${Number(detalle.precio_unitario).toLocaleString('es-AR')}</TableCell>
                  <TableCell>{Number(detalle.descuento_individual)}%</TableCell>
                  <TableCell className="text-right font-medium">${Number(detalle.subtotal).toLocaleString('es-AR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal (sin descuentos):</span>
            <span>${totalSinDescuento.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
          </div>
          {/* --- INICIO DEL CAMBIO --- */}
          <div className="flex justify-between">
            <span>Descuento general aplicado:</span>
            <span>{Number(venta.descuento_general)}%</span>
          </div>
          {/* --- FIN DEL CAMBIO --- */}
          <div className="flex justify-between text-red-600">
            <span>Descuentos totales (Gral. + Ind.):</span>
            <span>-${totalDescuentos.toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>TOTAL FINAL:</span>
            <span>${Number(venta.importe_total).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}