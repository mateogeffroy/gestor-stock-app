import { supabase } from "@/lib/supabase";

// Definimos la interfaz basada en tu NUEVA tabla 'producto'
export interface Producto {
  id: number;
  nombre: string;
  codigo: string | null;      // Antes codigo_barras
  precio_lista: number;       // Antes precio_final / precio
  precio_costo: number;
  porcentaje_utilidad: number;
  stock: number;
}

export interface ProductoInsert {
  nombre: string;
  codigo?: string | null;
  precio_lista: number;
  precio_costo?: number;
  porcentaje_utilidad?: number;
  stock: number;
}

export const productoService = {
  async getProductos(page = 1, pageSize = 5, search = "") {
    // Calculamos el rango para la paginación de Supabase
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("producto")
      .select("*", { count: "exact" }) // Pedimos el total de filas para saber cuántas páginas hay
      .range(from, to)
      .order("nombre", { ascending: true });

    // Si hay búsqueda, filtramos (ilike es "case insensitive")
    if (search) {
      // Buscamos por nombre O por código
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

  async deleteProducto(id: number): Promise<void> {
    const { error } = await supabase
      .from("producto")
      .delete()
      .eq("id", id);

    if (error) {
      // Manejo amigable si el producto ya se vendió (FK Constraint)
      if (error.code === '23503') {
        throw new Error("No se puede borrar este producto porque tiene ventas asociadas. Intenta cambiarle el stock a 0.");
      }
      throw new Error(error.message);
    }
  },

  async getProductoByCodigo(codigo: string): Promise<Producto | null> {
    const { data, error } = await supabase
      .from("producto")
      .select("*")
      .eq("codigo", codigo) // Búsqueda exacta
      .maybeSingle(); // Retorna null si no existe, en vez de error

    if (error) throw new Error(error.message);
    return data;
  },
};