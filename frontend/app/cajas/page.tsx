"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DollarSign, Receipt, CreditCard, ArrowUpRight, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/components/ui/use-toast"

// Usamos nuestros tipos y servicio actualizados
import { Caja, ResumenCaja, VentaConDetalles } from "./types"
import { cajaService } from "@/services/caja-service"
import { useEsDemo } from "@/hooks/use-es-demo" // <--- 1. IMPORTAMOS EL HOOK

export default function CajasPage() {
  const { toast } = useToast()
  const [cajas, setCajas] = useState<Caja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [selectedCaja, setSelectedCaja] = useState<Caja | null>(null)
  
  // 2. USAMOS EL HOOK
  const esDemo = useEsDemo()

  // Estado para el detalle (modal)
  const [ventasCaja, setVentasCaja] = useState<VentaConDetalles[]>([])
  const [isDetalleLoading, setIsDetalleLoading] = useState(false);
  
  // Estado para el resumen de HOY
  const [cajaDelDiaId, setCajaDelDiaId] = useState<number | null>(null)
  const [resumenDiario, setResumenDiario] = useState<ResumenCaja>({
    totalOrdenesCompra: 0,
    totalFacturasB: 0,
    totalDia: 0,
  })

  // 1. Cargar Historial
  const loadCajas = async () => {
    setIsLoading(true)
    try {
      const data = await cajaService.getCajas()
      setCajas(data) // El servicio ya devuelve array limpio
    } catch (error) {
      console.error("Error al cargar cajas:", error)
      toast({ title: "Error", description: "No se pudieron cargar las cajas", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // 2. Cargar Resumen del Día Actual
  const loadResumenDiario = async () => {
    try {
      // Primero buscamos cuál es la caja de hoy
      const cajaHoy = await cajaService.getCajaDelDia();
      setCajaDelDiaId(cajaHoy.id);

      // Luego calculamos el resumen
      const data = await cajaService.getResumenDiario(cajaHoy.id)
      setResumenDiario(data)
    } catch (error) {
      console.error("Error al cargar resumen diario:", error)
    }
  }

  // 3. Cerrar Caja
  const handleCerrarCaja = async () => {
    // FRENO LÓGICO DEMO
    if (esDemo) {
        toast({ 
            title: "Modo Demo", 
            description: "Has simulado el cierre de caja. El estado real no cambiará.", 
        });
        setIsAlertOpen(false); // Cerramos el modal para simular éxito
        return;
    }

    if (!cajaDelDiaId) return;

    try {
      await cajaService.cerrarCaja(cajaDelDiaId, resumenDiario.totalDia)
      toast({ title: "Éxito", description: "Caja cerrada correctamente" })
      
      // Recargamos para ver el historial actualizado
      loadCajas()
      loadResumenDiario()
      setIsAlertOpen(false)
    } catch (error) {
      console.error("Error al cerrar caja:", error)
      toast({ title: "Error", description: "No se pudo cerrar la caja.", variant: "destructive" })
    }
  }

  // 4. Ver Detalle (Modal)
  const handleVerDetalle = async (caja: Caja) => {
    setSelectedCaja(caja)
    setIsDialogOpen(true)
    setIsDetalleLoading(true)
    try {
      // Forzamos el tipo 'any' temporalmente si TS se queja del join complejo
      const ventas: any = await cajaService.getVentasPorCaja(caja.id)
      setVentasCaja(ventas)
    } catch (error) {
      console.error("Error al cargar ventas de la caja:", error)
      toast({ title: "Error", description: "No se pudieron cargar las ventas", variant: "destructive" })
    } finally {
      setIsDetalleLoading(false)
    }
  }

  useEffect(() => {
    loadCajas()
    loadResumenDiario()
  }, [])

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cajas</h1>
        <p className="text-muted-foreground">Gestiona las cajas diarias de La Cuerda Bebidas</p>
      </div>

      <motion.div className="grid gap-4 md:grid-cols-3" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Órdenes de Compra</CardTitle><div className="rounded-full bg-blue-100 p-2 text-blue-500"><Receipt className="h-4 w-4" /></div></CardHeader><CardContent><div className="text-2xl font-bold">${resumenDiario.totalOrdenesCompra.toLocaleString('es-AR')}</div><p className="text-xs text-muted-foreground">Recaudado hoy</p></CardContent></Card>
        </motion.div>
        <motion.div variants={item}>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Facturas Electrónicas B</CardTitle><div className="rounded-full bg-purple-100 p-2 text-purple-500"><CreditCard className="h-4 w-4" /></div></CardHeader><CardContent><div className="text-2xl font-bold">${resumenDiario.totalFacturasB.toLocaleString('es-AR')}</div><p className="text-xs text-muted-foreground">Recaudado hoy</p></CardContent></Card>
        </motion.div>
        <motion.div variants={item}>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total del Día</CardTitle><div className="rounded-full bg-green-100 p-2 text-green-500"><DollarSign className="h-4 w-4" /></div></CardHeader><CardContent><div className="text-2xl font-bold">${resumenDiario.totalDia.toLocaleString('es-AR')}</div><p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><ArrowUpRight className="h-3 w-3 text-green-500" /><span>Pendiente de cierre</span></p></CardContent></Card>
        </motion.div>
      </motion.div>

      <div className="flex justify-end">
        {/* Botón visualmente habilitado siempre */}
        <Button onClick={() => setIsAlertOpen(true)} disabled={resumenDiario.totalDia === 0}>
          Cerrar Caja
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Historial de Cajas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Fecha</TableHead><TableHead>Total Recaudado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {cajas.map((caja) => (
                    <TableRow key={caja.id}>
                      <TableCell className="font-medium">{caja.id}</TableCell>
                      {/* Ajuste: Usamos caja.fecha (string YYYY-MM-DD) y le agregamos hora para que JS no reste un día por timezone */}
                      <TableCell>{new Date(caja.fecha + "T00:00:00").toLocaleDateString('es-AR')}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${Number(caja.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                      </TableCell>
                      <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleVerDetalle(caja)}>Ver Detalle</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalle de Caja</DialogTitle>
            {selectedCaja && <DialogDescription>Caja del día {new Date(selectedCaja.fecha + "T00:00:00").toLocaleDateString('es-AR')}</DialogDescription>}
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isDetalleLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : selectedCaja && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg"><span className="font-medium">Total Recaudado:</span><span className="font-bold text-green-600">${Number(selectedCaja.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span></div>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Ventas Incluidas</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {ventasCaja.length > 0 ? (
                      ventasCaja.map((venta) => (
                        <AccordionItem key={venta.id} value={`venta-${venta.id}`}>
                          <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4 text-sm">
                              <span>Venta #{venta.id} - {venta.tipo_venta?.descripcion || 'Venta'}</span>
                              <span>{venta.hora} - ${Number(venta.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableHeader><TableRow><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Subtotal</TableHead></TableRow></TableHeader>
                              <TableBody>
                                {venta.venta_detalle.map((detalle: any) => (
                                  <TableRow key={detalle.id || Math.random()}>
                                    <TableCell>{detalle.producto?.nombre || 'Producto no disponible'}</TableCell>
                                    <TableCell>{detalle.cantidad}</TableCell>
                                    <TableCell>${Number(detalle.subtotal).toLocaleString('es-AR')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No hay ventas registradas en esta caja.</p>
                    )}
                  </Accordion>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar caja del día?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción guardará el cierre con un total de ${resumenDiario.totalDia.toLocaleString('es-AR')}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleCerrarCaja}>Confirmar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}