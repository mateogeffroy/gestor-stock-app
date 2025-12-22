"use client"

import { Venta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Eye, Loader2 } from "lucide-react" 
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ventas || ventas.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
            No hay ventas registradas.
        </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {ventas.map((venta) => {
              const tipoDescripcion = venta.tipo_venta?.descripcion || "Venta General";

              return (
                <motion.tr
                  key={venta.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  // CAMBIO 1: Cursor pointer y evento click en toda la fila
                  className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onView(venta)}
                >
                  <TableCell className="font-medium">{venta.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{venta.fecha}</span>
                        <span className="text-xs text-muted-foreground">{venta.hora}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {tipoDescripcion}
                     </span>
                  </TableCell>
                  <TableCell className="font-bold text-green-700">
                    ${Number(venta.total).toLocaleString('es-AR', {minimumFractionDigits: 2})}
                  </TableCell>
                  <TableCell className="text-right flex gap-1 justify-end">
                    {/* CAMBIO 2: stopPropagation para que el click en el botón no abra el modal dos veces */}
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onView(venta); }} title="Ver detalle">
                      <Eye className="h-4 w-4 text-blue-500" />
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