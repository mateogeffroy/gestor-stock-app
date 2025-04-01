import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

export type Producto = Database["public"]["Tables"]["producto"]["Row"]
export type ProductoInsert = Database["public"]["Tables"]["producto"]["Insert"]
export type ProductoUpdate = Database["public"]["Tables"]["producto"]["Update"]

export const productoService = {
  async getProductos(page = 1, pageSize = 5, searchTerm = "") {
    const startIndex = (page - 1) * pageSize

    let query = supabase.from("producto").select("*", { count: "exact" }).order("nombre", { ascending: true })

    if (searchTerm) {
      // Convertir el término de búsqueda a minúsculas para la comparación
      const searchTermLower = searchTerm.toLowerCase()

      // Usar ilike para búsqueda insensible a mayúsculas/minúsculas
      query = query.or(`nombre.ilike.%${searchTermLower}%,codigo_barras.ilike.%${searchTermLower}%`)

      // Si el término de búsqueda es un número, también buscar por ID
      if (!isNaN(Number.parseInt(searchTerm))) {
        query = query.or(`id.eq.${Number.parseInt(searchTerm)}`)
      }
    }

    // Aplicar paginación después de la búsqueda
    const { data, error, count } = await query.range(startIndex, startIndex + pageSize - 1)

    if (error) throw error

    return {
      productos: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    }
  },

  async getProductoById(id: number) {
    const { data, error } = await supabase.from("producto").select("*").eq("id", id).single()

    if (error) throw error

    return data
  },

  async searchProductos(searchTerm: string) {
    // Convertir el término de búsqueda a minúsculas para la comparación
    const searchTermLower = searchTerm.toLowerCase()

    let query = supabase.from("producto").select("*")

    // Usar ilike para búsqueda insensible a mayúsculas/minúsculas
    query = query.or(`nombre.ilike.%${searchTermLower}%,codigo_barras.ilike.%${searchTermLower}%`)

    // Si el término de búsqueda es un número, también buscar por ID
    if (!isNaN(Number.parseInt(searchTerm))) {
      query = query.or(`id.eq.${Number.parseInt(searchTerm)}`)
    }

    const { data, error } = await query.limit(10)

    if (error) throw error

    return data || []
  },

  async createProducto(producto: ProductoInsert) {
    // Si tenemos precio_lista y utilidad_porcentual pero no precio_final, calcularlo
    if (producto.precio_lista && producto.utilidad_porcentual && !producto.precio_final) {
      producto.precio_final = producto.precio_lista * (1 + producto.utilidad_porcentual / 100)
    }

    // Si tenemos precio_lista y precio_final pero no utilidad_porcentual, calcularlo
    if (producto.precio_lista && producto.precio_final && !producto.utilidad_porcentual) {
      producto.utilidad_porcentual = (producto.precio_final / producto.precio_lista - 1) * 100
    }

    const { data, error } = await supabase.from("producto").insert(producto).select().single()

    if (error) throw error

    return data
  },

  async updateProducto(id: number, producto: ProductoUpdate) {
    // Si tenemos precio_lista y utilidad_porcentual pero no precio_final, calcularlo
    if (producto.precio_lista && producto.utilidad_porcentual && !producto.precio_final) {
      producto.precio_final = producto.precio_lista * (1 + producto.utilidad_porcentual / 100)
    }

    // Si tenemos precio_lista y precio_final pero no utilidad_porcentual, calcularlo
    if (producto.precio_lista && producto.precio_final && !producto.utilidad_porcentual) {
      producto.utilidad_porcentual = (producto.precio_final / producto.precio_lista - 1) * 100
    }

    const { data, error } = await supabase.from("producto").update(producto).eq("id", id).select().single()

    if (error) throw error

    return data
  },

  async deleteProducto(id: number) {
    const { error } = await supabase.from("producto").delete().eq("id", id)

    if (error) throw error

    return true
  },
}

