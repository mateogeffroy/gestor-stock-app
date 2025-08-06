"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { VentaDetalleDialog } from "./components/VentaDetalleDialog" 
import { fetchVentas, searchProductos, createVenta, deleteVenta, updateVenta } from "./actions"
import { Venta, NuevaVentaState } from "./types"
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<Venta | undefined>(undefined)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)

  const loadVentas = async () => {
    setIsLoading(true)
    try {
      const data = await fetchVentas()
      setVentas(data.results || [])
    } catch (error) {
      console.error("Error al cargar ventas:", error)
      toast({ title: "Error", description: "No se pudieron cargar las ventas", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVentas()
  }, [])

  const handleOpenEditDialog = (venta?: Venta) => {
    setEditingVenta(venta)
    setIsFormOpen(true)
  }

  const handleOpenViewDialog = (venta: Venta) => {
    setSelectedVenta(venta)
    setIsDetailViewOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
      try {
        await deleteVenta(id)
        toast({ title: "Éxito", description: "Venta eliminada correctamente" })
        loadVentas()
      } catch (error) {
        console.error("Error al eliminar venta:", error)
        toast({ title: "Error", description: "No se pudo eliminar la venta", variant: "destructive" })
      }
    }
  }

  const handleSubmit = async (ventaData: NuevaVentaState) => {
    try {
      const payload = {
        tipo: ventaData.tipo,
        descuento_general: ventaData.descuento_general,
        detalles: ventaData.detalles.map(d => ({
          id_producto: d.id_producto!,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento_individual: d.descuento_individual,
          // --- INICIO DEL CAMBIO ---
          // Añadimos el subtotal que ya calculamos en el formulario.
          subtotal: d.subtotal, 
          // --- FIN DEL CAMBIO ---
        })),
      };
      
      if (editingVenta) {
        // Si estamos editando, llamamos a updateVenta
        const response = await updateVenta(editingVenta.id, payload);
        toast({ title: "Éxito", description: "Venta actualizada correctamente" });

        // (La lógica de warnings también podría aplicarse aquí si el update la devuelve)
        if (response.warnings?.length) {
          toast({ title: "Advertencia de Stock", description: response.warnings.join("\n"), variant: "destructive", duration: 10000 });
        }
      } else {
        // Si no, llamamos a createVenta
        const response = await createVenta(payload);
        toast({ title: "Éxito", description: "Venta registrada correctamente" });
        if (response.warnings?.length) {
          toast({ title: "Advertencia de Stock", description: response.warnings.join("\n"), variant: "destructive", duration: 10000 });
        }
      }
      // --- FIN DEL CAMBIO ---

      setIsFormOpen(false);
      loadVentas();
    } catch (error: any) {
      console.error("Error al guardar venta:", error);
      toast({ title: "Error al guardar", description: error.message || "No se pudo registrar la venta", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas de La Cuerda Bebidas</p>
        </div>
        <Button onClick={() => handleOpenEditDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas Ventas</CardTitle></CardHeader>
        <CardContent>
          <VentasTable 
            ventas={ventas} 
            onView={handleOpenViewDialog}
            onEdit={handleOpenEditDialog} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      <VentaForm
        open={isFormOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingVenta(undefined);
          setIsFormOpen(isOpen);
        }}
        venta={editingVenta}
        onSubmit={handleSubmit}
        onSearchProductos={searchProductos}
      />

      <VentaDetalleDialog
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        venta={selectedVenta}
      />
    </div>
  )
}