import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type Venta = Database["public"]["Tables"]["ventas"]["Row"]
export type VentaInsert = Database["public"]["Tables"]["ventas"]["Insert"]
export type VentaDetalle = Database["public"]["Tables"]["venta_detalles"]["Row"]
export type VentaDetalleInsert = Database["public"]["Tables"]["venta_detalles"]["Insert"]

export interface VentaCompleta extends Venta {
  detalles: VentaDetalle[]
}

export interface VentaCompletaInsert extends Omit<VentaInsert, "id"> {
  detalles: Omit<VentaDetalleInsert, "id" | "id_venta">[]
}

export const ventaService = {
  async getUltimasVentas(limit = 5) {
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .order("fecha_y_hora", { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  },

  async getVentaById(id: number): Promise<VentaCompleta | null> {
    // Obtener la venta
    const { data: venta, error: ventaError } = await supabase.from("ventas").select("*").eq("id", id).single()

    if (ventaError) throw ventaError
    if (!venta) return null

    // Obtener los detalles de la venta
    const { data: detalles, error: detallesError } = await supabase
      .from("venta_detalles")
      .select("*, producto(*)")
      .eq("id_venta", id)

    if (detallesError) throw detallesError

    return {
      ...venta,
      detalles: detalles || [],
    }
  },

  async createVenta(venta: VentaCompletaInsert) {
    // Iniciar una transacción
    const { data: nuevaVenta, error: ventaError } = await supabase
      .from("ventas")
      .insert({
        importe_total: venta.importe_total,
        tipo: venta.tipo,
        estado: venta.estado,
        fecha_y_hora: new Date().toISOString(),
      })
      .select()
      .single()

    if (ventaError) throw ventaError

    // Insertar los detalles de la venta
    const detallesConVentaId = venta.detalles.map((detalle) => ({
      ...detalle,
      id_venta: nuevaVenta.id,
    }))

    const { error: detallesError } = await supabase.from("venta_detalles").insert(detallesConVentaId)

    if (detallesError) throw detallesError

    // Actualizar el stock de los productos
    for (const detalle of venta.detalles) {
      if (detalle.id_producto) {
        const { error: stockError } = await supabase.rpc("actualizar_stock", {
          p_id_producto: detalle.id_producto,
          p_cantidad: detalle.cantidad,
        })

        if (stockError) throw stockError
      }
    }

    return nuevaVenta
  },
  
  async deleteVenta(id: number) {
    // Primero eliminamos los detalles de la venta
    const { error: detallesError } = await supabase.from("venta_detalles").delete().eq("id_venta", id)
    if (detallesError) throw detallesError
    
    // Luego eliminamos la venta
    const { error: ventaError } = await supabase.from("ventas").delete().eq("id", id)
    if (ventaError) throw ventaError
    
    return true
  },

  async updateVenta(id: number, venta: VentaCompletaInsert) {
    // Actualizar la venta principal
    const { error: ventaError } = await supabase
      .from("ventas")
      .update({
        importe_total: venta.importe_total,
        tipo: venta.tipo,
        estado: venta.estado,
      })
      .eq("id", id)
  
    if (ventaError) throw ventaError
  
    // Obtener los detalles actuales de la venta
    const { data: detallesActuales, error: detallesError } = await supabase
      .from("venta_detalles")
      .select("*")
      .eq("id_venta", id)
  
    if (detallesError) throw detallesError
  
    // Mapear IDs de los detalles actuales
    const detallesActualesIds = detallesActuales?.map(d => d.id) || []
  
    // Detalles nuevos o modificados
    const nuevosDetalles = venta.detalles.filter(d => !d.id || !detallesActualesIds.includes(d.id))
    const detallesModificados = venta.detalles.filter(d => d.id && detallesActualesIds.includes(d.id))
  
    // Insertar nuevos detalles
    if (nuevosDetalles.length > 0) {
      const { error: insertError } = await supabase.from("venta_detalles").insert(
        nuevosDetalles.map(detalle => ({
          ...detalle,
          id_venta: id,
        }))
      )
      if (insertError) throw insertError
    }
  
    // Actualizar detalles modificados
    for (const detalle of detallesModificados) {
      const { error: updateError } = await supabase
        .from("venta_detalles")
        .update(detalle)
        .eq("id", detalle.id)
      if (updateError) throw updateError
    }
  
    // Eliminar detalles que ya no están en la venta
    const idsDetallesNuevos = venta.detalles.map(d => d.id).filter(id => id !== undefined)
    const detallesAEliminar = detallesActualesIds.filter(id => !idsDetallesNuevos.includes(id))
  
    if (detallesAEliminar.length > 0) {
      const { error: deleteError } = await supabase
        .from("venta_detalles")
        .delete()
        .in("id", detallesAEliminar)
      if (deleteError) throw deleteError
    }
  
    // Actualizar stock de los productos afectados
    for (const detalle of venta.detalles) {
      if (detalle.id_producto) {
        const { error: stockError } = await supabase.rpc("actualizar_stock", {
          p_id_producto: detalle.id_producto,
          p_cantidad: detalle.cantidad,
        })
        if (stockError) throw stockError
      }
    }
  
    return true
  }  
}