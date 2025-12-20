"use client"

import { Venta } from "../types" // Asegúrate de que importe desde tus tipos nuevos
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface VentaDetalleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: Venta | null
}

export function VentaDetalleDialog({
  open,
  onOpenChange,
  venta,
}: VentaDetalleDialogProps) {
  if (!venta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de Venta #{venta.id}</DialogTitle>
          <DialogDescription>
            Realizada el {venta.fecha} a las {venta.hora}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div>
            <span className="font-semibold">Tipo:</span>{" "}
            {venta.tipo_venta?.descripcion || "Venta General"}
          </div>
          <div>
            <span className="font-semibold">Caja ID:</span> {venta.id_caja}
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.venta_detalle?.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">
                    {detalle.producto?.nombre || "Producto eliminado"}
                  </TableCell>
                  <TableCell>
                    {detalle.producto?.codigo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {detalle.cantidad}
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(detalle.subtotal).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {(!venta.venta_detalle || venta.venta_detalle.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No hay detalles disponibles para esta venta.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pt-4">
          <div className="text-2xl font-bold">
            Total: ${Number(venta.total).toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}