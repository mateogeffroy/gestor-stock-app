"use server"

import { fetchFromAPI } from "@/lib/api"; 
import { Venta } from "./types";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const fetchVentas = async (): Promise<PaginatedResponse<Venta>> => {
  const data = await fetchFromAPI('/api/ventas/');
  return data;
};

// --- INICIO DEL CAMBIO ---
// Nueva función para obtener las últimas 5 ventas
export const fetchUltimasVentas = async (): Promise<Venta[]> => {
  // Llamamos al nuevo endpoint que no es paginado
  const data = await fetchFromAPI('/api/ventas/ultimas/');
  return data;
};
// --- FIN DEL CAMBIO ---

export const searchProductos = async (term: string) => {
  if (!term) return [];
  const data = await fetchFromAPI(`/api/productos/?search=${term}`);
  return data.results || []; 
};

export const createVenta = async (ventaData: any) => {
  return await fetchFromAPI('/api/ventas/', {
    method: 'POST',
    body: JSON.stringify(ventaData)
  });
};

export const deleteVenta = async (id: number) => {
  return await fetchFromAPI(`/api/ventas/${id}/`, {
    method: 'DELETE'
  });
};