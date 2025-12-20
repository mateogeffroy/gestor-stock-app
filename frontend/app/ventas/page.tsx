"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { VentaDetalleDialog } from "./components/VentaDetalleDialog"
// Importamos los servicios
import { ventaService, type NuevaVenta } from "@/services/venta-service"
import { cajaService } from "@/services/caja-service"
import { productoService } from "@/services/producto-service"
import { Plus } from "lucide-react"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<any | undefined>(undefined)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null)

  // 1. CARGA DE VENTAS
  const loadVentas = async () => {
    setIsLoading(true)
    try {
      const data = await ventaService.getUltimasVentas(10)
      setVentas(data)
    } catch (error) {
      console.error("Error cargando ventas:", error)
      toast({ title: "Error", description: "Fallo al cargar la lista", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVentas()
  }, [])

  // 2. ABRIR/CERRAR FORMULARIO
  const handleOpenForm = (venta?: any) => {
    setEditingVenta(venta)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingVenta(undefined)
  }

  const handleOpenViewDialog = async (venta: any) => {
    try {
      // Usamos el servicio para traer los detalles (productos anidados)
      const ventaCompleta = await ventaService.getVentaById(venta.id)
      setSelectedVenta(ventaCompleta)
      setIsDetailViewOpen(true)
    } catch (error) {
      console.error("Error cargando detalle:", error)
      toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar venta? Se devolverá el stock.")) {
      try {
        await ventaService.deleteVenta(id) // Asegúrate de haber implementado esto en el service, si no, avísame.
        toast({ title: "Éxito", description: "Venta eliminada" })
        loadVentas()
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
  }

  // 4. GUARDAR VENTA (Con Logs mejorados para encontrar el error)
  const handleSubmit = async (formData: any) => {
    try {
      console.log("1. Iniciando guardado de venta...")
      
      // A) CAJA
      console.log("2. Buscando/Creando caja del día...")
      const caja = await cajaService.getCajaDelDia()
      console.log("   > Caja obtenida ID:", caja?.id)
      
      if (!caja || !caja.id) throw new Error("No se pudo obtener una caja válida.")

      // B) PREPARAR DATOS
      const nuevaVenta: NuevaVenta = {
        id_caja: caja.id,
        id_tipo_venta: formData.id_tipo_venta || 1, 
        total: formData.total, 
        detalles: formData.detalles.map((d: any) => ({
          id_producto: d.id_producto,
          cantidad: Number(d.cantidad),
          subtotal: Number(d.subtotal)
        }))
      }
      
      console.log("3. Enviando venta a Supabase:", nuevaVenta)

      if (editingVenta) {
         toast({ title: "Aviso", description: "Edición no habilitada por seguridad.", variant: "warning" })
      } else {
        await ventaService.createVenta(nuevaVenta)
        toast({ title: "¡Venta Exitosa!", description: "Guardada correctamente" })
      }

      handleCloseForm()
      loadVentas()
      
    } catch (error: any) {
      // LOG CRÍTICO: Aquí veremos el error real en la consola del navegador (F12)
      console.error("❌ ERROR CRÍTICO AL GUARDAR:", error)
      console.error("Mensaje:", error.message)
      console.error("Detalle:", error.details || error.hint || JSON.stringify(error))

      toast({ 
        title: "Error al guardar", 
        description: error.message || "Revisa la consola (F12) para más detalles.", 
        variant: "destructive" 
      })
    }
  }

  if (isFormOpen) {
    return (
      <VentaForm
        venta={editingVenta}
        onSubmit={handleSubmit}
        // Conectamos el buscador directo al servicio
        onSearchProductos={(query) => productoService.getProductos(1, 10, query).then(res => res.productos)} 
        onCancel={handleCloseForm}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas de La Cuerda Bebidas</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Últimas Ventas</CardTitle></CardHeader>
        <CardContent>
          <VentasTable 
            ventas={ventas} 
            onView={handleOpenViewDialog}
            onEdit={handleOpenForm} 
            onDelete={handleDelete} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
      
      <VentaDetalleDialog
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        venta={selectedVenta}
      />
    </div>
  )
}