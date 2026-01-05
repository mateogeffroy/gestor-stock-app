import { supabase } from "@/lib/supabase";

// Definimos la interfaz basada en tu NUEVA tabla 'producto'
export interface Producto {
  id: number;
  nombre: string;
  codigo: string | null;
  precio_lista: number;
  precio_costo: number;
  porcentaje_utilidad: number;
  stock: number;
  activo: boolean; // <--- Agregado para Soft Delete
}

export interface ProductoInsert {
  nombre: string;
  codigo?: string | null;
  precio_lista: number;
  precio_costo?: number;
  porcentaje_utilidad?: number;
  stock: number;
  activo?: boolean;
}

export const productoService = {
  async getProductos(page = 1, pageSize = 5, search = "") {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("producto")
      .select("*", { count: "exact" })
      .eq("activo", true) // <--- CRÍTICO: Solo traemos productos no "borrados"
      .range(from, to)
      .order("nombre", { ascending: true });

    if (search) {
      // Ajustamos la búsqueda para que respete el filtro de activo
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      productos: data as Producto[],
      totalPages,
      totalResultados: count,
    };
  },

  async createProducto(producto: ProductoInsert): Promise<Producto> {
    const { data, error } = await supabase
      .from("producto")
      .insert({
        nombre: producto.nombre,
        codigo: producto.codigo || null,
        precio_lista: producto.precio_lista,
        precio_costo: producto.precio_costo || 0,
        porcentaje_utilidad: producto.porcentaje_utilidad || 0,
        stock: producto.stock,
        activo: true // Todo producto nuevo nace activo
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateProducto(id: number, producto: Partial<ProductoInsert>): Promise<Producto> {
    const { data, error } = await supabase
      .from("producto")
      .update(producto)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // MODIFICADO: Ahora es un borrado lógico
  async deleteProducto(id: number): Promise<void> {
    const { error } = await supabase
      .from("producto")
      .update({ activo: false }) // <--- No borramos la fila, la desactivamos
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  },

  async getProductoByCodigo(codigo: string): Promise<Producto | null> {
    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("codigo", codigo)
      .eq("activo", true) // <--- Solo buscamos entre los activos
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },
};