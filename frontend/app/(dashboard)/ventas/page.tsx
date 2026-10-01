"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { VentasTable } from "./components/VentasTable"
import { VentaForm } from "./components/VentaForm"
import { VentaDetalleDialog } from "./components/VentaDetalleDialog"
import { ventaService, type NuevaVenta } from "@/services/venta-service"
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

      const data = await ventaService.getVentasPaginated(page, 20, filtros)
      
      setVentas(data.ventas)
      setTotalPages(data.totalPages)
      setCurrentPage(page)
    } catch (error) {
      console.error(error)
      toast({ title: "No se cargaron las ventas", description: "Revisá la conexión y recargá la página.", variant: "destructive" })
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
        toast({ title: "Venta eliminada", description: "El stock de sus productos volvió al inventario." })
        const targetPage = ventas.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        loadVentas(targetPage)
      } catch (error: any) {
        toast({
            title: "No se puede eliminar",
            description: error.message,
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

      const nuevaVenta: NuevaVenta = {
        id_caja: caja.id,
        id_tipo_venta: formData.facturar ? 2 : 1,
        total: formData.total,
        facturar: formData.facturar,
        condicion_iva_receptor: formData.condicion_iva_receptor,
        dni_receptor: formData.dni_receptor,
        medio_pago: formData.medio_pago,
        cliente_nombre: formData.cliente_nombre,
        cliente_cuit: formData.cliente_cuit,
        cliente_direccion: formData.cliente_direccion,
        detalles: formData.detalles.map((d: any) => ({
          id_producto: d.id_producto,
          nombre_producto: d.nombre_producto,
          precio_unitario: Number(d.precio_unitario),
          cantidad: Number(d.cantidad),
          descuento_individual: Number(d.descuento_individual || 0),
          subtotal: Number(d.subtotal)
        }))
      }

      // 1. La venta se guarda siempre (aunque ARCA esté caída, no se pierde)
      const venta = await ventaService.createVenta(nuevaVenta)
      const totalTxt = `$${Number(formData.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

      // 2. Si lleva factura, se pide el CAE; si falla, queda pendiente para reintentar desde el detalle
      if (formData.facturar) {
        try {
          const f = await ventaService.facturar(venta.id)
          toast({ title: `Venta cobrada · ${f.tipo_comprobante} ${f.nro_comprobante}`, description: `Total ${totalTxt}. CAE ${f.cae}.` })
        } catch (e: any) {
          toast({
            title: "Venta cobrada, factura pendiente",
            description: `${e.message} Reintentá desde el detalle de la venta.`,
            variant: "destructive",
            duration: 10000,
          })
        }
      } else {
        toast({ title: "Venta cobrada", description: `Total ${totalTxt}` })
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">Ventas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMostrarFiltros(!mostrarFiltros)} aria-expanded={mostrarFiltros}>
            <Filter /> Filtrar
          </Button>
          <Button onClick={() => handleOpenForm()} className="font-semibold">
            <Plus /> Nueva venta
          </Button>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-wrap items-end gap-4 border-y py-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-fecha" className="text-sm font-medium">Día</label>
            <input id="f-fecha" type="date" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-desde" className="text-sm font-medium">Desde</label>
            <input id="f-desde" type="time" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="f-hasta" className="text-sm font-medium">Hasta</label>
            <input id="f-hasta" type="time" className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
          <Button variant="outline" className="w-[150px] justify-between" onClick={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}>
            {orden === 'desc' ? 'Más nuevas primero' : 'Más viejas primero'}
            <ArrowUpDown className="opacity-50" />
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => loadVentas(1)}>Aplicar</Button>
            <Button variant="ghost" onClick={() => {
              setFechaFiltro("")
              setHoraInicio("")
              setHoraFin("")
              setOrden('desc')
              setTimeout(() => window.location.reload(), 100)
            }}>
              <X /> Limpiar
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