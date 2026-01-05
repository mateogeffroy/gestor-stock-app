// frontend/app/cajas/actions.ts
"use server"

import { fetchFromAPI } from "@/lib/api";
import { Caja, ResumenCaja, VentaConDetalles } from "./types";

// Obtiene el historial de cajas cerradas (paginado)
export const fetchCajas = async (page = 1) => {
  const data = await fetchFromAPI(`/api/cajas/?page=${page}`);
  // Asumimos una respuesta paginada de Django
  return data; 
};

// Obtiene el resumen de ventas del día (pendientes de cierre)
export const getResumenDiario = async (): Promise<ResumenCaja> => {
  return await fetchFromAPI('/api/cajas/resumen_diario/');
};

// Llama al endpoint para cerrar la caja del día
export const cerrarCaja = async (): Promise<Caja> => {
  return await fetchFromAPI('/api/cajas/cerrar_caja/', {
    method: 'POST',
  });
};

// Obtiene todas las ventas asociadas a una caja específica por su ID
export const getVentasPorCaja = async (cajaId: number): Promise<VentaConDetalles[]> => {
  return await fetchFromAPI(`/api/cajas/${cajaId}/ventas/`);
};