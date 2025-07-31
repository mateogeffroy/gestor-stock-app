// frontend/app/ventas/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { fetchVentas, searchProductos, createVenta, deleteVenta } from "./actions"
import { Venta, NuevaVentaState } from "./types"
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<Venta | undefined>(undefined)

  const loadVentas = async () => {
    setIsLoading(true)
    try {
      const data = await fetchVentas()
      setVentas(data.results || [])
    } catch (error) {
      console.error("Error al cargar ventas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVentas()
  }, [])

  const handleOpenDialog = (venta?: Venta) => {
    setEditingVenta(venta)
    setIsDialogOpen(true)
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

  // --- INICIO DEL CAMBIO ---
  const handleSubmit = async (ventaData: NuevaVentaState) => {
    try {
      // Preparamos los datos para enviar al backend
      const payload = {
        tipo: ventaData.tipo,
        descuento_general: ventaData.descuento_general,
        // Mapeamos los detalles al formato que el backend espera
        detalles: ventaData.detalles.map(d => ({
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento_individual: d.descuento_individual,
          // No necesitamos enviar el subtotal, el backend lo calcula
        })),
      };
      
      // Validamos que haya al menos un producto
      if (payload.detalles.length === 0) {
        toast({ title: "Error", description: "La venta debe tener al menos un producto.", variant: "destructive" });
        return;
      }
      
      // Lógica de edición (a futuro)
      if (editingVenta) {
        // ...
      } else {
        await createVenta(payload)
        toast({ title: "Éxito", description: "Venta registrada correctamente" })
      }

      setIsDialogOpen(false)
      loadVentas() // Recargamos para ver los cambios
    } catch (error: any) {
      console.error("Error al guardar venta:", error);
      // Intentamos mostrar un mensaje de error más específico si el backend lo envía
      const errorMsg = error.message || "No se pudo registrar la venta";
      toast({ title: "Error al guardar", description: errorMsg, variant: "destructive" })
    }
  }
  // --- FIN DEL CAMBIO ---

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas de La Cuerda Bebidas</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <VentasTable 
            ventas={ventas} 
            onEdit={handleOpenDialog} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      <VentaForm
        open={isDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingVenta(undefined);
          setIsDialogOpen(isOpen);
        }}
        venta={editingVenta}
        onSubmit={handleSubmit}
        onSearchProductos={searchProductos}
      />
    </div>
  )
}