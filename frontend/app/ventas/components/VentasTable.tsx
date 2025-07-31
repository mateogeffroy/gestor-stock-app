"use client"

import { Venta } from "../types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
// --- 1. Importamos el ícono del ojo ---
import { Edit, Trash2, Eye, Loader2 } from "lucide-react" 
import { motion, AnimatePresence } from "framer-motion"

interface VentasTableProps {
  ventas: Venta[]
  // --- 2. Agregamos la nueva propiedad para el evento de clic ---
  onView: (venta: Venta) => void
  onEdit: (venta: Venta) => void
  onDelete: (id: number) => void
  isLoading: boolean
}

// --- 3. Actualizamos la desestructuración de props ---
export function VentasTable({ ventas, onView, onEdit, onDelete, isLoading }: VentasTableProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Completada": return "bg-green-100 text-green-800"
      case "Pendiente": return "bg-yellow-100 text-yellow-800"
      case "Cancelada": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
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
                <TableCell>{new Date(venta.fecha_y_hora).toLocaleString('es-AR')}</TableCell>
                <TableCell>
                  {venta.tipo === "orden_compra" ? "Orden de compra" : 
                   venta.tipo === "factura_b" ? "Factura electrónica B" : venta.tipo}
                </TableCell>
                <TableCell>${Number(venta.importe_total).toLocaleString('es-AR', {minimumFractionDigits: 2})}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(venta.estado)}`}>
                    {venta.estado}
                  </span>
                </TableCell>
                <TableCell className="text-right flex gap-1 justify-end">
                  {/* --- 4. Agregamos el nuevo botón de "Ver Detalle" --- */}
                  <Button variant="ghost" size="icon" onClick={() => onView(venta)}>
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(venta)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(venta.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  )
}