// frontend/app/productos/page.tsx

"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { productoService, type Producto, type ProductoInsert } from "@/services/producto-service"
import { useToast } from "@/components/ui/use-toast"
import { debounce } from "lodash"

const highlightMatches = (text: string, searchTerm: string) => {
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "", stock: "", precio_lista: "", utilidad_porcentual: "", precio_final: "", codigo_barras: "",
  })

  // --- CAMBIO 1: Adaptamos la función de carga a la nueva respuesta del servicio ---
  const loadProductos = async (page = 1, search = searchTerm) => {
    setIsLoading(true)
    try {
      const result = await productoService.getProductos(page, 5, search)
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
  
  const handleOpenDialog = (producto: Producto | null = null) => {
    if (producto) {
      setEditingProducto(producto)
      setNuevoProducto({
        nombre: producto.nombre, 
        stock: String(producto.stock), 
        precio_lista: String(producto.precio_lista),
        utilidad_porcentual: producto.utilidad_porcentual ? String(producto.utilidad_porcentual) : "",
        precio_final: producto.precio_final ? String(producto.precio_final) : "",
        codigo_barras: producto.codigo_barras || "",
      })
    } else {
      setEditingProducto(null)
      setNuevoProducto({
        nombre: "", stock: "", precio_lista: "", utilidad_porcentual: "", precio_final: "", codigo_barras: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handlePrecioListaChange = (value: string) => {
    const precioLista = Number.parseFloat(value)
    const utilidad = Number.parseFloat(nuevoProducto.utilidad_porcentual)
    let precioFinalCalculado = nuevoProducto.precio_final
    
    if (!isNaN(precioLista) && !isNaN(utilidad)) {
        precioFinalCalculado = (precioLista * (1 + utilidad / 100)).toFixed(2)
    }
    
    setNuevoProducto({ ...nuevoProducto, precio_lista: value, precio_final: precioFinalCalculado })
  }

  const handleUtilidadChange = (value: string) => {
    const utilidad = Number.parseFloat(value)
    const precioLista = Number.parseFloat(nuevoProducto.precio_lista)
    let precioFinalCalculado = nuevoProducto.precio_final
    
    if (!isNaN(utilidad) && !isNaN(precioLista)) {
        precioFinalCalculado = (precioLista * (1 + utilidad / 100)).toFixed(2)
    }
    
    setNuevoProducto({ ...nuevoProducto, utilidad_porcentual: value, precio_final: precioFinalCalculado })
  }

  const handlePrecioFinalChange = (value: string) => {
    const precioFinal = Number.parseFloat(value)
    const precioLista = Number.parseFloat(nuevoProducto.precio_lista)
    let utilidadCalculada = nuevoProducto.utilidad_porcentual

    if (!isNaN(precioFinal) && !isNaN(precioLista) && precioLista > 0) {
        utilidadCalculada = ((precioFinal / precioLista - 1) * 100).toFixed(2)
    }

    setNuevoProducto({ ...nuevoProducto, precio_final: value, utilidad_porcentual: utilidadCalculada })
  }

  const handleSubmit = async () => {
    try {
      const productoData: ProductoInsert = {
        nombre: nuevoProducto.nombre,
        stock: Number.parseInt(nuevoProducto.stock, 10),
        precio_lista: Number.parseFloat(nuevoProducto.precio_lista),
        utilidad_porcentual: nuevoProducto.utilidad_porcentual ? Number.parseFloat(nuevoProducto.utilidad_porcentual) : null,
        precio_final: nuevoProducto.precio_final ? Number.parseFloat(nuevoProducto.precio_final) : null,
        codigo_barras: nuevoProducto.codigo_barras || null,
      }

      // Validación simple
      if (!productoData.nombre || !productoData.stock || !productoData.precio_lista) {
        toast({ title: "Error de validación", description: "Nombre, stock y precio de lista son obligatorios.", variant: "destructive" });
        return;
      }

      if (editingProducto) {
        await productoService.updateProducto(editingProducto.id, productoData)
        toast({ title: "Éxito", description: "Producto actualizado correctamente" })
        loadProductos(currentPage, searchTerm) 
      } else {
        await productoService.createProducto(productoData)
        toast({ title: "Éxito", description: "Producto creado correctamente" })
        loadProductos(1, "") // Al crear, volvemos a la página 1 sin búsqueda
      }
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error al guardar producto:", error)
      toast({ title: "Error", description: "No se pudo guardar el producto", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await productoService.deleteProducto(id)
        toast({ title: "Éxito", description: "Producto eliminado correctamente" })
        // Si la página actual queda vacía, retrocedemos una página
        if (productos.length === 1 && currentPage > 1) {
            loadProductos(currentPage - 1, searchTerm);
        } else {
            loadProductos(currentPage, searchTerm);
        }
      } catch (error) {
        console.error("Error al eliminar producto:", error)
        toast({ title: "Error", description: "No se pudo eliminar el producto", variant: "destructive" })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* El resto del JSX no necesita cambios, pero lo incluyo por completitud */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        <p className="text-muted-foreground">Gestiona el inventario de productos de La Cuerda Bebidas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar productos..." className="pl-8 w-full" value={searchTerm} onChange={handleSearchChange} />
          {isSearching && <div className="absolute right-2.5 top-2.5"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nuevo Producto</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4"><CardTitle>Listado de Productos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Código</TableHead>
                    <TableHead>Precio Lista</TableHead><TableHead>Utilidad %</TableHead><TableHead>Precio Final</TableHead>
                    <TableHead>Stock</TableHead><TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {productos.length > 0 ? (
                      productos.map((producto) => (
                        <motion.tr key={producto.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="border-b">
                          <TableCell className="font-medium">{producto.id}</TableCell>
                          <TableCell>{highlightMatches(producto.nombre, searchTerm)}</TableCell>
                          <TableCell>{producto.codigo_barras || "-"}</TableCell>
                          {/* --- CAMBIO 2: Convertimos a número antes de formatear --- */}
                          <TableCell>${Number(producto.precio_lista).toLocaleString('es-AR')}</TableCell>
                          <TableCell>{producto.utilidad_porcentual ? `${Number(producto.utilidad_porcentual).toFixed(2)}%` : "-"}</TableCell>
                          <TableCell>${producto.precio_final ? Number(producto.precio_final).toLocaleString('es-AR') : "-"}</TableCell>
                          <TableCell>{producto.stock}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(producto)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(producto.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <tr><TableCell colSpan={8} className="text-center py-6">{searchTerm ? `No se encontraron productos con "${searchTerm}"` : "No hay productos disponibles"}</TableCell></tr>
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
            <PaginationItem><PaginationPrevious onClick={() => currentPage > 1 && loadProductos(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}><PaginationLink isActive={page === currentPage} onClick={() => loadProductos(page)}>{page}</PaginationLink></PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => currentPage < totalPages && loadProductos(currentPage + 1)} className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>{editingProducto ? "Modifica los datos del producto." : "Completa los datos para agregar un producto."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2"><Label htmlFor="nombre">Nombre *</Label><Input id="nombre" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} required/></div>
                <div className="space-y-2"><Label htmlFor="codigo_barras">Código de Barras</Label><Input id="codigo_barras" placeholder="(opcional)" value={nuevoProducto.codigo_barras} onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo_barras: e.target.value })}/></div>
                <div className="space-y-2"><Label htmlFor="precio_lista">Precio de Lista *</Label><Input id="precio_lista" type="number" step="0.01" placeholder="Ej: 1500.00" value={nuevoProducto.precio_lista} onChange={(e) => handlePrecioListaChange(e.target.value)} required/></div>
                <div className="space-y-2"><Label htmlFor="utilidad_porcentual">Utilidad (%)</Label><Input id="utilidad_porcentual" type="number" step="0.01" placeholder="Ej: 25" value={nuevoProducto.utilidad_porcentual} onChange={(e) => handleUtilidadChange(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="precio_final">Precio Final</Label><Input id="precio_final" type="number" step="0.01" placeholder="Se calcula automáticamente" value={nuevoProducto.precio_final} onChange={(e) => handlePrecioFinalChange(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="stock">Stock *</Label><Input id="stock" type="number" placeholder="Cantidad inicial" value={nuevoProducto.stock} onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })} required/></div>
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