// frontend/app/cajas/types.ts

import { Venta } from "@/app/ventas/types"; // Reutilizamos el tipo Venta

// Define la estructura de una Caja que viene del backend
export interface Caja {
  id: number;
  total_recaudado: string; // Django envía los decimales como string
  fecha_y_hora_cierre: string;
}

// Define la estructura del resumen diario que viene del backend
export interface ResumenCaja {
  totalOrdenesCompra: number;
  totalFacturasB: number;
  totalDia: number;
}

// Define la estructura de una Venta con sus detalles para mostrarla en el diálogo
// Es similar al tipo Venta, pero nos aseguramos de que incluya los detalles
export interface VentaConDetalles extends Venta {
  // Ya está incluido en el tipo Venta, pero lo hacemos explícito
  detalles: any[]; // Puedes definir un tipo más estricto para DetalleVenta si lo deseas
}