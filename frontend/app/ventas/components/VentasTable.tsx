"use client"

import { Venta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil, Loader2 } from "lucide-react" 
import { motion, AnimatePresence } from "framer-motion"

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
      <div className="flex justify-center items-center py-12 border rounded-md bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ventas || ventas.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground border rounded-md bg-white">
            No hay ventas registradas que coincidan con la búsqueda.
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
    // Quitamos bordes extra si quieres un look más limpio, o los dejamos sutiles
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {/* CAMBIO 1: Columnas separadas */}
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {ventas.map((venta) => {
              const tipoDescripcion = venta.tipo_venta?.descripcion || "Venta General";
              const esOrdenCompra = tipoDescripcion === "Orden de compra";
              
              const badgeColorClass = esOrdenCompra 
                ? "bg-green-50 text-green-700 ring-green-600/20" 
                : "bg-blue-50 text-blue-700 ring-blue-700/10";

              return (
                <motion.tr
                  key={venta.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onView(venta)}
                >
                  {/* CAMBIO 1: Celdas separadas */}
                  <TableCell className="font-medium">
                    {formatearFecha(venta.fecha)}
                  </TableCell>
                  
                  <TableCell>
                     {formatearHora(venta.hora)}
                  </TableCell>
                  
                  <TableCell>
                     <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeColorClass}`}>
                        {tipoDescripcion}
                      </span>
                  </TableCell>
                  
                  <TableCell className="font-bold">
                    ${Number(venta.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </TableCell>
                  
                  <TableCell className="text-right flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(venta); }} title="Ver/Editar detalle">
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.stopPropagation(); onDelete(venta.id); }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      title="Eliminar venta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
}