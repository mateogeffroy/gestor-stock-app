"use client"

import { DetalleVentaForm } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DetalleVentaTableProps {
  detalles: DetalleVentaForm[]
  onDetalleChange: (lineItemId: number, field: keyof DetalleVentaForm, value: number) => void
  onRemoveDetalle: (lineItemId: number) => void
}

export function DetalleVentaTable({ detalles, onDetalleChange, onRemoveDetalle }: DetalleVentaTableProps) {
  
  // Función auxiliar para seleccionar todo el texto al hacer click en un input (UX)
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div className="border rounded-md overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[30%]">Producto</TableHead>
            <TableHead className="w-[15%]">Precio Unit.</TableHead>
            <TableHead className="w-[10%]">Cant.</TableHead>
            <TableHead className="w-[15%] text-center">Desc. (%)</TableHead>
            <TableHead className="w-[20%] text-right">Subtotal ($)</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.map((detalle) => (
            <TableRow key={detalle.lineItemId}>
              <TableCell className="align-middle">
                <div className="flex flex-col">
                    <span className="font-medium">{detalle.nombre_producto}</span>
                    {detalle.codigo && <span className="text-xs text-muted-foreground">{detalle.codigo}</span>}
                </div>
              </TableCell>

              {/* COLUMNA: PRECIO UNITARIO */}
              <TableCell>
                <div className="relative">
                    <span className="absolute left-2 top-2 text-muted-foreground text-xs">$</span>
                    <Input
                        type="number"
                        className="pl-5 h-8 text-sm"
                        value={detalle.precio_unitario}
                        onFocus={handleFocus}
                        onChange={(e) => onDetalleChange(detalle.lineItemId, "precio_unitario", parseFloat(e.target.value))}
                    />
                </div>
              </TableCell>

              {/* COLUMNA: CANTIDAD */}
              <TableCell>
                <Input
                  type="number"
                  min="0.1"
                  step="1"
                  className="h-8 text-center"
                  value={detalle.cantidad}
                  onFocus={handleFocus}
                  onChange={(e) => onDetalleChange(detalle.lineItemId, "cantidad", parseFloat(e.target.value))}
                />
              </TableCell>

              {/* COLUMNA: DESCUENTO (%) */}
              <TableCell>
                 <div className="relative">
                    <Input
                        type="number"
                        min="0"
                        max="100"
                        className="h-8 text-center pr-6"
                        value={detalle.descuento_individual}
                        onFocus={handleFocus}
                        onChange={(e) => onDetalleChange(detalle.lineItemId, "descuento_individual", parseFloat(e.target.value))}
                    />
                    <span className="absolute right-2 top-2 text-muted-foreground text-xs">%</span>
                 </div>
              </TableCell>

              {/* COLUMNA: SUBTOTAL (Editable con lógica inversa) */}
              <TableCell>
                <div className="relative">
                    <span className="absolute left-2 top-2 text-green-700 font-bold text-xs">$</span>
                    <Input
                        type="number"
                        className="pl-5 h-8 font-bold text-green-700 text-right"
                        value={Number(detalle.subtotal.toFixed(2))}
                        onFocus={handleFocus}
                        onChange={(e) => onDetalleChange(detalle.lineItemId, "subtotal", parseFloat(e.target.value))}
                    />
                </div>
              </TableCell>

              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onRemoveDetalle(detalle.lineItemId)}
                  tabIndex={-1} // Evitar tabulación accidental al borrar
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {detalles.length === 0 && (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Escanea un producto para comenzar...
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}