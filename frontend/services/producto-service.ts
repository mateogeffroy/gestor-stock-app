// frontend/services/producto-service.ts

import { fetchFromAPI } from "@/lib/api";

// --- CAMBIO 1: Ajustamos los tipos para que coincidan con el JSON de Django ---
// Los campos DecimalField se reciben como strings.
export interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio_lista: string;
  utilidad_porcentual: string | null;
  precio_final: string | null;
  codigo_barras: string | null;
}

// Para crear un producto, los datos que se envían sí pueden ser numéricos.
export type ProductoInsert = {
    nombre: string;
    stock: number;
    precio_lista: number;
    utilidad_porcentual: number | null;
    precio_final: number | null;
    codigo_barras: string | null;
};

// Para actualizar, cualquier campo es opcional.
export type ProductoUpdate = Partial<ProductoInsert>;

export const productoService = {
  async getProductos(page = 1, pageSize = 5, search = "") {
    // El endpoint ya estaba bien, busca por nombre o código de barras.
    const endpoint = `/api/productos/?page=${page}&search=${search}&page_size=${pageSize}`;
    const data = await fetchFromAPI(endpoint);

    // --- CAMBIO 2: Aseguramos que la paginación se calcule correctamente ---
    const totalPages = Math.ceil((data.count || 0) / pageSize);

    return {
      productos: data.results as Producto[],
      totalPages: totalPages,
    };
  },

  async createProducto(producto: ProductoInsert): Promise<Producto> {
    // --- CAMBIO 3: Eliminamos la lógica de cálculo de precios ---
    // Esta lógica ya está en el componente de la página. El servicio solo envía.
    const endpoint = "/api/productos/";
    return await fetchFromAPI(endpoint, {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  },

  async updateProducto(id: number, producto: ProductoUpdate): Promise<Producto> {
    const endpoint = `/api/productos/${id}/`;
    return await fetchFromAPI(endpoint, {
      method: 'PUT', // PUT actualiza el objeto completo. PATCH sería para cambios parciales.
      body: JSON.stringify(producto),
    });
  },

  async deleteProducto(id: number): Promise<void> {
    const endpoint = `/api/productos/${id}/`;
    await fetchFromAPI(endpoint, {
      method: 'DELETE',
    });
  },
};