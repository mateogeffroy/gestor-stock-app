"use client"

import { Venta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, Loader2 } from "lucide-react" 
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils" // Importamos cn para clases condicionales

interface VentasTableProps {
  ventas: Venta[]
  onView: (venta: Venta) => void
  onEdit: (venta: Venta) => void
  onDelete: (id: number) => void
  isLoading: boolean
}

export function VentasTable({ ventas, onView, onEdit, onDelete, isLoading }: VentasTableProps) {
  const getEstadoInfo = (estado: string) => {
    switch (estado) {
      case "pendiente": 
        return {
          label: "Pendiente",
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
        };
      case "cerrada": 
        return {
          label: "Cerrada",
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
        };
      default: 
        return {
          label: estado.charAt(0).toUpperCase() + estado.slice(1), // Capitalizamos el estado
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
        };
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {ventas.map((venta) => {
              const estadoInfo = getEstadoInfo(venta.estado);
              const isCerrada = venta.estado === 'cerrada';

              return (
                <motion.tr
                  key={venta.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b"
                >
                  <TableCell className="font-medium">{venta.id}</TableCell>
                  <TableCell>{new Date(venta.fecha_y_hora).toLocaleString('es-AR')}</TableCell>
                  <TableCell>
                    {venta.tipo === "orden_compra" ? "Orden de compra" : 
                     venta.tipo === "factura_b" ? "Factura electrónica B" : venta.tipo}
                  </TableCell>
                  <TableCell>${Number(venta.importe_total).toLocaleString('es-AR', {minimumFractionDigits: 2})}</TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", estadoInfo.color)}>
                      {estadoInfo.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onView(venta)}>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(venta)}
                      disabled={isCerrada} // Deshabilitamos el botón si la venta está cerrada
                    >
                      <Edit className={cn("h-4 w-4", isCerrada && "text-muted-foreground")} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(venta.id)}
                      disabled={isCerrada} // Deshabilitamos el botón si la venta está cerrada
                      className={cn("text-red-600 hover:text-red-800", isCerrada && "hover:bg-transparent")}
                    >
                      <Trash2 className={cn("h-4 w-4", isCerrada && "text-muted-foreground")} />
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