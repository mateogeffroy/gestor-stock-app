// services/caja-service.ts (Versión Adaptada para Django)

import { fetchFromAPI } from "@/lib/api";
import { Venta } from "@/app/ventas/types"; // Reutilizamos el tipo Venta

// Definimos los tipos manualmente
export interface Caja {
  id: number;
  total_recaudado: string; // Django envía decimales como string
  fecha_y_hora_cierre: string;
}

export interface ResumenCaja {
  totalOrdenesCompra: number;
  totalFacturasB: number;
  totalDia: number;
}

export const cajaService = {
  async getUltimasCajas(): Promise<Caja[]> {
    const data = await fetchFromAPI('/api/cajas/');
    // La respuesta está paginada, extraemos los resultados
    return data.results || [];
  },

  async getVentasPorCaja(idCaja: number): Promise<Venta[]> {
    // Llamamos a la nueva acción personalizada 'ventas'
    return await fetchFromAPI(`/api/cajas/${idCaja}/ventas/`);
  },

  async getResumenDiario(): Promise<ResumenCaja> {
    // Llamamos a la nueva acción personalizada 'resumen_diario'
    return await fetchFromAPI('/api/cajas/resumen_diario/');
  },

  async cerrarCaja(): Promise<Caja> {
    // Llamamos a la nueva acción personalizada 'cerrar_caja'
    return await fetchFromAPI('/api/cajas/cerrar_caja/', {
      method: 'POST',
      // No necesita body, la lógica está en el servidor
    });
  },
};