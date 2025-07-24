"use client"

import { useState } from "react"
import { Venta, NuevaVentaState } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"

interface VentaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta?: Venta
  onSubmit: (ventaData: NuevaVentaState) => void
  onSearchProductos: (term: string) => Promise<any[]>
}

export function VentaForm({ open, onOpenChange, venta, onSubmit, onSearchProductos }: VentaFormProps) {
  const [nuevaVenta, setNuevaVenta] = useState<NuevaVentaState>({
    tipo: venta?.tipo || "orden_compra",
    descuento_general: venta?.descuento_general || 0,
    detalles: venta?.detalles || [{
      id_producto: null,
      precio_unitario: 0,
      cantidad: 1,
      descuento: 0,
      subtotal: 0,
      esNuevo: true,
    }],
  })

  const handleSelectProducto = (producto: any) => {
    const newDetalle = {
      id_producto: producto.id,
      nombre_producto: producto.nombre,
      precio_unitario: producto.precio_final || producto.precio_lista,
      cantidad: 1,
      descuento: 0,
      subtotal: producto.precio_final || producto.precio_lista,
    }

    setNuevaVenta(prev => {
      const nuevosDetalles = [...prev.detalles]
      const emptyRowIndex = nuevosDetalles.findIndex(d => d.esNuevo)
      
      if (emptyRowIndex !== -1) {
        nuevosDetalles.splice(emptyRowIndex, 0, newDetalle)
      } else {
        nuevosDetalles.push(newDetalle)
      }

      return { ...prev, detalles: nuevosDetalles }
    })
  }

  const handleDetalleChange = (index: number, field: string, value: any) => {
    setNuevaVenta(prev => {
      const nuevosDetalles = [...prev.detalles]
      const detalle = { ...nuevosDetalles[index], [field]: value }

      // Recalcular subtotal si cambian precio, cantidad o descuento
      if (field === "precio_unitario" || field === "cantidad" || field === "descuento") {
        const precio = Number(detalle.precio_unitario)
        const cantidad = Number(detalle.cantidad)
        const descuento = Number(detalle.descuento) || 0
        const subtotalSinDescuento = precio * cantidad
        detalle.subtotal = subtotalSinDescuento - (subtotalSinDescuento * (descuento / 100))
      }

      nuevosDetalles[index] = detalle
      return { ...prev, detalles: nuevosDetalles }
    })
  }

  const handleRemoveDetalle = (index: number) => {
    setNuevaVenta(prev => {
      const nuevosDetalles = [...prev.detalles]
      nuevosDetalles.splice(index, 1)

      if (nuevosDetalles.length === 0 || !nuevosDetalles.some(d => d.esNuevo)) {
        nuevosDetalles.push({
          id_producto: null,
          precio_unitario: 0,
          cantidad: 1,
          descuento: 0,
          subtotal: 0,
          esNuevo: true,
        })
      }

      return { ...prev, detalles: nuevosDetalles }
    })
  }

  const calcularTotal = () => {
    const subtotal = nuevaVenta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0)
    return subtotal - (subtotal * (nuevaVenta.descuento_general / 100))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venta ? "Editar Venta" : "Nueva Venta"}</DialogTitle>
          <DialogDescription>
            {venta ? "Modifica los datos de la venta." : "Completa los datos para registrar una nueva venta."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Venta</Label>
              <Select
                value={nuevaVenta.tipo}
                onValueChange={(value) => setNuevaVenta(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orden_compra">Orden de compra</SelectItem>
                  <SelectItem value="factura_b">Factura electrónica B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buscar Producto</Label>
              <ProductSearch 
                onSelect={handleSelectProducto} 
                onSearch={onSearchProductos} 
              />
            </div>

            <div className="space-y-2">
              <Label>Detalle de Venta</Label>
              <DetalleVentaTable
                detalles={nuevaVenta.detalles}
                onDetalleChange={handleDetalleChange}
                onRemoveDetalle={handleRemoveDetalle}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descuento_general">Descuento General (%)</Label>
              <Input
                id="descuento_general"
                type="number"
                min="0"
                max="100"
                value={nuevaVenta.descuento_general}
                onChange={(e) => setNuevaVenta(prev => ({
                  ...prev,
                  descuento_general: Number(e.target.value) || 0
                }))}
              />
            </div>

            <div className="flex justify-end text-lg font-bold">
              Total: ${calcularTotal().toLocaleString()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(nuevaVenta)}>
            {venta ? "Actualizar" : "Guardar"} Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}