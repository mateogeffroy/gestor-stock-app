// app/ventas/types.ts (Versión Adaptada)

import { Producto } from "@/services/producto-service"; // Reutilizamos el tipo Producto

// Este tipo representa un detalle de venta como llega desde Django
export interface DetalleVenta {
  id: number;
  producto: Producto; // El objeto producto completo
  id_producto: number;
  cantidad: number;
  precio_unitario: string; // Django envía los decimales como string
  subtotal: string;
}

// Este tipo representa una venta como llega desde Django
export interface Venta {
  id: number;
  importe_total: string;
  fecha_y_hora: string;
  tipo: string;
  estado: string;
  descuento_general: string;
  redondeo: string;
  caja: number | null;
  detalles: DetalleVenta[];
}

// Estos tipos son para el formulario y la creación, los mantenemos como estaban
// pero nos aseguramos que sean compatibles.
export interface DetalleVentaForm {
  id_producto: number | null;
  nombre_producto?: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  esNuevo?: boolean;
}

export interface NuevaVentaState {
  tipo: string;
  descuento_general: number;
  detalles: DetalleVentaForm[];
}