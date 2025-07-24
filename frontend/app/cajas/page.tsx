"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DollarSign, Receipt, CreditCard, ArrowUpRight, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cajaService, type Caja, type ResumenCaja } from "@/services/caja-service"
import { useToast } from "@/components/ui/use-toast"

export default function CajasPage() {
  const { toast } = useToast()
  const [cajas, setCajas] = useState<Caja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedCaja, setSelectedCaja] = useState<Caja | null>(null)
  const [ventasCaja, setVentasCaja] = useState<any[]>([])
  const [resumenDiario, setResumenDiario] = useState<ResumenCaja>({
    totalOrdenesCompra: 0,
    totalFacturasB: 0,
    totalDia: 0,
  })

  const loadCajas = async () => {
    setIsLoading(true)
    try {
      const data = await cajaService.getUltimasCajas()
      setCajas(data)
    } catch (error) {
      console.error("Error al cargar cajas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cajas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadResumenDiario = async () => {
    try {
      const data = await cajaService.getResumenDiario()
      setResumenDiario(data)
    } catch (error) {
      console.error("Error al cargar resumen diario:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el resumen diario",
        variant: "destructive",
      })
    }
  }

  const handleCerrarCaja = async () => {
    try {
      await cajaService.cerrarCaja()
      toast({
        title: "Éxito",
        description: "Caja cerrada correctamente",
      })
      loadCajas()
      loadResumenDiario()
      setIsAlertOpen(false)
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la caja",
        variant: "destructive",
      })
    }
  }

  const handleVerDetalle = async (caja: Caja) => {
    setSelectedCaja(caja)
    try {
      const ventas = await cajaService.getVentasPorCaja(caja.id)
      setVentasCaja(ventas)
    } catch (error) {
      console.error("Error al cargar ventas de la caja:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas de la caja",
        variant: "destructive",
      })
    }
    setIsDialogOpen(true)
  }

  useEffect(() => {
    loadCajas()
    loadResumenDiario()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cajas</h1>
        <p className="text-muted-foreground">Gestiona las cajas diarias de La Cuerda Bebidas</p>
      </div>

      <motion.div className="grid gap-4 md:grid-cols-3" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Órdenes de Compra</CardTitle>
              <div className="rounded-full bg-blue-100 p-2 text-blue-500 dark:bg-blue-900/20">
                <Receipt className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${resumenDiario.totalOrdenesCompra.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span>Recaudado hoy</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Facturas Electrónicas B</CardTitle>
              <div className="rounded-full bg-purple-100 p-2 text-purple-500 dark:bg-purple-900/20">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${resumenDiario.totalFacturasB.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span>Recaudado hoy</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total del Día</CardTitle>
              <div className="rounded-full bg-green-100 p-2 text-green-500 dark:bg-green-900/20">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${resumenDiario.totalDia.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span>Pendiente de cierre</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex justify-end">
        <Button onClick={() => setIsAlertOpen(true)}>Cerrar Caja</Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle>Historial de Cajas</CardTitle>
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
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Total Recaudado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cajas.map((caja) => (
                    <TableRow key={caja.id}>
                      <TableCell className="font-medium">{caja.id}</TableCell>
                      <TableCell>{new Date(caja.fecha_y_hora_cierre).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${caja.total_recaudado.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleVerDetalle(caja)}>
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalle de Caja</DialogTitle>
            <DialogDescription>
              {selectedCaja && `Caja cerrada el ${new Date(selectedCaja.fecha_y_hora_cierre).toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCaja && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Recaudado:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${selectedCaja.total_recaudado.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Ventas Incluidas</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {ventasCaja.length > 0 ? (
                      ventasCaja.map((venta) => (
                        <AccordionItem key={venta.id} value={`venta-${venta.id}`}>
                          <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4">
                              <span>Venta #{venta.id} - {venta.tipo}</span>
                              <span>
                                {new Date(venta.fecha_y_hora).toLocaleTimeString()} - $
                                {venta.importe_total.toLocaleString()}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead>Cantidad</TableHead>
                                  <TableHead>Precio Unitario</TableHead>
                                  <TableHead>Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {venta.venta_detalles.map((detalle: any) => (
                                  <TableRow key={detalle.id}>
                                    <TableCell>{detalle.producto.nombre}</TableCell>
                                    <TableCell>{detalle.cantidad}</TableCell>
                                    <TableCell>${detalle.precio_unitario.toLocaleString()}</TableCell>
                                    <TableCell>${detalle.subtotal.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No hay ventas asociadas a esta caja.</p>
                    )}
                  </Accordion>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar caja del día?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cerrará la caja del día actual con un total de ${resumenDiario.totalDia.toLocaleString()}.
              Todas las ventas del día serán asociadas a esta caja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCerrarCaja}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}