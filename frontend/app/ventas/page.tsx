"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
// --- 1. Importamos el nuevo diálogo de detalle ---
import { VentaDetalleDialog } from "./components/VentaDetalleDialog" 
import { fetchVentas, searchProductos, createVenta, deleteVenta } from "./actions"
import { Venta, NuevaVentaState } from "./types"
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para el formulario de CREAR/EDITAR venta
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<Venta | undefined>(undefined)

  // --- 2. Añadimos nuevos estados para el diálogo de VER DETALLE ---
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

  // --- 3. Creamos las funciones para manejar cada diálogo por separado ---
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
      const payload = { /* ... (lógica de submit sin cambios) ... */ };
      
      if (editingVenta) {
        // Lógica de actualización a implementar
      } else {
        const response = await createVenta(payload)
        toast({ title: "Éxito", description: "Venta registrada correctamente" })
        if (response.warnings?.length) {
          toast({ title: "Advertencia de Stock", description: response.warnings.join("\n"), variant: "destructive", duration: 10000 })
        }
      }

      setIsFormOpen(false)
      loadVentas()
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
          {/* --- 4. Pasamos la nueva función `handleOpenViewDialog` a la tabla --- */}
          <VentasTable 
            ventas={ventas} 
            onView={handleOpenViewDialog}
            onEdit={handleOpenEditDialog} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {/* Formulario para CREAR/EDITAR (sin cambios) */}
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

      {/* --- 5. Renderizamos el nuevo diálogo de VER DETALLE --- */}
      <VentaDetalleDialog
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        venta={selectedVenta}
      />
    </div>
  )
}