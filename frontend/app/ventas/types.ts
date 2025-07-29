// frontend/app/ventas/types.ts

// Definimos aquí el tipo Producto para que el módulo sea independiente.
export interface Producto {
    id: number;
    nombre: string;
    stock: number;
    precio_lista: string;
    utilidad_porcentual: string;
    precio_final: string;
    codigo_barras: string;
}

// Este tipo representa un detalle de venta como llega desde Django
export interface DetalleVenta {
  id: number;
  producto: Producto; // El objeto producto completo
  cantidad: number;
  precio_unitario: string; // Django envía los decimales como string
  subtotal: string;
}

// Este tipo representa una venta como llega desde Django
export interface Venta {
  id: number;
  importe_total: string;
  fecha_y_hora: string;
  tipo: 'orden_compra' | 'factura_b';
  estado: string;
  descuento_general: string;
  redondeo: string;
  caja: number | null;
  detalles: DetalleVenta[];
}

// Estos tipos son para el formulario. Los mantenemos para la lógica interna del form.
export interface DetalleVentaForm {
  id_producto: number;
  nombre_producto?: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface NuevaVentaState {
  tipo: 'orden_compra' | 'factura_b';
  descuento_general: number;
  detalles: DetalleVentaForm[];
}