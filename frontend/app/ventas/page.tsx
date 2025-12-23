"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { VentaDetalleDialog } from "./components/VentaDetalleDialog"
import { ventaService } from "@/services/venta-service"
import { NuevaVenta } from "./types" 
import { cajaService } from "@/services/caja-service"
import { productoService } from "@/services/producto-service"
import { Plus } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<any | undefined>(undefined)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null)

  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 1. CARGA DE VENTAS (Paginada)
  const loadVentas = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await ventaService.getVentasPaginated(page, 5) // 5 por página
      setVentas(data.ventas)
      setTotalPages(data.totalPages)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error cargando ventas:", error)
      toast({ title: "Error", description: "Fallo al cargar la lista", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVentas(1)
  }, [])

  // --- LÓGICA DE RENDERIZADO DE PÁGINAS (CORREGIDA) ---
  const renderPaginationItems = () => {
    const items = []
    
    // 1. Siempre mostrar la Primera Página
    items.push(
      <PaginationItem key={1}>
        <PaginationLink isActive={currentPage === 1} onClick={() => loadVentas(1)}>
          1
        </PaginationLink>
      </PaginationItem>
    )

    // 2. Calcular rango de páginas centrales
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)

    // Ajuste visual: Si estamos en la pág 1, mostramos hasta la 3 (si existe)
    if (currentPage === 1) {
      endPage = Math.min(totalPages - 1, 3)
    }
    // Ajuste visual: Si estamos en la última, mostramos desde la antepenúltima
    if (currentPage === totalPages) {
      startPage = Math.max(2, totalPages - 2)
    }

    // 3. Elipsis Izquierda
    if (startPage > 2) {
      items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>)
    }

    // 4. Bucle Central
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => loadVentas(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // 5. Elipsis Derecha
    if (endPage < totalPages - 1) {
      items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>)
    }

    // 6. Siempre mostrar la Última Página (si hay más de 1)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink isActive={currentPage === totalPages} onClick={() => loadVentas(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

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
      const ventaCompleta = await ventaService.getVentaById(venta.id)
      setSelectedVenta(ventaCompleta)
      setIsDetailViewOpen(true)
    } catch (error: any) {
      // ESTO ES LO IMPORTANTE: JSON.stringify nos mostrará el mensaje oculto
      console.error("Error DETALLADO:", JSON.stringify(error, null, 2))
      console.error("Mensaje simple:", error.message)
      console.error("Hint:", error.hint)
      
      toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Eliminar venta? Se devolverá el stock.")) {
      try {
        await ventaService.deleteVenta(id)
        toast({ title: "Éxito", description: "Venta eliminada" })
        
        // Recargar página actual, o la anterior si era el último item
        const targetPage = ventas.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        loadVentas(targetPage)
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" })
      }
    }
  }

  const handleSubmit = async (formData: any) => {
    try {
      const caja = await cajaService.getCajaDelDia()
      if (!caja || !caja.id) throw new Error("No se pudo obtener una caja válida.")

      const nuevaVenta: NuevaVenta = {
        id_caja: caja.id,
        id_tipo_venta: formData.id_tipo_venta || 1, 
        total: formData.total, 
        detalles: formData.detalles.map((d: any) => ({
          id_producto: d.id_producto,
          nombre_producto: d.nombre_producto,
          precio_unitario: Number(d.precio_unitario),
          cantidad: Number(d.cantidad),
          descuento_individual: Number(d.descuento_individual || 0),
          subtotal: Number(d.subtotal)
        }))
      }
      
      if (editingVenta) {
         toast({ title: "Aviso", description: "Edición no habilitada por seguridad.", variant: "warning" })
      } else {
        await ventaService.createVenta(nuevaVenta)
        toast({ title: "¡Venta Exitosa!", description: "Guardada correctamente" })
      }

      handleCloseForm()
      loadVentas(1) // Volver a pág 1 al crear
      
    } catch (error: any) {
      console.error("❌ ERROR CRÍTICO AL GUARDAR:", error)
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
        <CardHeader><CardTitle>Listado de Ventas</CardTitle></CardHeader>
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

      {/* COMPONENTE DE PAGINACIÓN */}
      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && loadVentas(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {renderPaginationItems()}

            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && loadVentas(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <VentaDetalleDialog
        open={isDetailViewOpen}
        onOpenChange={setIsDetailViewOpen}
        venta={selectedVenta}
        onVentaUpdated={()=>{
          loadVentas(currentPage);
          if (selectedVenta) handleOpenViewDialog(selectedVenta);
        }}
      />
    </div>
  )
}