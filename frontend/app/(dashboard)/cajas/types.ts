// frontend/app/cajas/types.ts

// Estructura de la tabla 'caja' en Supabase
export interface Caja {
  id: number;
  fecha: string; // YYYY-MM-DD
  total: number; // Numeric en BD -> number en JS
}

// Estructura para el resumen en pantalla (calculado en frontend)
export interface ResumenCaja {
  totalOrdenesCompra: number;
  totalFacturasB: number;
  totalDia: number;
  cantidadVentas?: number;
}

// Estructura para el detalle de productos dentro de una venta
export interface DetalleProducto {
  cantidad: number;
  subtotal: number;
  producto: {
    nombre: string;
    precio_lista: number;
  };
}

// Estructura compleja para el Acordeón del Modal (Venta + Detalles + Tipo)
export interface VentaConDetalles {
  id: number;
  fecha: string;
  hora: string;
  total: number;
  id_tipo_venta: number;
  tipo_venta?: {
    descripcion: string;
  };
  venta_detalle: DetalleProducto[];
}