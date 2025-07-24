"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { fetchVentas, searchProductos, createVenta, deleteVenta } from "./actions"
import { Venta } from "./types"
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null)

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
    setEditingVenta(venta || null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
      try {
        await deleteVenta(id)
        toast({
          title: "Éxito",
          description: "Venta eliminada correctamente",
        })
        loadVentas()
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

  const handleSubmit = async (ventaData: any) => {
    try {
      const detallesParaEnviar = ventaData.detalles
        .filter((detalle: any) => !detalle.esNuevo)
        .map((detalle: any) => ({
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          subtotal: detalle.subtotal,
        }))

      if (detallesParaEnviar.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos un producto a la venta",
          variant: "destructive",
        })
        return
      }

      const ventaCompleta = {
        importe_total: ventaData.detalles.reduce((sum: number, detalle: any) => 
          sum + detalle.subtotal, 0) * (1 - (ventaData.descuento_general / 100)),
        tipo: ventaData.tipo,
        estado: "Completada",
        detalles: detallesParaEnviar,
      }

      if (editingVenta) {
        // Implementar actualización si es necesario
        await createVenta(ventaCompleta)
        toast({
          title: "Éxito",
          description: "Venta actualizada correctamente",
        })
      } else {
        await createVenta(ventaCompleta)
        toast({
          title: "Éxito",
          description: "Venta registrada correctamente",
        })
      }

      setIsDialogOpen(false)
      loadVentas()
    } catch (error) {
      console.error("Error al guardar venta:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar la venta",
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
        onOpenChange={setIsDialogOpen}
        venta={editingVenta || undefined}
        onSubmit={handleSubmit}
        onSearchProductos={searchProductos}
      />
    </div>
  )
}