"use client"

import { DetalleVenta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DetalleVentaTableProps {
  detalles: DetalleVenta[]
  onDetalleChange: (index: number, field: string, value: any) => void
  onRemoveDetalle: (index: number) => void
}

export function DetalleVentaTable({ detalles, onDetalleChange, onRemoveDetalle }: DetalleVentaTableProps) {
  const handleChange = (index: number, field: string, value: string) => {
    onDetalleChange(index, field, field === "cantidad" ? parseInt(value) || 0 : parseFloat(value) || 0)
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Descuento %</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.map((detalle, index) => (
            <TableRow key={index}>
              <TableCell>
                {detalle.esNuevo ? (
                  <Input
                    placeholder="Nombre del producto"
                    value={detalle.nombre_producto || ""}
                    onChange={(e) => onDetalleChange(index, "nombre_producto", e.target.value)}
                  />
                ) : (
                  detalle.nombre_producto
                )}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={detalle.precio_unitario}
                  onChange={(e) => handleChange(index, "precio_unitario", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={detalle.descuento}
                  onChange={(e) => handleChange(index, "descuento", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={detalle.cantidad}
                  onChange={(e) => handleChange(index, "cantidad", e.target.value)}
                />
              </TableCell>
              <TableCell className="font-medium">${detalle.subtotal.toLocaleString()}</TableCell>
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