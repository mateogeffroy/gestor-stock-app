// frontend/services/facturacion.service.ts

interface DatosVenta {
  userId: string;
  total: number;
  tipo_venta_afip: number; // 11 (C), 6 (B), 1 (A)
}

export const facturacionService = {
  
  // Esta función llama a TU propio backend
  crearFactura: async (datos: DatosVenta) => {
    try {
      const respuesta = await fetch('/api/facturar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.error || 'Error al procesar la factura');
      }

      return resultado; // Retorna { cae, vencimiento, numero_comprobante... }

    } catch (error: any) {
      console.error("Error en servicio de facturación:", error);
      throw error;
    }
  }
};