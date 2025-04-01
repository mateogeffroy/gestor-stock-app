import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type Caja = Database["public"]["Tables"]["cajas"]["Row"]
export type CajaInsert = Database["public"]["Tables"]["cajas"]["Insert"]

export interface ResumenCaja {
  totalOrdenesCompra: number
  totalFacturasB: number
  totalDia: number
}

export const cajaService = {
  async getUltimasCajas(limit = 5) {
    const { data, error } = await supabase
      .from("cajas")
      .select("*")
      .order("fecha_y_hora_cierre", { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  },

  async getCajaById(id: number) {
    const { data, error } = await supabase.from("cajas").select("*").eq("id", id).single()

    if (error) throw error

    return data
  },

  async getVentasPorCaja(idCaja: number) {
    const { data, error } = await supabase.from("ventas").select("*").eq("id_caja", idCaja)

    if (error) throw error

    return data || []
  },

  async getResumenDiario(): Promise<ResumenCaja> {
    const fechaHoy = new Date().toISOString().split("T")[0]

    // Obtener total de órdenes de compra del día
    const { data: ordenesCompra, error: errorOC } = await supabase
      .from("ventas")
      .select("importe_total")
      .eq("tipo", "orden_compra") // Cambiado de 'Orden de compra' a 'orden_compra'
      .gte("fecha_y_hora", `${fechaHoy}T00:00:00`)
      .lte("fecha_y_hora", `${fechaHoy}T23:59:59`)
      .is("id_caja", null)

    if (errorOC) throw errorOC

    // Obtener total de facturas B del día
    const { data: facturasB, error: errorFB } = await supabase
      .from("ventas")
      .select("importe_total")
      .eq("tipo", "factura_b") // Cambiado de 'Factura electrónica B' a 'factura_b'
      .gte("fecha_y_hora", `${fechaHoy}T00:00:00`)
      .lte("fecha_y_hora", `${fechaHoy}T23:59:59`)
      .is("id_caja", null)

    if (errorFB) throw errorFB

    const totalOrdenesCompra = ordenesCompra?.reduce((sum, venta) => sum + venta.importe_total, 0) || 0
    const totalFacturasB = facturasB?.reduce((sum, venta) => sum + venta.importe_total, 0) || 0

    return {
      totalOrdenesCompra,
      totalFacturasB,
      totalDia: totalOrdenesCompra + totalFacturasB,
    }
  },

  async cerrarCaja() {
    const fechaHoy = new Date().toISOString().split("T")[0]

    // Obtener todas las ventas del día sin id_caja
    const { data: ventasDelDia, error: errorVentas } = await supabase
      .from("ventas")
      .select("id, importe_total")
      .gte("fecha_y_hora", `${fechaHoy}T00:00:00`)
      .lte("fecha_y_hora", `${fechaHoy}T23:59:59`)
      .is("id_caja", null)

    if (errorVentas) throw errorVentas

    const totalRecaudado = ventasDelDia?.reduce((sum, venta) => sum + venta.importe_total, 0) || 0

    // Crear la nueva caja
    const { data: nuevaCaja, error: errorCaja } = await supabase
      .from("cajas")
      .insert({
        total_recaudado: totalRecaudado,
        fecha_y_hora_cierre: new Date().toISOString(),
      })
      .select()
      .single()

    if (errorCaja) throw errorCaja

    // Actualizar las ventas con el id de la caja
    if (ventasDelDia && ventasDelDia.length > 0) {
      const ventasIds = ventasDelDia.map((venta) => venta.id)

      const { error: errorUpdate } = await supabase.from("ventas").update({ id_caja: nuevaCaja.id }).in("id", ventasIds)

      if (errorUpdate) throw errorUpdate
    }

    return nuevaCaja
  },
}

