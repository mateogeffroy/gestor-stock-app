import { supabase } from "@/lib/supabase";

export interface Caja {
  id: number;
  fecha: string;
  total: number;
  estado: 'abierta' | 'cerrada';
}

export interface ResumenCaja {
  totalDia: number;
  totalFacturasB: number;
  totalOrdenesCompra: number;
  cantidadVentas: number;
}

export const cajaService = {
  // 1a. SOLO CONSULTA (Para la pantalla de Cajas)
  async obtenerCajaAbierta() {
    const hoy = new Date().toLocaleDateString('en-CA');
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .eq("fecha", hoy)
      .eq("estado", "abierta")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener caja abierta:", error);
      throw error;
    }
    return data; 
  },

  // 1b. ASEGURA Y CREA (Para el formulario de Ventas)
  async asegurarCajaAbierta() {
    const cajaExistente = await this.obtenerCajaAbierta();
    
    if (cajaExistente) return cajaExistente;

    const hoy = new Date().toLocaleDateString('en-CA');
    const { data: nuevaCaja, error: errorCrear } = await supabase
      .from("caja")
      .insert({ 
        fecha: hoy, 
        total: 0, 
        estado: 'abierta' 
      })
      .select()
      .single();
    
    if (errorCrear) {
      console.error("Error al crear caja de emergencia:", errorCrear);
      throw errorCrear;
    }
    return nuevaCaja;
  },

  // 2. CERRAR CAJA
  async cerrarCaja(idCaja: number, totalCalculado: number) {
    const { data, error } = await supabase
      .from("caja")
      .update({ 
        total: totalCalculado, 
        estado: 'cerrada' 
      })
      .eq("id", idCaja)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 3. OBTENER RESUMEN DIARIO
  async getResumenDiario(idCaja: number): Promise<ResumenCaja> {
    const { data: ventas, error } = await supabase
      .from("venta")
      .select("total, id_tipo_venta")
      .eq("id_caja", idCaja);

    if (error) throw error;

    const totalDia = ventas.reduce((acc, v) => acc + Number(v.total), 0);
    
    const totalFacturasB = ventas
        .filter(v => v.id_tipo_venta === 2) 
        .reduce((acc, v) => acc + Number(v.total), 0);
        
    const totalOrdenesCompra = ventas
        .filter(v => v.id_tipo_venta === 1)
        .reduce((acc, v) => acc + Number(v.total), 0);

    return {
      totalDia,
      totalFacturasB,
      totalOrdenesCompra,
      cantidadVentas: ventas.length
    };
  },

  // 4. HISTORIAL DE CAJAS (Filtrado solo para CERRADAS)
  async getCajas() {
    const { data, error } = await supabase
      .from('caja')
      .select('*')
      .eq('estado', 'cerrada') // <--- SOLO TRAEMOS LAS CERRADAS
      .order('fecha', { ascending: false })
      .order('id', { ascending: false });
    
    if (error) throw error;
    return data as Caja[];
  },

  // 5. DETALLE DE VENTAS DE UNA CAJA
  async getVentasPorCaja(idCaja: number) {
    const { data, error } = await supabase
      .from("venta")
      .select(`
        *,
        tipo_venta (descripcion),
        venta_detalle (
          id,
          cantidad,
          subtotal,
          producto (nombre, precio_lista)
        )
      `)
      .eq("id_caja", idCaja)
      .order("id", { ascending: false });

    if (error) throw error;
    return data || [];
  }
};