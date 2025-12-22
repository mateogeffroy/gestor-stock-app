// frontend/app/ventas/types.ts

// Tipo que viene de la Base de Datos (Supabase)
export interface Venta {
  id: number;
  fecha: string;
  hora: string;
  total: number;
  id_tipo_venta: number;
  id_caja: number;
  tipo_venta?: { descripcion: string };
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
  lineItemId: number; // ID único para la fila (UI)
  id_producto: number | null; // Null si es un item agregado manualmente
  nombre_producto: string;
  codigo?: string | null; // Agregamos código para referencia visual
  precio_unitario: number;
  cantidad: number;
  descuento_individual: number; // Porcentaje (0-100)
  subtotal: number;
}

export interface NuevaVentaState {
  id_tipo_venta: number;
  detalles: DetalleVentaForm[];
  total: number;
}

export interface Producto {
  id: number;
  nombre: string;
  codigo: string | null;
  precio_lista: number;
  stock: number;
  // Agregamos precio_final opcional por si el backend lo manda calculado
  precio_final?: number; 
}