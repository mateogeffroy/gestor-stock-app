"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Venta, NuevaVentaState, DetalleVentaForm, Producto } from "../types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductSearch } from "./ProductSearch"
import { DetalleVentaTable } from "./DetalleVentaTable"
import { ArrowLeft, User, Loader2 } from "lucide-react" // Añadido Loader2
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VentaFormProps {
  venta?: any
  onSubmit: (ventaData: any) => Promise<void> | void // Ajustado para soportar promesas
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
  
  // --- ESTADO PARA CONTROLAR EL DOBLE SUBMIT ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ESTADOS DE CLIENTE ---
  const [tipoCliente, setTipoCliente] = useState<"final" | "responsable">("final")
  const [clienteNombre, setClienteNombre] = useState("")
  const [clienteCuit, setClienteCuit] = useState("")
  const [clienteDireccion, setClienteDireccion] = useState("")

  useEffect(() => {
    if (venta) {
      setNuevaVenta({
        id_tipo_venta: venta.id_tipo_venta || 1,
        total: venta.total,
        detalles: [] 
      });
    }
  }, [venta]);

  const handleSelectProducto = (producto: Producto) => {
    setNuevaVenta(prev => {
      const precioVenta = Number(producto.precio_final || producto.precio_lista);
      
      const nuevoDetalle: DetalleVentaForm = {
        lineItemId: detailIdCounter.current++,
        id_producto: producto.id,
        nombre_producto: producto.nombre,
        codigo: producto.codigo,
        precio_unitario: precioVenta,
        cantidad: 1,
        descuento_individual: 0,
        subtotal: precioVenta, 
      };

      return { ...prev, detalles: [nuevoDetalle, ...prev.detalles] }; 
    });
  };

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

  const handleDetalleChange = (lineItemId: number, field: keyof DetalleVentaForm, value: number) => {
    if (isNaN(value)) value = 0;

    setNuevaVenta(prev => {
      const detallesActualizados = prev.detalles.map(d => {
        if (d.lineItemId !== lineItemId) return d;

        const updated = { ...d, [field]: value };

        if (field === 'cantidad' || field === 'precio_unitario') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (updated.descuento_individual / 100));
        }

        if (field === 'descuento_individual') {
           const base = updated.precio_unitario * updated.cantidad;
           updated.subtotal = base * (1 - (value / 100));
        }

        if (field === 'subtotal') {
           const base = updated.precio_unitario * updated.cantidad;
           if (base > 0) {
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

  const handleFinalSubmit = async () => {
    if (nuevaVenta.detalles.length === 0) {
        alert("La venta debe tener al menos un producto.");
        return;
    }

    if (tipoCliente === 'responsable' && clienteCuit.length < 11) {
        alert("El CUIT debe tener 11 dígitos.");
        return;
    }

    // Bloqueo de seguridad
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      await onSubmit({
        ...nuevaVenta,
        total: totalVenta,
        detalles: nuevaVenta.detalles,
        cliente_nombre: tipoCliente === 'final' ? "Consumidor Final" : clienteNombre,
        cliente_cuit: tipoCliente === 'final' ? null : clienteCuit,
        cliente_direccion: tipoCliente === 'final' ? null : clienteDireccion,
      });

      // Nota: Si el onSubmit redirige fuera de la página, el estado se limpiará solo.
      // Si te quedas en la misma página, quizás quieras poner setIsSubmitting(false) 
      // y limpiar el formulario aquí.

    } catch (error) {
      console.error("Error al confirmar venta:", error);
      alert("Hubo un error al procesar la venta.");
      setIsSubmitting(false); // Rehabilitamos el botón solo en caso de error
    }
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
              disabled={isSubmitting}
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
        {/* --- DATOS DEL CLIENTE --- */}
        <div className="bg-slate-50 border rounded-lg p-4">
             <Label className="flex items-center gap-2 mb-3 font-semibold text-slate-700">
                <User className="h-4 w-4" /> Datos del Cliente
             </Label>
             
             <Tabs value={tipoCliente} onValueChange={(v) => setTipoCliente(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-3">
                    <TabsTrigger value="final" disabled={isSubmitting}>Consumidor Final</TabsTrigger>
                    <TabsTrigger value="responsable" disabled={isSubmitting}>Cliente con CUIT</TabsTrigger>
                </TabsList>
                
                <TabsContent value="final">
                    <p className="text-sm text-muted-foreground italic">
                        Venta anónima a consumidor final. No requiere datos adicionales.
                    </p>
                </TabsContent>
                
                <TabsContent value="responsable" className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">CUIT (Sin guiones)</Label>
                            <Input 
                                disabled={isSubmitting}
                                placeholder="20123456789" 
                                value={clienteCuit}
                                onChange={e => setClienteCuit(e.target.value)}
                                maxLength={11}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Nombre / Razón Social</Label>
                            <Input 
                                disabled={isSubmitting}
                                placeholder="Ej: Empresa S.A." 
                                value={clienteNombre}
                                onChange={e => setClienteNombre(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                            <Label className="text-xs">Dirección (Opcional)</Label>
                            <Input 
                                disabled={isSubmitting}
                                placeholder="Calle Falsa 123" 
                                value={clienteDireccion}
                                onChange={e => setClienteDireccion(e.target.value)}
                                className="bg-white"
                            />
                    </div>
                </TabsContent>
             </Tabs>
        </div>

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
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onCancel} 
                  disabled={isSubmitting} 
                  className="flex-1 sm:flex-none"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {isSubmitting ? "Espere..." : "Cancelar"}
                </Button>

                <Button 
                  onClick={handleFinalSubmit} 
                  size="lg" 
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESANDO...
                    </>
                  ) : (
                    "CONFIRMAR VENTA"
                  )}
                </Button>
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}