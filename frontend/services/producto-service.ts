import { fetchFromAPI } from "@/lib/api";

// 1. Definimos los tipos manualmente para que coincidan con el modelo de Django.
export interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio_lista: number;
  utilidad_porcentual: number | null;
  precio_final: number | null;
  codigo_barras: string | null;
}

export type ProductoInsert = Omit<Producto, "id">;
export type ProductoUpdate = Partial<ProductoInsert>; // Partial es mejor para actualizaciones

export const productoService = {
  // 2. Adaptamos getProductos para usar los parámetros de URL de Django REST Framework
  async getProductos(page = 1, pageSize = 5, searchTerm = "") {
    const endpoint = `/api/productos/?page=${page}&search=${searchTerm}`;
    const data = await fetchFromAPI(endpoint);

    // La respuesta de DRF con paginación tiene el formato: { count, results }
    const totalPages = Math.ceil((data.count || 0) / pageSize);

    return {
      productos: data.results as Producto[],
      totalCount: data.count || 0,
      totalPages: totalPages,
    };
  },

  async getProductoById(id: number): Promise<Producto> {
    const endpoint = `/api/productos/${id}/`;
    return await fetchFromAPI(endpoint);
  },

  async searchProductos(searchTerm: string): Promise<Producto[]> {
    // Esta función ahora usa el mismo endpoint de búsqueda que getProductos
    const endpoint = `/api/productos/?search=${searchTerm}`;
    const data = await fetchFromAPI(endpoint);
    return data.results as Producto[];
  },

  async createProducto(producto: ProductoInsert): Promise<Producto> {
    // 3. Mantenemos tu lógica de negocio para calcular precios aquí en el frontend
    if (producto.precio_lista && producto.utilidad_porcentual && !producto.precio_final) {
      producto.precio_final = producto.precio_lista * (1 + producto.utilidad_porcentual / 100);
    }
    if (producto.precio_lista && producto.precio_final && !producto.utilidad_porcentual) {
      producto.utilidad_porcentual = (producto.precio_final / producto.precio_lista - 1) * 100;
    }
    
    // 4. Cambiamos la llamada de supabase a fetchFromAPI con el método POST
    const endpoint = "/api/productos/";
    return await fetchFromAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  async updateProducto(id: number, producto: ProductoUpdate): Promise<Producto> {
    // Mantenemos la lógica de negocio también aquí
    if (producto.precio_lista && producto.utilidad_porcentual && !producto.precio_final) {
        producto.precio_final = producto.precio_lista * (1 + producto.utilidad_porcentual / 100);
    }
    if (producto.precio_lista && producto.precio_final && !producto.utilidad_porcentual) {
        producto.utilidad_porcentual = (producto.precio_final / producto.precio_lista - 1) * 100;
    }

    const endpoint = `/api/productos/${id}/`;
    return await fetchFromAPI(endpoint, {
      method: 'PUT', // PUT para actualizar el objeto completo
      body: JSON.stringify(producto),
    });
  },

  async deleteProducto(id: number): Promise<void> {
    const endpoint = `/api/productos/${id}/`;
    await fetchFromAPI(endpoint, {
      method: 'DELETE',
    });
    // La respuesta exitosa de un DELETE no tiene cuerpo, por eso no retornamos nada.
  },
};