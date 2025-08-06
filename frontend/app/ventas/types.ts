// frontend/app/ventas/types.ts

export interface Producto {
    id: number;
    nombre: string;
    stock: number;
    precio_lista: string;
    utilidad_porcentual: string | null;
    precio_final: string | null;
    codigo_barras: string | null;
}

export interface DetalleVenta {
    id: number;
    producto: Producto;
    cantidad: number;
    precio_unitario: string;
    // Agregamos el nuevo campo de descuento que viene del backend
    descuento_individual: string;
    subtotal: string;
}

export interface Venta {
    id: number;
    importe_total: string;
    fecha_y_hora: string;
    tipo: 'orden_compra' | 'factura_b';
    estado: string;
    descuento_general: string;
    caja: number | null;
    detalles: DetalleVenta[];
}

export interface DetalleVentaForm {
  // --- INICIO DEL CAMBIO ---
  // Añadimos un ID único para cada línea del formulario, para usarlo como 'key' en React.
  lineItemId: number; 
  // --- FIN DEL CAMBIO ---
  id_producto: number | null;
  nombre_producto?: string;
  precio_unitario: number;
  cantidad: number;
  descuento_individual: number; 
  subtotal: number;
  esNuevo?: boolean; 
}

export interface NuevaVentaState {
  tipo: 'orden_compra' | 'factura_b';
  descuento_general: number;
  detalles: DetalleVentaForm[];
}