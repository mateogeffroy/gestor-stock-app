"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from "@/components/ui/pagination"
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { productoService, type Producto, type ProductoInsert } from "@/services/producto-service"
import { useToast } from "@/components/ui/use-toast"
import { debounce } from "lodash"

const highlightMatches = (text: string, searchTerm: string) => {
  if (!text) return "-";
  if (!searchTerm.trim()) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span key={index} className="bg-red-400/20 rounded-sm">{part}</span>
    ) : (part)
  );
};

export default function ProductosPage() {
  const { toast } = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  
  // ESTADOS DE PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 5; // Configurado a 5 como pediste

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    stock: "",
    precio_costo: "",
    utilidad_porcentual: "",
    precio_lista: "",
    codigo: "",
  })

  const loadProductos = async (page = 1, search = searchTerm) => {
    setIsLoading(true)
    try {
      const result = await productoService.getProductos(page, ITEMS_PER_PAGE, search)
      setProductos(result.productos || [])
      setTotalPages(result.totalPages || 1)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error al cargar productos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setIsSearching(true)
      loadProductos(1, term).finally(() => setIsSearching(false))
    }, 300),
    []
  )

  useEffect(() => {
    loadProductos()
  }, [])

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value) }

  // --- LÓGICA DE PAGINACIÓN VISUAL (ROBUSTA) ---
  const renderPaginationItems = () => {
    const items = []
    
    // 1. Siempre mostrar la Primera Página
    items.push(
      <PaginationItem key={1}>
        <PaginationLink isActive={currentPage === 1} onClick={() => loadProductos(1)}>
          1
        </PaginationLink>
      </PaginationItem>
    )

    // 2. Calcular rango de páginas centrales
    let startPage = Math.max(2, currentPage - 1)
    let endPage = Math.min(totalPages - 1, currentPage + 1)

    if (currentPage === 1) {
      endPage = Math.min(totalPages - 1, 3)
    }
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
          <PaginationLink isActive={currentPage === i} onClick={() => loadProductos(i)}>
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
          <PaginationLink isActive={currentPage === totalPages} onClick={() => loadProductos(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  const handleOpenDialog = (producto: Producto | null = null) => {
    if (producto) {
      setEditingProducto(producto)
      setNuevoProducto({
        nombre: producto.nombre,
        stock: String(producto.stock),
        precio_costo: String(producto.precio_costo),
        utilidad_porcentual: String(producto.porcentaje_utilidad),
        precio_lista: String(producto.precio_lista),
        codigo: producto.codigo || "",
      })
    } else {
      setEditingProducto(null)
      setNuevoProducto({
        nombre: "", stock: "", precio_costo: "", utilidad_porcentual: "", precio_lista: "", codigo: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handlePrecioCostoChange = (value: string) => {
    const costo = Number.parseFloat(value)
    const utilidad = Number.parseFloat(nuevoProducto.utilidad_porcentual)
    let precioVentaCalculado = nuevoProducto.precio_lista

    if (!isNaN(costo) && !isNaN(utilidad)) {
      precioVentaCalculado = (costo * (1 + utilidad / 100)).toFixed(2)
    }

    setNuevoProducto({ ...nuevoProducto, precio_costo: value, precio_lista: precioVentaCalculado })
  }

  const handleUtilidadChange = (value: string) => {
    const utilidad = Number.parseFloat(value)
    const costo = Number.parseFloat(nuevoProducto.precio_costo)
    let precioVentaCalculado = nuevoProducto.precio_lista

    if (!isNaN(utilidad) && !isNaN(costo)) {
      precioVentaCalculado = (costo * (1 + utilidad / 100)).toFixed(2)
    }

    setNuevoProducto({ ...nuevoProducto, utilidad_porcentual: value, precio_lista: precioVentaCalculado })
  }

  const handlePrecioVentaChange = (value: string) => {
    const precioVenta = Number.parseFloat(value)
    const costo = Number.parseFloat(nuevoProducto.precio_costo)
    let utilidadCalculada = nuevoProducto.utilidad_porcentual

    if (!isNaN(precioVenta) && !isNaN(costo) && costo > 0) {
      utilidadCalculada = ((precioVenta / costo - 1) * 100).toFixed(2)
    }

    setNuevoProducto({ ...nuevoProducto, precio_lista: value, utilidad_porcentual: utilidadCalculada })
  }

  const handleSubmit = async () => {
    try {
      const productoData: ProductoInsert = {
        nombre: nuevoProducto.nombre,
        stock: Number.parseInt(nuevoProducto.stock, 10),
        precio_costo: Number.parseFloat(nuevoProducto.precio_costo) || 0,
        porcentaje_utilidad: Number.parseFloat(nuevoProducto.utilidad_porcentual) || 0,
        precio_lista: Number.parseFloat(nuevoProducto.precio_lista),
        codigo: nuevoProducto.codigo || null,
      }

      if (!productoData.nombre || isNaN(productoData.stock) || isNaN(productoData.precio_lista)) {
        toast({ title: "Error de validación", description: "Nombre, stock y precio de venta son obligatorios.", variant: "destructive" });
        return;
      }

      if (editingProducto) {
        await productoService.updateProducto(editingProducto.id, productoData)
        toast({ title: "Éxito", description: "Producto actualizado correctamente" })
        loadProductos(currentPage, searchTerm)
      } else {
        await productoService.createProducto(productoData)
        toast({ title: "Éxito", description: "Producto creado correctamente" })
        loadProductos(1, "") 
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar producto:", error)
      toast({ title: "Error", description: "No se pudo guardar el producto. Verifique si el código ya existe.", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await productoService.deleteProducto(id)
        toast({ title: "Éxito", description: "Producto eliminado correctamente" })
        if (productos.length === 1 && currentPage > 1) {
          loadProductos(currentPage - 1, searchTerm);
        } else {
          loadProductos(currentPage, searchTerm);
        }
      } catch (error: any) {
        console.error("Error al eliminar:", error)
        toast({ title: "Error", description: error.message || "No se pudo eliminar el producto", variant: "destructive" })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        <p className="text-muted-foreground">Gestiona el inventario de productos (Supabase)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nombre o código..." className="pl-8 w-full" value={searchTerm} onChange={handleSearchChange} />
          {isSearching && <div className="absolute right-2.5 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4"><CardTitle>Listado de Productos</CardTitle></CardHeader>
        {/* SOLUCIÓN AL SCROLL DOBLE: Eliminamos cualquier max-height y dejamos que fluya */}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            // Solo overflow-x-auto para responsividad horizontal, sin overflow-y
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Utilidad %</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {productos.length > 0 ? (
                      productos.map((producto) => (
                        <motion.tr 
                          key={producto.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          transition={{ duration: 0.2 }} 
                          // SOLUCIÓN CLIC EN FILA: cursor-pointer y onClick
                          className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleOpenDialog(producto)}
                        >
                          <TableCell className="font-medium">{highlightMatches(producto.nombre, searchTerm)}</TableCell>
                          <TableCell>{highlightMatches(producto.codigo || "-", searchTerm)}</TableCell>
                          <TableCell className="text-muted-foreground">${Number(producto.precio_costo).toLocaleString('es-AR')}</TableCell>
                          <TableCell>{producto.porcentaje_utilidad ? `${Number(producto.porcentaje_utilidad).toFixed(2)}%` : "-"}</TableCell>
                          <TableCell className="font-bold text-green-600">${Number(producto.precio_lista).toLocaleString('es-AR')}</TableCell>
                          <TableCell>{producto.stock}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* Botones con stopPropagation para no disparar el click de la fila */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleOpenDialog(producto); }}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleDelete(producto.id); }}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <tr><TableCell colSpan={7} className="text-center py-6">{searchTerm ? `No se encontraron productos con "${searchTerm}"` : "No hay productos disponibles"}</TableCell></tr>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && !isLoading && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
               <PaginationPrevious 
                  onClick={() => currentPage > 1 && loadProductos(currentPage - 1)} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
               />
            </PaginationItem>
            
            {renderPaginationItems()}
            
            <PaginationItem>
               <PaginationNext 
                  onClick={() => currentPage < totalPages && loadProductos(currentPage + 1)} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
               />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ... DIALOG CONTENT (Igual que antes) ... */}
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>{editingProducto ? "Modifica los datos del producto." : "Completa los datos para agregar un producto."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2"><Label htmlFor="nombre">Nombre *</Label><Input id="nombre" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} required /></div>
              <div className="space-y-2"><Label htmlFor="codigo">Código de Barras</Label><Input id="codigo" placeholder="(opcional)" value={nuevoProducto.codigo} onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_costo">Precio Costo</Label>
                  <Input id="precio_costo" type="number" step="0.01" placeholder="0.00" value={nuevoProducto.precio_costo} onChange={(e) => handlePrecioCostoChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utilidad_porcentual">Utilidad (%)</Label>
                  <Input id="utilidad_porcentual" type="number" step="0.01" placeholder="Ej: 30" value={nuevoProducto.utilidad_porcentual} onChange={(e) => handleUtilidadChange(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio_lista" className="font-bold">Precio Venta (Final) *</Label>
                <Input id="precio_lista" type="number" step="0.01" className="font-bold border-green-500" placeholder="0.00" value={nuevoProducto.precio_lista} onChange={(e) => handlePrecioVentaChange(e.target.value)} required />
              </div>

              <div className="space-y-2"><Label htmlFor="stock">Stock *</Label><Input id="stock" type="number" placeholder="Cantidad inicial" value={nuevoProducto.stock} onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} required /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}