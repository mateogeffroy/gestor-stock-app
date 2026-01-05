"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { VentaDetalleDialog } from "./components/VentaDetalleDialog"
import { ventaService } from "@/services/venta-service"
import { NuevaVenta } from "./types" 
import { cajaService } from "@/services/caja-service"
import { productoService } from "@/services/producto-service"
import { Plus, Filter, X, ArrowUpDown } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useEsDemo } from "@/hooks/use-es-demo"

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenta, setEditingVenta] = useState<any | undefined>(undefined)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<any | null>(null)

  const esDemo = useEsDemo()

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [fechaFiltro, setFechaFiltro] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc')

  const loadVentas = async (page = 1) => {
    setIsLoading(true)
    try {
      const filtros = {
        fecha: fechaFiltro || undefined,
        horaInicio: horaInicio || undefined,
        horaFin: horaFin || undefined,
        orden: orden
      }

      const data = await ventaService.getVentasPaginated(page, 5, filtros)
      
      setVentas(data.ventas)
      setTotalPages(data.totalPages)
      setCurrentPage(page)
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Fallo al cargar la lista", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadVentas(1)
  }, []) 

  useEffect(() => {
    loadVentas(1)
  }, [orden])

  const renderPaginationItems = () => {
    const items = []
    items.push(
      <PaginationItem key={1}>
        <PaginationLink isActive={currentPage === 1} onClick={() => loadVentas(1)}>
          1
        </PaginationLink>
      </PaginationItem>
    )
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)
    if (currentPage === 1) endPage = Math.min(totalPages - 1, 3)
    if (currentPage === totalPages) startPage = Math.max(2, totalPages - 2)

    if (startPage > 2) items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>)

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => loadVentas(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (endPage < totalPages - 1) items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>)

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
      toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (esDemo) {
        toast({ 
            title: "Modo Demo", 
            description: "Esta acción eliminaría la venta y repondría el stock en la versión real.", 
        });
        return;
    }

    if (window.confirm("¿Eliminar venta? Se devolverá el stock.")) {
      try {
        await ventaService.deleteVenta(id)
        toast({ title: "Éxito", description: "Venta eliminada" })
        const targetPage = ventas.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        loadVentas(targetPage)
      } catch (error: any) {
        toast({ 
            title: "Operación Denegada", 
            description: "No se pueden borrar ventas de cajas ya cerradas.", 
            variant: "destructive" 
        })
      }
    }
  }

  const handleSubmit = async (formData: any) => {
    if (esDemo) {
        toast({ 
            title: "Modo Demo", 
            description: "Simulación de venta demo.", 
        });
        handleCloseForm();
        return;
    }

    setIsLoading(true) 

    try {
      const caja = await cajaService.asegurarCajaAbierta()
      if (!caja || !caja.id) throw new Error("Debes abrir la caja antes de vender.")

      let datosAfip = null;
      
      try {
          const resAfip = await fetch('/api/afip/emitir', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  total: formData.total,
                  cuitCliente: 0 
              })
          })
          
          const jsonAfip = await resAfip.json()
          
          if (jsonAfip.success) {
              datosAfip = jsonAfip.data
              toast({ 
                title: "Factura Autorizada ✅", 
                description: `CAE: ${datosAfip.cae} - Comprobante: ${datosAfip.nro_comprobante}`,
                duration: 5000 
              })
          } else {
              throw new Error("AFIP rechazó la facturación: " + jsonAfip.error)
          }

      } catch (afipError: any) {
          console.error("Error facturación:", afipError)
          throw new Error("No se pudo emitir factura. Venta cancelada.")
      }

      const nuevaVenta: NuevaVenta = {
        id_caja: caja.id,
        id_tipo_venta: formData.id_tipo_venta || 1, 
        total: formData.total, 
        
        tipo_comprobante: datosAfip?.tipo_comprobante || 'Ticket',
        nro_comprobante: datosAfip?.nro_comprobante || null,
        cae: datosAfip?.cae || null,
        vto_cae: datosAfip?.vto_cae || null,

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
          toast({ title: "Aviso", description: "Edición no habilitada.", variant: "warning" })
      } else {
        await ventaService.createVenta(nuevaVenta)
        toast({ title: "¡Venta Registrada!", description: "Guardada con éxito." })
      }
      
      handleCloseForm()
      loadVentas(1) 

    } catch (error: any) {
      console.error(error)
      toast({ title: "Error al procesar", description: error.message, variant: "destructive" })
    } finally {
        setIsLoading(false) 
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Historial y gestión de transacciones</p>
        </div>
        
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-2 h-4 w-4" /> Nueva Venta
            </Button>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="bg-muted/40 p-4 rounded-md border flex flex-wrap gap-4 items-end animate-in slide-in-from-top-2">
            
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Fecha</label>
                <input 
                    type="date" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Desde (Hora)</label>
                <input 
                    type="time" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Hasta (Hora)</label>
                <input 
                    type="time" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium">Orden</label>
               <Button 
                  variant="outline" 
                  className="w-[140px] justify-between"
                  onClick={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}
               >
                  {orden === 'desc' ? 'Más recientes' : 'Más antiguas'}
                  <ArrowUpDown className="h-3 w-3 ml-2 opacity-50" />
               </Button>
            </div>

            <div className="flex gap-2 pb-0.5 ml-auto md:ml-0">
                <Button variant="secondary" onClick={() => loadVentas(1)}>
                    Aplicar
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                    setFechaFiltro("")
                    setHoraInicio("")
                    setHoraFin("")
                    setOrden('desc') 
                    setTimeout(() => window.location.reload(), 100) 
                }} title="Limpiar filtros">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
      )}

      <VentasTable 
        ventas={ventas} 
        onView={handleOpenViewDialog}
        onEdit={handleOpenForm} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
      />

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