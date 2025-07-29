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
  // Ahora la función devuelve el objeto paginado completo
  const data = await fetchFromAPI('/api/ventas/');
  return data;
};

export const searchProductos = async (term: string) => {
  if (!term) return [];
  const data = await fetchFromAPI(`/api/productos/?search=${term}`);
  // La búsqueda de productos también es paginada
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