"use client"

import { useState, useEffect } from "react"
import { Venta } from "../types"
import { ventaService } from "@/services/venta-service"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Check, X, Loader2, Printer, FileText, Calendar, ShieldCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// --- IMPORTS NUEVOS PARA PDF Y CONTEXTO ---
import { generateInvoicePDF } from "@/lib/pdf-generator"
import { useBusiness } from "@/context/business-context"

interface VentaDetalleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: Venta | null
  onVentaUpdated?: () => void
}

export function VentaDetalleDialog({
  open,
  onOpenChange,
  venta,
  onVentaUpdated
}: VentaDetalleDialogProps) {
  const { toast } = useToast()
  
  // 1. Obtenemos los datos globales del negocio para el PDF
  const { businessName, logoUrl } = useBusiness()

  const [isEditingType, setIsEditingType] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string>("1")
  const [isSaving, setIsSaving] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Reiniciar estado al abrir/cambiar venta
  useEffect(() => {
    if (venta) {
      setSelectedTipo(String(venta.id_tipo_venta || "1"))
      setIsEditingType(false)
    }
  }, [venta, open])

  if (!venta) return null

  // Casteamos a 'any' para acceder a propiedades fiscales sin errores de TS si no actualizaste el type
  const v = venta as any; 
  const tieneFactura = !!v.cae; // Verificamos si tiene CAE

  // --- ACTUALIZAR TIPO DE VENTA (Solo si no es fiscal) ---
  const handleSaveTipo = async () => {
    setIsSaving(true)
    try {
      await ventaService.updateTipoVenta(venta.id, Number(selectedTipo))
      toast({ title: "Actualizado", description: "Tipo de venta modificado correctamente." })
      setIsEditingType(false)
      if (onVentaUpdated) onVentaUpdated() 
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "No se pudo actualizar el tipo.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  // --- GENERAR PDF ---
  const handlePrint = async () => {
    if (!venta) return;
    
    setIsPrinting(true);
    try {
       // Preparamos los datos de tu empresa para la factura
       const businessData = {
           name: businessName || "Mi Negocio",
           cuit: "20-12345678-9", // Puedes traerlo del contexto a futuro
           logoUrl: logoUrl, // URL del logo que subiste a Supabase
           address: "Dirección Comercial" // Puedes parametrizarlo luego
       };

       // Llamamos a la utilidad que crea el PDF
       await generateInvoicePDF(v, businessData);
       
       toast({ title: "PDF Generado", description: "La descarga ha comenzado." });
    } catch (error) {
       console.error("Error PDF:", error);
       toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" });
    } finally {
       setIsPrinting(false);
    }
 }

  const tipoDescripcion = venta.tipo_venta?.descripcion || "Orden de Compra";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
              <div>
                  <DialogTitle className="text-xl">Venta #{venta.id}</DialogTitle>
                  <DialogDescription>
                    Realizada el {venta.fecha} a las {venta.hora}
                  </DialogDescription>
              </div>
              {/* Badges de estado */}
              <div className="flex gap-2">
                 {tieneFactura ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 border border-green-200">
                        <ShieldCheck className="w-3 h-3" /> Fiscal (AFIP)
                    </span>
                 ) : (
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium border border-slate-200">
                        Interna
                    </span>
                 )}
              </div>
          </div>
        </DialogHeader>

        {/* 1. SECCIÓN DE DATOS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {/* Bloque Izquierdo: Datos Internos */}
            <div className="bg-muted/20 p-4 rounded-lg space-y-3 text-sm">
                <div className="flex items-center justify-between h-8">
                    <span className="font-semibold text-muted-foreground">Tipo de Venta:</span>
                    
                    {/* Solo permitimos editar si NO tiene factura fiscal */}
                    {isEditingType && !tieneFactura ? (
                    <div className="flex items-center gap-2">
                        <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Orden de Compra</SelectItem>
                            <SelectItem value="2">Factura B</SelectItem>
                        </SelectContent>
                        </Select>
                        <Button size="icon" className="h-8 w-8" onClick={handleSaveTipo} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditingType(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    ) : (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{tieneFactura ? v.tipo_comprobante : tipoDescripcion}</span>
                        {!tieneFactura && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setIsEditingType(true)}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Caja ID:</span> 
                    <span>#{venta.id_caja}</span>
                </div>
            </div>

            {/* Bloque Derecho: DATOS FISCALES (Nuevo) */}
            {tieneFactura ? (
                <div className="bg-green-50 border border-green-100 p-4 rounded-lg space-y-3 text-sm">
                     <h4 className="font-semibold text-green-800 flex items-center gap-2 border-b border-green-200 pb-1 mb-2">
                        <FileText className="h-4 w-4"/> Datos de Facturación
                     </h4>
                     
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs text-green-700">Comprobante</p>
                            <p className="font-medium text-green-900">{v.nro_comprobante}</p>
                        </div>
                        <div>
                            <p className="text-xs text-green-700">CAE</p>
                            <p className="font-medium text-green-900 font-mono">{v.cae}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-green-600"/>
                            <p className="text-xs text-green-700">
                                Vencimiento CAE: <span className="font-medium">{v.vto_cae}</span>
                            </p>
                        </div>
                     </div>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground text-sm">
                    <p>Esta venta no tiene comprobante fiscal asociado.</p>
                </div>
            )}
        </div>

        {/* 2. TABLA DE PRODUCTOS */}
        <div className="border rounded-md mt-2 max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio U.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.venta_detalle?.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="font-medium">
                    {(detalle as any).descripcion || detalle.producto?.nombre || "Producto eliminado"}
                  </TableCell>
                  <TableCell>
                    {detalle.producto?.codigo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {detalle.cantidad}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${Number((detalle as any).precio_unitario || detalle.producto?.precio_lista || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${Number(detalle.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 3. TOTALES Y ACCIONES */}
        <DialogFooter className="flex sm:justify-between items-center mt-4 border-t pt-4">
             <div className="flex gap-2">
                 {/* BOTÓN DE IMPRIMIR */}
                 <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
                    {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                    Imprimir Comprobante
                 </Button>
             </div>

             <div className="text-3xl font-bold">
                Total: ${Number(venta.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
             </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}