"use client"

import { DetalleVentaForm } from "../types" // Cambiamos el tipo a DetalleVentaForm
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DetalleVentaTableProps {
  // Aseguramos que el tipo coincida con el estado del formulario
  detalles: DetalleVentaForm[] 
  onDetalleChange: (index: number, field: keyof DetalleVentaForm, value: any) => void
  onRemoveDetalle: (index: number) => void
}

export function DetalleVentaTable({ detalles, onDetalleChange, onRemoveDetalle }: DetalleVentaTableProps) {
  
  // No necesitamos una función `handleChange` local, podemos llamar a `onDetalleChange` directamente.

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Producto</TableHead>
            <TableHead>Precio</TableHead>
            {/* --- INICIO DEL CAMBIO --- */}
            <TableHead>Desc. Ind. %</TableHead> 
            {/* --- FIN DEL CAMBIO --- */}
            <TableHead>Cantidad</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.map((detalle, index) => (
            // Usamos el id del producto como key si existe, para mejor rendimiento de React
            <TableRow key={detalle.id_producto ? `producto-${detalle.id_producto}` : `nuevo-${index}`}>
              <TableCell className="font-medium">
                {detalle.nombre_producto || 'Busca y selecciona un producto'}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={detalle.precio_unitario}
                  // Usamos keyof para asegurar que el nombre del campo es válido
                  onChange={(e) => onDetalleChange(index, "precio_unitario", Number(e.target.value) || 0)}
                  disabled={detalle.esNuevo}
                />
              </TableCell>
              {/* --- INICIO DEL CAMBIO --- */}
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
              {/* --- FIN DEL CAMBIO --- */}
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
                  // No se puede remover la fila de "nuevo producto" si es la única que queda
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