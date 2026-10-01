"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
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

  const loadResumenDiario = async () => {
  try {
    const cajaHoy = await cajaService.obtenerCajaAbierta();
    
    if (cajaHoy) {
      setCajaDelDiaId(cajaHoy.id);
      const data = await cajaService.getResumenDiario(cajaHoy.id);
      setResumenDiario(data);
    } else {
      // Si no hay caja abierta, reseteamos los contadores a 0
      setCajaDelDiaId(null);
      setResumenDiario({ totalOrdenesCompra: 0, totalFacturasB: 0, totalDia: 0 });
    }
  } catch (error) {
    console.error("Error al cargar resumen diario:", error);
  }
};

  // 3. Efecto de carga inicial
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await loadCajas(); // Primero cargamos el historial
      await loadResumenDiario(); // Luego el resumen
      setIsLoading(false);
    };
    initializeData();
  }, []);

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
      toast({ title: "Caja cerrada", description: money(resumenDiario.totalDia) })
      
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

  const money = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  const fecha = (f: string) => new Date(f + "T00:00:00").toLocaleDateString('es-AR')

  return (
    <div className="space-y-8">
      <h1 className="page-title">Cajas</h1>

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
        <section className="order-2 lg:order-1 min-w-0">
          <h2 className="mb-3 text-lg font-semibold">Cierres anteriores</h2>
          <div className="rounded-md border bg-card overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : cajas.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Cuando cierres tu primera caja, va a aparecer acá.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Caja</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Recaudado</TableHead><TableHead className="w-28"><span className="sr-only">Acciones</span></TableHead></TableRow></TableHeader>
                <TableBody>
                  {cajas.map((caja) => (
                    <TableRow key={caja.id}>
                      <TableCell className="text-muted-foreground">#{caja.id}</TableCell>
                      <TableCell>{fecha(caja.fecha)}</TableCell>
                      <TableCell className="text-right font-semibold">{money(caja.total)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleVerDetalle(caja)}>Ver ventas</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        <section className="order-1 lg:order-2 lg:sticky lg:top-6">
          <h2 className="mb-3 text-lg font-semibold">Caja de hoy</h2>
          <div className="ticket rounded-t-md border border-b-0 px-5 pt-5 space-y-3">
            {cajaDelDiaId ? (
              <p className="text-sm text-muted-foreground">Caja #{cajaDelDiaId} abierta</p>
            ) : (
              <p className="text-sm text-muted-foreground">No hay caja abierta. Se abre sola con la primera venta.</p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>Con factura</dt><dd>{money(resumenDiario.totalFacturasB)}</dd></div>
              <div className="flex justify-between"><dt>Sin factura</dt><dd>{money(resumenDiario.totalOrdenesCompra)}</dd></div>
            </dl>
            <dl className="ticket-rule space-y-2 pt-3 text-sm">
              {Object.entries(resumenDiario.porMedio ?? {}).map(([m, t]) => (
                <div key={m} className="flex justify-between">
                  <dt>{({ efectivo: "Efectivo en caja", debito: "Débito", credito: "Crédito", transferencia: "Transferencia", qr: "QR", otro: "Otro", sin_dato: "Sin medio cargado" } as Record<string, string>)[m] ?? m}</dt>
                  <dd>{money(t)}</dd>
                </div>
              ))}
            </dl>
            <div className="ticket-rule pt-3">
              <p className="text-sm text-muted-foreground">Total del día</p>
              <p className="font-display text-5xl font-bold leading-tight break-all">{money(resumenDiario.totalDia)}</p>
            </div>
            <Button onClick={() => setIsAlertOpen(true)} disabled={resumenDiario.totalDia === 0} size="lg" className="w-full font-semibold">
              Cerrar caja
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-bold">Caja #{selectedCaja?.id}</DialogTitle>
            {selectedCaja && <DialogDescription>{fecha(selectedCaja.fecha)}</DialogDescription>}
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isDetalleLoading ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : selectedCaja && (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline"><span className="text-muted-foreground">Recaudado</span><span className="font-display text-3xl font-bold">{money(selectedCaja.total)}</span></div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Ventas</h3>
                  <Accordion type="single" collapsible className="w-full">
                    {ventasCaja.length > 0 ? (
                      ventasCaja.map((venta) => (
                        <AccordionItem key={venta.id} value={`venta-${venta.id}`}>
                          <AccordionTrigger>
                            <div className="flex justify-between w-full pr-4 text-sm">
                              <span>#{venta.id} <span className="text-muted-foreground">{venta.tipo_venta?.descripcion || 'Venta'}</span></span>
                              <span><span className="text-muted-foreground">{venta.hora?.substring(0, 5)}</span> <span className="ml-3 font-semibold">{money(venta.total)}</span></span>
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
                      <p className="text-muted-foreground text-sm">Esta caja no tiene ventas.</p>
                    )}
                  </Accordion>
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>Listo</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la caja de hoy?</AlertDialogTitle>
            <AlertDialogDescription>Se guarda el cierre por {money(resumenDiario.totalDia)}. Después no vas a poder borrar ventas de esta caja.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleCerrarCaja}>Cerrar caja</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}