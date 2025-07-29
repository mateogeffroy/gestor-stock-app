// frontend/app/ventas/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { fetchVentas, searchProductos, createVenta, deleteVenta } from "./actions"
import { Venta, NuevaVentaState } from "./types" // Importamos el tipo para el form
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // El estado de edición ahora es opcional (undefined) para que coincida con VentaForm
  const [editingVenta, setEditingVenta] = useState<Venta | undefined>(undefined)

  const loadVentas = async () => {
    setIsLoading(true)
    try {
      // 👇 CAMBIO 1: Extraemos los resultados del objeto paginado
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
    // La confirmación es mejor hacerla con un componente Dialog de ShadCN, pero alert funciona.
    if (window.confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
      try {
        await deleteVenta(id)
        toast({
          title: "Éxito",
          description: "Venta eliminada correctamente",
        })
        loadVentas() // Recargamos la lista
      } catch (error) {
        console.error("Error al eliminar venta:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la venta",
          variant: "destructive",
        })
      }
    }
  }

  // 👇 CAMBIO 2: Simplificamos radicalmente la lógica de envío de datos
  const handleSubmit = async (ventaData: NuevaVentaState) => {
    try {
      // El backend espera 'id_producto', no 'producto'. Lo transformamos.
      const detallesParaEnviar = ventaData.detalles.map(d => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      }));

      if (detallesParaEnviar.length === 0) {
        toast({
          title: "Error de validación",
          description: "Una venta debe tener al menos un producto.",
          variant: "destructive",
        });
        return;
      }
      
      // Creamos el objeto que espera nuestro VentaSerializer en Django
      const ventaCompleta = {
        ...ventaData,
        detalles: detallesParaEnviar,
      };

      if (editingVenta) {
        // La lógica de actualización (PUT) la implementaremos después.
        // Por ahora, solo creamos nuevas ventas.
        console.log("Actualizar venta (no implementado):", ventaCompleta)
        toast({
          title: "En desarrollo",
          description: "La actualización de ventas aún no está implementada.",
        })
      } else {
        await createVenta(ventaCompleta)
        toast({
          title: "Éxito",
          description: "Venta registrada correctamente",
        })
      }

      setIsDialogOpen(false)
      loadVentas() // Recargamos la lista para ver la nueva venta
    } catch (error: any) {
      console.error("Error al guardar venta:", error);
      // Intentamos mostrar un mensaje de error más específico si el backend lo envía
      const errorMsg = error.message || "No se pudo registrar la venta";
      toast({
        title: "Error al guardar",
        description: errorMsg,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground">Gestiona las ventas de La Cuerda Bebidas</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
          if (!isOpen) setEditingVenta(undefined); // Limpiamos el estado al cerrar
          setIsDialogOpen(isOpen);
        }}
        venta={editingVenta}
        onSubmit={handleSubmit}
        onSearchProductos={searchProductos}
      />
    </div>
  )
}