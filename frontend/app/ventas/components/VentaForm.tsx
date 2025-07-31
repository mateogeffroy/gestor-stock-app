"use client"

import { useState, useEffect, useMemo } from "react"
import { Venta, NuevaVentaState, DetalleVentaForm } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"
import { Producto } from "../types" // Importamos el tipo Producto

interface VentaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta?: Venta
  onSubmit: (ventaData: NuevaVentaState) => void
  onSearchProductos: (term: string) => Promise<Producto[]>
}

// Estado inicial para un nuevo detalle en el formulario
const initialDetalleState: DetalleVentaForm = {
  id_producto: null,
  nombre_producto: '',
  precio_unitario: 0,
  cantidad: 1,
  descuento_individual: 0,
  subtotal: 0,
  esNuevo: true,
}

export function VentaForm({ open, onOpenChange, venta, onSubmit, onSearchProductos }: VentaFormProps) {
  
  const [nuevaVenta, setNuevaVenta] = useState<NuevaVentaState>({
    tipo: "orden_compra",
    descuento_general: 0,
    detalles: [initialDetalleState], // Empezamos con una fila vacía para buscar
  });

  // Efecto para resetear el formulario cuando se abre o se selecciona una venta para editar
  useEffect(() => {
    if (open) {
      if (venta) {
        // Lógica para cargar una venta existente para edición (a implementar)
        // Por ahora, reseteamos al estado inicial
        setNuevaVenta({
          tipo: venta.tipo,
          descuento_general: Number(venta.descuento_general),
          // Mapeamos los detalles de la venta al formato del formulario
          detalles: venta.detalles.map(d => ({
            id_producto: d.producto.id,
            nombre_producto: d.producto.nombre,
            precio_unitario: Number(d.precio_unitario),
            cantidad: d.cantidad,
            descuento_individual: Number(d.descuento_individual),
            subtotal: Number(d.subtotal)
          }))
        });
      } else {
        // Reseteamos a un estado limpio para una nueva venta
        setNuevaVenta({
          tipo: "orden_compra",
          descuento_general: 0,
          detalles: [initialDetalleState],
        });
      }
    }
  }, [open, venta]);

  // --- LÓGICA DE MANEJO DE ESTADO ---

  const handleSelectProducto = (producto: Producto) => {
    // Reemplaza la fila "nueva" con el producto seleccionado
    // y añade otra fila "nueva" al final para la siguiente búsqueda.
    setNuevaVenta(prev => {
      const nuevosDetalles = prev.detalles.filter(d => !d.esNuevo); // Quitamos la fila vacía
      nuevosDetalles.push({
        id_producto: producto.id,
        nombre_producto: producto.nombre,
        precio_unitario: Number(producto.precio_final || producto.precio_lista),
        cantidad: 1,
        descuento_individual: 0,
        subtotal: Number(producto.precio_final || producto.precio_lista),
      });
      nuevosDetalles.push(initialDetalleState); // Agregamos una nueva fila vacía
      return { ...prev, detalles: nuevosDetalles };
    });
  };

  const handleDetalleChange = (index: number, field: keyof DetalleVentaForm, value: any) => {
    setNuevaVenta(prev => {
      const detallesActualizados = [...prev.detalles];
      const detalleModificado = { ...detallesActualizados[index], [field]: value };

      // Recalcular el subtotal de la línea cada vez que algo cambia
      const { precio_unitario, cantidad, descuento_individual } = detalleModificado;
      const subtotalSinDescuento = precio_unitario * cantidad;
      detalleModificado.subtotal = subtotalSinDescuento * (1 - (descuento_individual / 100));
      
      detallesActualizados[index] = detalleModificado;
      return { ...prev, detalles: detallesActualizados };
    });
  };

  const handleRemoveDetalle = (index: number) => {
    setNuevaVenta(prev => {
      const detallesFiltrados = prev.detalles.filter((_, i) => i !== index);
      // Si hemos borrado todas las filas de productos, nos aseguramos de que quede una vacía
      if (detallesFiltrados.every(d => !d.esNuevo)) {
        detallesFiltrados.push(initialDetalleState);
      }
      return { ...prev, detalles: detallesFiltrados };
    });
  };

  // --- CÁLCULO DE TOTALES ---
  const totalVenta = useMemo(() => {
    // Primero, sumamos todos los subtotales de las líneas de detalle (que ya tienen el descuento individual)
    const subtotalBruto = nuevaVenta.detalles
        .filter(d => !d.esNuevo) // Ignoramos la fila vacía para el cálculo
        .reduce((sum, detalle) => sum + detalle.subtotal, 0);
    
    // Luego, aplicamos el descuento general
    return subtotalBruto * (1 - (nuevaVenta.descuento_general / 100));
  }, [nuevaVenta.detalles, nuevaVenta.descuento_general]);


  // --- FUNCIÓN DE ENVÍO ---
  const handleFinalSubmit = () => {
    // Filtramos los detalles para no enviar la fila vacía
    const ventaParaEnviar = {
      ...nuevaVenta,
      detalles: nuevaVenta.detalles.filter(d => !d.esNuevo),
    };
    onSubmit(ventaParaEnviar);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{venta ? "Editar Venta" : "Nueva Venta"}</DialogTitle>
          <DialogDescription>
            Agrega productos y define los descuentos para registrar la venta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Venta</Label>
              <Select
                value={nuevaVenta.tipo}
                onValueChange={(value: 'orden_compra' | 'factura_b') => setNuevaVenta(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="orden_compra">Orden de compra</SelectItem>
                  <SelectItem value="factura_b">Factura electrónica B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descuento_general">Descuento General (%)</Label>
              <Input
                id="descuento_general"
                type="number"
                min="0" max="100"
                value={nuevaVenta.descuento_general}
                onChange={(e) => setNuevaVenta(prev => ({...prev, descuento_general: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <Label>Buscar y Agregar Productos</Label>
            <ProductSearch 
              onSelect={handleSelectProducto} 
              onSearch={onSearchProductos} 
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label>Detalle de Venta</Label>
            <DetalleVentaTable
              detalles={nuevaVenta.detalles}
              onDetalleChange={handleDetalleChange}
              onRemoveDetalle={handleRemoveDetalle}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="text-2xl font-bold">
              Total: ${totalVenta.toFixed(2)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleFinalSubmit}>
                {venta ? "Actualizar" : "Guardar"} Venta
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}