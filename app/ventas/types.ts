export interface Venta {
    id: number
    fecha_y_hora: string
    tipo: string
    importe_total: number
    estado: string
    detalles: DetalleVenta[]
  }
  
  export interface DetalleVenta {
    id?: number
    id_producto: number | null
    nombre_producto?: string
    precio_unitario: number
    cantidad: number
    descuento: number
    subtotal: number
    esNuevo?: boolean
  }
  
  export interface VentaCompletaInsert {
    importe_total: number
    tipo: string
    estado: string
    detalles: Omit<DetalleVenta, 'esNuevo'>[]
  }
  
  export interface NuevaVentaState {
    tipo: string
    descuento_general: number
    detalles: DetalleVenta[]
  }