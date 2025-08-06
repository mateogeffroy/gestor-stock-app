"use client"

import { DetalleVentaForm } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DetalleVentaTableProps {
  detalles: DetalleVentaForm[] 
  onDetalleChange: (index: number, field: keyof DetalleVentaForm, value: any) => void
  onRemoveDetalle: (index: number) => void
}

export function DetalleVentaTable({ detalles, onDetalleChange, onRemoveDetalle }: DetalleVentaTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Producto</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Desc. Ind. %</TableHead> 
            <TableHead>Cantidad</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.map((detalle, index) => (
            // --- INICIO DEL CAMBIO ---
            // Usamos el 'lineItemId' único como la key de la fila
            <TableRow key={detalle.lineItemId}>
            {/* --- FIN DEL CAMBIO --- */}
              <TableCell className="font-medium">
                {detalle.nombre_producto || 'Busca y selecciona un producto'}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={detalle.precio_unitario}
                  onChange={(e) => onDetalleChange(index, "precio_unitario", Number(e.target.value) || 0)}
                  disabled={detalle.esNuevo}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={detalle.descuento_individual}
                  onChange={(e) => onDetalleChange(index, "descuento_individual", Number(e.target.value) || 0)}
                  disabled={detalle.esNuevo}
                  placeholder="0"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={detalle.cantidad}
                  onChange={(e) => onDetalleChange(index, "cantidad", Number(e.target.value) || 1)}
                  disabled={detalle.esNuevo}
                />
              </TableCell>
              <TableCell className="font-medium">${detalle.subtotal.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveDetalle(index)}
                  disabled={detalle.esNuevo && detalles.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}