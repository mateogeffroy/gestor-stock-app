import { supabase } from "@/lib/supabase"
import type { ProductoKpi, Rango, VentaKpi } from "@/lib/kpis"

const PAGINA = 1000 // límite de filas por request de Supabase (PostgREST max-rows)

// ponytail: agrega en el navegador; con decenas de miles de ventas por período conviene
// mover el cálculo a una vista/función SQL (o al backend propio) y traer solo los totales.
async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: any }>) {
  const filas: T[] = []
  for (let i = 0; ; i += PAGINA) {
    const { data, error } = await consulta(i, i + PAGINA - 1)
    if (error) throw error
    filas.push(...(data ?? []))
    if (!data || data.length < PAGINA) return filas
  }
}

export const kpiService = {
  ventas: (r: Rango) =>
    todas<VentaKpi>((a, b) =>
      supabase
        .from("venta")
        .select("fecha, hora, total, id_tipo_venta, cae, venta_detalle(id_producto, descripcion, cantidad, subtotal)")
        .gte("fecha", r.desde)
        .lte("fecha", r.hasta)
        .order("id")
        .range(a, b)
    ),

  productos: () =>
    todas<ProductoKpi>((a, b) =>
      supabase.from("producto").select("id, nombre, precio_costo, stock").eq("activo", true).order("id").range(a, b)
    ),
}
