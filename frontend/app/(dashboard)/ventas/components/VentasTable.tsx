"use client"

import { Venta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface VentasTableProps {
  ventas: Venta[]
  onView: (venta: Venta) => void
  onEdit: (venta: Venta) => void
  onDelete: (id: number) => void
  isLoading: boolean
}

export function VentasTable({ ventas, onView, onEdit, onDelete, isLoading }: VentasTableProps) {
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 border rounded-md bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ventas || ventas.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground border rounded-md bg-card">
            No hay ventas con esos filtros. Probá con otro día u horario.
        </div>
    )
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "";
    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  const formatearHora = (hora: string) => {
    if (!hora) return "";
    return hora.substring(0, 5);
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Comprobante</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-12"><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {ventas.map((venta) => {
              const v = venta as any
              // Estado fiscal con texto + forma (no solo color)
              const comprobante =
                v.estado_fiscal === "autorizada" ? { txt: `${v.tipo_comprobante} ${v.nro_comprobante}`, cls: "border-foreground bg-foreground text-white" }
                : v.estado_fiscal === "error" ? { txt: "Factura con error", cls: "border-destructive text-destructive" }
                : v.estado_fiscal === "pendiente" || v.estado_fiscal === "procesando" ? { txt: "Factura pendiente", cls: "border-dashed border-foreground/60" }
                : { txt: "Sin factura", cls: "border-foreground/30 text-muted-foreground" };

              return (
                <tr
                  key={venta.id}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onView(venta)}
                >
                  <TableCell className="font-medium">
                    {formatearFecha(venta.fecha)}
                  </TableCell>
                  
                  <TableCell>
                     {formatearHora(venta.hora)}
                  </TableCell>
                  
                  <TableCell>
                     <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${comprobante.cls}`}>
                        {comprobante.txt}
                      </span>
                  </TableCell>
                  
                  <TableCell className="text-right font-semibold">
                    ${Number(venta.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); onDelete(venta.id); }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Eliminar venta #${venta.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </tr>
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
}