// app/ventas/actions.ts (Versión Adaptada)
"use server"

import { fetchFromAPI } from "@/lib/api";
import { Venta } from "./types";

export const fetchVentas = async (): Promise<Venta[]> => {
  const data = await fetchFromAPI('/api/ventas/');
  // Asumimos que la API de ventas no está paginada por ahora
  // Si lo estuviera, sería: return data.results;
  return data;
};

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