// frontend/app/ventas/types.ts

// Tipo que viene de la Base de Datos (Supabase)
export interface Venta {
  id: number;
  fecha: string;      // "2023-10-25"
  hora: string;       // "14:30:00"
  total: number;
  id_tipo_venta: number;
  id_caja: number;
  // Relación (Supabase la trae anidada)
  tipo_venta?: {
    descripcion: string;
  };
  // Detalles opcionales (para la vista de detalle)
  venta_detalle?: VentaDetalle[];
}

export interface VentaDetalle {
  id: number;
  cantidad: number;
  subtotal: number;
  producto: {
    nombre: string;
    codigo: string | null;
    precio_lista: number;
  };
}

// Tipo para el formulario de Nueva Venta
export interface DetalleVentaForm {
  lineItemId: number; // ID temporal para la UI
  id_producto: number | null;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  descuento_individual: number; // Mantenemos esto en UI aunque en BD se guarde el neto
  subtotal: number;
}

export interface NuevaVentaState {
  id_tipo_venta: number; // Usamos ID (1, 2, 3) en lugar de string
  detalles: DetalleVentaForm[];
  total: number;
}

// Tipo de producto simplificado para el buscador
export interface Producto {
  id: number;
  nombre: string;
  codigo: string | null;
  precio_lista: number; // El precio de venta
  stock: number;
}