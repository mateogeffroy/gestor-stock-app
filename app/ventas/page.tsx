"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Search, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ventaService, type Venta, type VentaCompletaInsert } from "@/services/venta-service"
import { productoService, type Producto } from "@/services/producto-service"
import { useToast } from "@/components/ui/use-toast"

interface DetalleVenta {
  id?: number
  id_producto: number | null
  nombre_producto?: string
  precio_unitario: number
  cantidad: number
  descuento: number
  subtotal: number
  esNuevo?: boolean
}

export default function VentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [nuevaVenta, setNuevaVenta] = useState({
    tipo: "orden_compra",
    descuento_general: 0,
    detalles: [] as DetalleVenta[],
  })

  const loadVentas = async () => {
    setIsLoading(true)
    try {
      const data = await ventaService.getUltimasVentas()
      setVentas(data)
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

  const searchProductos = async (term: string) => {
    if (!term || term.length < 2) {
      setProductos([])
      return
    }

    setIsSearching(true)
    try {
      const data = await productoService.searchProductos(term)
      setProductos(data)
    } catch (error) {
      console.error("Error al buscar productos:", error)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchProductos(searchTerm)
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchTerm])

  const handleOpenDialog = () => {
    setNuevaVenta({
      tipo: "orden_compra",
      descuento_general: 0,
      detalles: [
        {
          id_producto: null,
          precio_unitario: 0,
          cantidad: 1,
          descuento: 0,
          subtotal: 0,
          esNuevo: true,
        },
      ],
    })
    setIsDialogOpen(true)
    // Resetear el estado de búsqueda al abrir el modal
    setSearchTerm("")
    setProductos([])
    setIsSearchOpen(false)
  }

  const handleSelectProducto = (producto: Producto) => {
    const newDetalle: DetalleVenta = {
      id_producto: producto.id,
      nombre_producto: producto.nombre,
      precio_unitario: producto.precio_final || producto.precio_lista,
      cantidad: 1,
      descuento: 0,
      subtotal: producto.precio_final || producto.precio_lista,
    }

    const nuevosDetalles = [...nuevaVenta.detalles]
    // Encontrar la posición de la fila vacía
    const emptyRowIndex = nuevosDetalles.findIndex((d) => d.esNuevo)

    if (emptyRowIndex !== -1) {
      // Insertar antes de la fila vacía
      nuevosDetalles.splice(emptyRowIndex, 0, newDetalle)
    } else {
      // Si no hay fila vacía, agregar al final
      nuevosDetalles.push(newDetalle)
    }

    setNuevaVenta({
      ...nuevaVenta,
      detalles: nuevosDetalles,
    })

    setSearchTerm("")
    setIsSearchOpen(false)
  }

  const handleDetalleChange = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...nuevaVenta.detalles]
    const detalle = { ...nuevosDetalles[index] }

    // Actualizar el campo específico
    ;(detalle as any)[field] = value

    // Recalcular subtotal
    if (field === "precio_unitario" || field === "cantidad" || field === "descuento") {
      const precio = Number.parseFloat(detalle.precio_unitario.toString())
      const cantidad = Number.parseInt(detalle.cantidad.toString())
      const descuento = Number.parseFloat(detalle.descuento.toString()) || 0

      const subtotalSinDescuento = precio * cantidad
      const descuentoAmount = subtotalSinDescuento * (descuento / 100)
      detalle.subtotal = subtotalSinDescuento - descuentoAmount
    }

    nuevosDetalles[index] = detalle
    setNuevaVenta({
      ...nuevaVenta,
      detalles: nuevosDetalles,
    })
  }

  const handleRemoveDetalle = (index: number) => {
    const nuevosDetalles = [...nuevaVenta.detalles]
    nuevosDetalles.splice(index, 1)

    // Si eliminamos todos los detalles, agregar una fila vacía
    if (nuevosDetalles.length === 0 || !nuevosDetalles.some((d) => d.esNuevo)) {
      nuevosDetalles.push({
        id_producto: null,
        precio_unitario: 0,
        cantidad: 1,
        descuento: 0,
        subtotal: 0,
        esNuevo: true,
      })
    }

    setNuevaVenta({
      ...nuevaVenta,
      detalles: nuevosDetalles,
    })
  }

  const calcularTotal = () => {
    const subtotal = nuevaVenta.detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0)
    const descuento = subtotal * (nuevaVenta.descuento_general / 100)
    return subtotal - descuento
  }

  const handleSubmit = async () => {
    try {
      // Filtrar la fila vacía y preparar los detalles
      const detallesParaEnviar = nuevaVenta.detalles
        .filter((detalle) => !detalle.esNuevo)
        .map((detalle) => ({
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

      const ventaData: VentaCompletaInsert = {
        importe_total: calcularTotal(),
        tipo: nuevaVenta.tipo,
        estado: "Completada",
        detalles: detallesParaEnviar,
      }

      await ventaService.createVenta(ventaData)
      toast({
        title: "Éxito",
        description: "Venta registrada correctamente",
      })
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

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completada":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "Cancelada":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground">Gestiona las ventas de La Cuerda Bebidas</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Venta
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {ventas.map((venta) => (
                      <motion.tr
                        key={venta.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">{venta.id}</TableCell>
                        <TableCell>{new Date(venta.fecha_y_hora).toLocaleString()}</TableCell>
                        <TableCell>
                          {venta.tipo === "orden_compra"
                            ? "Orden de compra"
                            : venta.tipo === "factura_b"
                              ? "Factura electrónica B"
                              : venta.tipo}
                        </TableCell>
                        <TableCell>${venta.importe_total.toLocaleString()}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}
                          >
                            {venta.estado}
                          </span>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Venta</DialogTitle>
            <DialogDescription>Completa los datos para registrar una nueva venta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Venta</Label>
                <Select
                  value={nuevaVenta.tipo}
                  onValueChange={(value) => setNuevaVenta({ ...nuevaVenta, tipo: value })}
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orden_compra">Orden de compra</SelectItem>
                    <SelectItem value="factura_b">Factura electrónica B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Buscar Producto</Label>
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Buscar por nombre, código o ID..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          if (e.target.value.length >= 2) {
                            setIsSearchOpen(true)
                          }
                        }}
                        onFocus={() => {
                          if (searchTerm.length >= 2) {
                            setIsSearchOpen(true)
                          }
                        }}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onValueChange={(value) => {
                          setSearchTerm(value)
                        }}
                      />
                      <CommandList>
                        {isSearching ? (
                          <div className="flex justify-center items-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No se encontraron productos.</CommandEmpty>
                            <CommandGroup>
                              {productos.map((producto) => (
                                <CommandItem
                                  key={producto.id}
                                  onSelect={() => handleSelectProducto(producto)}
                                  className="flex flex-col items-start"
                                >
                                  <div className="font-medium">{producto.nombre}</div>
                                  <div className="text-xs text-muted-foreground flex gap-2">
                                    <span>ID: {producto.id}</span>
                                    {producto.codigo_barras && <span>Código: {producto.codigo_barras}</span>}
                                    <span>${producto.precio_final || producto.precio_lista}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Detalle de Venta</Label>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Descuento %</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nuevaVenta.detalles.map((detalle, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {detalle.esNuevo ? (
                              <Input
                                placeholder="Nombre del producto"
                                value={detalle.nombre_producto || ""}
                                onChange={(e) => handleDetalleChange(index, "nombre_producto", e.target.value)}
                              />
                            ) : (
                              detalle.nombre_producto
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={detalle.precio_unitario}
                              onChange={(e) =>
                                handleDetalleChange(index, "precio_unitario", Number.parseFloat(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={detalle.descuento}
                              onChange={(e) =>
                                handleDetalleChange(index, "descuento", Number.parseFloat(e.target.value))
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={detalle.cantidad}
                              onChange={(e) => handleDetalleChange(index, "cantidad", Number.parseInt(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="font-medium">${detalle.subtotal.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDetalle(index)}
                              disabled={detalle.esNuevo && nuevaVenta.detalles.length === 1}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descuento_general">Descuento General (%)</Label>
                <Input
                  id="descuento_general"
                  type="number"
                  min="0"
                  max="100"
                  value={nuevaVenta.descuento_general}
                  onChange={(e) =>
                    setNuevaVenta({ ...nuevaVenta, descuento_general: Number.parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="flex justify-end text-lg font-bold">Total: ${calcularTotal().toLocaleString()}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Guardar Venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

