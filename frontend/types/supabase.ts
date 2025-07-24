export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cajas: {
        Row: {
          id: number
          total_recaudado: number
          fecha_y_hora_cierre: string
        }
        Insert: {
          id?: number
          total_recaudado: number
          fecha_y_hora_cierre?: string
        }
        Update: {
          id?: number
          total_recaudado?: number
          fecha_y_hora_cierre?: string
        }
      }
      producto: {
        Row: {
          id: number
          nombre: string
          stock: number
          precio_lista: number
          utilidad_porcentual: number | null
          precio_final: number | null
          codigo_barras: string | null
        }
        Insert: {
          id?: number
          nombre: string
          stock: number
          precio_lista: number
          utilidad_porcentual?: number | null
          precio_final?: number | null
          codigo_barras?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          stock?: number
          precio_lista?: number
          utilidad_porcentual?: number | null
          precio_final?: number | null
          codigo_barras?: string | null
        }
      }
      ventas: {
        Row: {
          id: number
          importe_total: number
          id_caja: number | null
          tipo: "orden_compra" | "factura_b"
          estado: string
          fecha_y_hora: string
        }
        Insert: {
          id?: number
          importe_total: number
          id_caja?: number | null
          tipo: "orden_compra" | "factura_b"
          estado: string
          fecha_y_hora?: string
        }
        Update: {
          id?: number
          importe_total?: number
          id_caja?: number | null
          tipo?: "orden_compra" | "factura_b"
          estado?: string
          fecha_y_hora?: string
        }
      }
      venta_detalles: {
        Row: {
          id: number
          cantidad: number
          precio_unitario: number
          subtotal: number
          id_venta: number
          id_producto: number | null
        }
        Insert: {
          id?: number
          cantidad: number
          precio_unitario: number
          subtotal: number
          id_venta: number
          id_producto?: number | null
        }
        Update: {
          id?: number
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
          id_venta?: number
          id_producto?: number | null
        }
      }
    }
  }
}

