"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Venta, NuevaVentaState, DetalleVentaForm, Producto } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"
import { ArrowLeft } from "lucide-react"

interface VentaFormProps {
  venta?: any
  onSubmit: (ventaData: NuevaVentaState) => void
  onSearchProductos: (term: string) => Promise<Producto[]>
  onCancel: () => void
}

const initialFormState: NuevaVentaState = {
  id_tipo_venta: 1,
  detalles: [],
  total: 0
};

export function VentaForm({ venta, onSubmit, onSearchProductos, onCancel }: VentaFormProps) {
  const detailIdCounter = useRef(1);
  const [nuevaVenta, setNuevaVenta] = useState<NuevaVentaState>(initialFormState);

  // Efecto para cargar datos en caso de edición
  useEffect(() => {
    if (venta) {
      setNuevaVenta({
        id_tipo_venta: venta.id_tipo_venta || 1,
        total: venta.total,
        detalles: [] // Si necesitas editar histórico, aquí deberías mapear
      });
    }
  }, [venta]);

  // Agregar producto desde el buscador
  const handleSelectProducto = (producto: Producto) => {
    setNuevaVenta(prev => {
      // Precio que usaremos (precio_final si existe, sino precio_lista)
      const precioVenta = Number(producto.precio_final || producto.precio_lista);
      
      const nuevoDetalle: DetalleVentaForm = {
        lineItemId: detailIdCounter.current++,
        id_producto: producto.id,
        nombre_producto: producto.nombre,
        codigo: producto.codigo,
        precio_unitario: precioVenta,
        cantidad: 1,
        descuento_individual: 0,
        subtotal: precioVenta, // 1 * precio - 0% desc
      };

      return { ...prev, detalles: [nuevoDetalle, ...prev.detalles] }; // Agregamos al principio para verlo fácil
    });
  };

  // Agregar item manual (sin ID)
  const handleCreateNonExistentProduct = (productName: string) => {
      setNuevaVenta(prev => {
          const nuevoDetalle: DetalleVentaForm = {
              lineItemId: detailIdCounter.current++,
              id_producto: null,
              nombre_producto: productName,
              precio_unitario: 0,
              cantidad: 1,
              descuento_individual: 0,
              subtotal: 0,
          };
          return { ...prev, detalles: [nuevoDetalle, ...prev.detalles] };
      });
  };

  // --- LÓGICA MATEMÁTICA BIDIRECCIONAL ---
  const handleDetalleChange = (lineItemId: number, field: keyof DetalleVentaForm, value: number) => {
    // Validar NaN
    if (isNaN(value)) value = 0;

    setNuevaVenta(prev => {
      const detallesActualizados = prev.detalles.map(d => {
        if (d.lineItemId !== lineItemId) return d;

        // Copia del detalle para modificar
        const updated = { ...d, [field]: value };

        // 1. Si cambia CANTIDAD o PRECIO -> Recalcula SUBTOTAL manteniendo el DESCUENTO
        if (field === 'cantidad' || field === 'precio_unitario') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (updated.descuento_individual / 100));
        }

        // 2. Si cambia DESCUENTO -> Recalcula SUBTOTAL
        if (field === 'descuento_individual') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (value / 100));
        }

        // 3. Si cambia SUBTOTAL -> Recalcula DESCUENTO (Inversa)
        if (field === 'subtotal') {
           const base = updated.precio_unitario * updated.cantidad;
           if (base > 0) {
             // Fórmula: Descuento = (1 - (Subtotal / Base)) * 100
             const nuevoDescuento = (1 - (value / base)) * 100;
             updated.descuento_individual = Number(nuevoDescuento.toFixed(2));
           } else {
             updated.descuento_individual = 0;
           }
        }

        return updated;
      });

      return { ...prev, detalles: detallesActualizados };
    });
  };

  const handleRemoveDetalle = (lineItemId: number) => {
    setNuevaVenta(prev => ({
      ...prev,
      detalles: prev.detalles.filter(d => d.lineItemId !== lineItemId)
    }));
  };

  const totalVenta = useMemo(() => {
    return nuevaVenta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }, [nuevaVenta.detalles]);

  const handleFinalSubmit = () => {
    if (nuevaVenta.detalles.length === 0) {
        // Podrías usar un toast aquí
        alert("La venta debe tener al menos un producto.");
        return;
    }
    onSubmit({
      ...nuevaVenta,
      total: totalVenta,
      detalles: nuevaVenta.detalles
    });
  }

  return (
    <Card className="w-full border-none shadow-none sm:border sm:shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              {venta ? "Ver Venta" : "Nueva Venta"}
            </CardTitle>
          </div>
          <div className="w-full sm:w-[200px]">
            <Select
              value={String(nuevaVenta.id_tipo_venta)}
              onValueChange={(value) => setNuevaVenta(prev => ({ ...prev, id_tipo_venta: Number(value) }))}
            >
              <SelectTrigger className="font-medium"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Orden de Compra</SelectItem>
                <SelectItem value="2">Factura B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6 space-y-6">
        {/* BUSCADOR */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">Agregar Productos</Label>
          <ProductSearch 
            onSelect={handleSelectProducto} 
            onSearch={onSearchProductos} 
            onCommitNotFound={handleCreateNonExistentProduct}
          />
        </div>

        {/* GRILLA */}
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">Detalle de la venta</Label>
          <DetalleVentaTable
            detalles={nuevaVenta.detalles}
            onDetalleChange={handleDetalleChange}
            onRemoveDetalle={handleRemoveDetalle}
          />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t bg-muted/10 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
             <span className="text-sm">Items: {nuevaVenta.detalles.length}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
            <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Total a Pagar</p>
                <p className="text-4xl font-bold text-primary">${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="lg" onClick={onCancel} className="flex-1 sm:flex-none">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button onClick={handleFinalSubmit} size="lg" className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold px-8">
                CONFIRMAR VENTA
                </Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}