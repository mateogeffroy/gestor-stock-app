"use client"

import { useState, useEffect } from "react"
import { Venta } from "../types"
import { ventaService } from "@/services/venta-service"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface VentaDetalleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: Venta | null
  onVentaUpdated?: () => void
}

export function VentaDetalleDialog({
  open,
  onOpenChange,
  venta,
  onVentaUpdated
}: VentaDetalleDialogProps) {
  const { toast } = useToast()
  const [isEditingType, setIsEditingType] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string>("1")
  const [isSaving, setIsSaving] = useState(false)

  // Reiniciar estado al abrir/cambiar venta
  useEffect(() => {
    if (venta) {
      setSelectedTipo(String(venta.id_tipo_venta || "1"))
      setIsEditingType(false)
    }
  }, [venta, open])

  if (!venta) return null

  const handleSaveTipo = async () => {
    setIsSaving(true)
    try {
      await ventaService.updateTipoVenta(venta.id, Number(selectedTipo))
      toast({ title: "Actualizado", description: "Tipo de venta modificado correctamente." })
      setIsEditingType(false)
      if (onVentaUpdated) onVentaUpdated() // Recargar lista
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo actualizar el tipo.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // Texto a mostrar cuando NO se está editando
  // Si venta.tipo_venta viene null, asumimos que es el default (Orden de Compra)
  const tipoDescripcion = venta.tipo_venta?.descripcion || "Orden de Compra";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de Venta #{venta.id}</DialogTitle>
          <DialogDescription>
            Realizada el {venta.fecha} a las {venta.hora}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 text-sm bg-muted/20 p-4 rounded-lg">
          {/* SECCIÓN EDITABLE: TIPO DE VENTA */}
          <div className="flex items-center gap-2 h-10">
            <span className="font-semibold">Tipo:</span>
            
            {isEditingType ? (
              <div className="flex items-center gap-2">
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* CAMBIO AQUÍ: Opciones actualizadas */}
                    <SelectItem value="1">Orden de Compra</SelectItem>
                    <SelectItem value="2">Factura B</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" className="h-8 w-8" onClick={handleSaveTipo} disabled={isSaving}>
                   {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingType(false)}>
                   <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{tipoDescripcion}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setIsEditingType(true)}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center h-10">
            <span className="font-semibold mr-2">Caja ID:</span> {venta.id_caja}
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="border rounded-md mt-2 max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio U.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.venta_detalle?.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">
                    {/* Intentamos mostrar la descripción guardada, sino el nombre del producto relacional */}
                    {(detalle as any).descripcion || detalle.producto?.nombre || "Producto eliminado"}
                  </TableCell>
                  <TableCell>
                    {detalle.producto?.codigo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {detalle.cantidad}
                  </TableCell>
                  {/* Agregamos visualización de precio unitario si existe en el detalle */}
                  <TableCell className="text-right text-muted-foreground">
                    ${Number((detalle as any).precio_unitario || detalle.producto?.precio_lista || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${Number(detalle.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end pt-4">
          <div className="text-2xl font-bold">
            Total: ${Number(venta.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}