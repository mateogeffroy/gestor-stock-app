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

// --- INICIO DEL CAMBIO ---
// Tipos para el estado del formulario en el cliente
export interface DetalleVentaForm {
    id_producto: number | null;
    nombre_producto?: string;
    precio_unitario: number;
    cantidad: number;
    // Agregamos el descuento individual al estado del formulario
    descuento_individual: number; 
    subtotal: number;
    // El campo 'esNuevo' es solo para la lógica del UI, no se envía al backend
    esNuevo?: boolean; 
}

export interface NuevaVentaState {
    tipo: 'orden_compra' | 'factura_b';
    descuento_general: number;
    detalles: DetalleVentaForm[];
}
// --- FIN DEL CAMBIO ---