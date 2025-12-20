"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Venta, NuevaVentaState, DetalleVentaForm, Producto } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"
import { ArrowLeft, PackagePlus } from "lucide-react"

interface VentaFormProps {
  venta?: any // Usamos any temporalmente para edición si la estructura difiere mucho
  onSubmit: (ventaData: NuevaVentaState) => void
  onSearchProductos: (term: string) => Promise<Producto[]>
  onCancel: () => void
}

const initialFormState: NuevaVentaState = {
  id_tipo_venta: 1, // 1 = Venta General (Default)
  detalles: [],
  total: 0
};

export function VentaForm({ venta, onSubmit, onSearchProductos, onCancel }: VentaFormProps) {
  const detailIdCounter = useRef(1);
  const [nuevaVenta, setNuevaVenta] = useState<NuevaVentaState>(initialFormState);

  // Carga de datos para edición (Si aplica)
  useEffect(() => {
    if (venta) {
      // Nota: Editar ventas históricas es complejo. Por ahora lo dejamos básico.
      setNuevaVenta({
        id_tipo_venta: venta.id_tipo_venta || 1,
        total: venta.total,
        detalles: [] // Cargar detalles de edición requiere mapear desde BD
      });
    }
  }, [venta]);

  const handleSelectProducto = (producto: Producto) => {
    setNuevaVenta(prev => {
      const nuevosDetalles = [...prev.detalles];
      // Usamos precio_lista como el precio de venta unitario
      const precioVenta = Number(producto.precio_lista);

      nuevosDetalles.push({
        lineItemId: detailIdCounter.current++,
        id_producto: producto.id,
        nombre_producto: producto.nombre,
        precio_unitario: precioVenta,
        cantidad: 1,
        descuento_individual: 0,
        subtotal: precioVenta,
      });
      return { ...prev, detalles: nuevosDetalles };
    });
  };
  
  const handleCreateNonExistentProduct = (productName: string) => {
      setNuevaVenta(prev => {
          const nuevosDetalles = [...prev.detalles];
          nuevosDetalles.push({
              lineItemId: detailIdCounter.current++,
              id_producto: null,
              nombre_producto: productName,
              precio_unitario: 0,
              cantidad: 1,
              descuento_individual: 0,
              subtotal: 0,
          });
          return { ...prev, detalles: nuevosDetalles };
      });
  };

  const handleDetalleChange = (lineItemId: number, field: keyof DetalleVentaForm, value: any) => {
    setNuevaVenta(prev => {
      const detallesActualizados = prev.detalles.map(detalle => {
        if (detalle.lineItemId === lineItemId) {
          const detalleModificado = { ...detalle, [field]: value };
          
          // Recalcular subtotal: (Precio * Cantidad) * (1 - Descuento/100)
          const precio = Number(detalleModificado.precio_unitario);
          const cantidad = Number(detalleModificado.cantidad);
          const desc = Number(detalleModificado.descuento_individual);
          
          const subtotalSinDescuento = precio * cantidad;
          detalleModificado.subtotal = subtotalSinDescuento * (1 - (desc / 100));
          
          return detalleModificado;
        }
        return detalle;
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

  // Cálculo automático del total general
  const totalVenta = useMemo(() => {
    return nuevaVenta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0);
  }, [nuevaVenta.detalles]);

  const handleFinalSubmit = () => {
    // Validamos que haya detalles
    if (nuevaVenta.detalles.length === 0) {
        alert("Debes agregar al menos un producto.");
        return;
    }

    onSubmit({
      ...nuevaVenta,
      total: totalVenta,
      detalles: nuevaVenta.detalles
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {venta ? "Ver Venta" : "Nueva Venta"}
            </CardTitle>
            <CardDescription>
              Agrega productos al carrito. La caja se asignará automáticamente.
            </CardDescription>
          </div>
          <div className="space-y-2 w-full sm:w-1/3">
            <Label htmlFor="tipo">Tipo de Comprobante</Label>
            <Select
              value={String(nuevaVenta.id_tipo_venta)}
              onValueChange={(value) => setNuevaVenta(prev => ({ ...prev, id_tipo_venta: Number(value) }))}
            >
              <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
              <SelectContent>
                {/* Estos IDs deben coincidir con tu tabla tipo_venta */}
                <SelectItem value="1">Venta General</SelectItem>
                <SelectItem value="2">Factura B</SelectItem>
                <SelectItem value="3">Orden de Compra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Buscar Productos</Label>
          <ProductSearch 
            onSelect={handleSelectProducto} 
            onSearch={onSearchProductos} 
            onCommitNotFound={handleCreateNonExistentProduct}
          />
        </div>

        <div className="space-y-2">
          <Label>Detalle</Label>
          {nuevaVenta.detalles.length > 0 ? (
            <DetalleVentaTable
              detalles={nuevaVenta.detalles}
              onDetalleChange={handleDetalleChange}
              onRemoveDetalle={handleRemoveDetalle}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg p-8 bg-muted/20">
              <PackagePlus className="h-10 w-10 mb-2 opacity-50" />
              <p className="font-medium">Carrito vacío</p>
              <p className="text-sm">Busca un producto para comenzar.</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-6 border-t bg-muted/10">
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
          <div className="text-3xl font-bold text-primary">
            Total: ${totalVenta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <Button onClick={handleFinalSubmit} className="flex-1 sm:flex-none" size="lg">
              Confirmar Venta
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}