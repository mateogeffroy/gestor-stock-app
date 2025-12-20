import { supabase } from "@/lib/supabase";

export interface Caja {
  id: number;
  fecha: string;
  total: number;
}

export const cajaService = {
  // 1. OBTENER LA CAJA DE HOY (Tu lógica corregida)
  async getCajaDelDia() {
    const hoy = new Date().toLocaleDateString('en-CA'); // Formato YYYY-MM-DD

    // Paso A: Preguntar si existe
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .eq("fecha", hoy)
      .order('id', { ascending: false }) 
      .limit(1) 
      .maybeSingle(); 

    if (error) throw error;
    if (data) return data;

    // Paso B: Si no existe, crearla
    console.log("No hay caja hoy. Creando una nueva...");
    const { data: nuevaCaja, error: errorCrear } = await supabase
      .from("caja")
      .insert({ fecha: hoy, total: 0 })
      .select()
      .single();
    
    if (errorCrear) throw errorCrear;
    return nuevaCaja;
  },

  // 2. CERRAR CAJA
  async cerrarCaja(idCaja: number, totalCalculado: number) {
    const { data, error } = await supabase
      .from("caja")
      .update({ total: totalCalculado })
      .eq("id", idCaja)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 3. OBTENER RESUMEN
  async getResumenDiario(idCaja: number) {
    const { data: ventas, error } = await supabase
      .from("venta")
      .select("total, id_tipo_venta")
      .eq("id_caja", idCaja);

    if (error) throw error;

    const totalDia = ventas.reduce((acc, v) => acc + v.total, 0);
    
    // Ajusta los IDs según tu tabla 'tipo_venta' (1=General, 2=Factura B, etc.)
    const totalFacturasB = ventas
        .filter(v => v.id_tipo_venta === 2) 
        .reduce((acc, v) => acc + v.total, 0);
        
    const totalOrdenesCompra = ventas
        .filter(v => v.id_tipo_venta === 3)
        .reduce((acc, v) => acc + v.total, 0);

    return {
      totalDia,
      totalFacturasB,
      totalOrdenesCompra,
      cantidadVentas: ventas.length
    };
  },

  // --- AGREGADO: 4. HISTORIAL DE CAJAS ---
  async getCajas() {
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .order("fecha", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // --- AGREGADO: 5. DETALLE DE VENTAS DE UNA CAJA ---
  async getVentasPorCaja(idCaja: number) {
    const { data, error } = await supabase
      .from("venta")
      .select(`
        *,
        tipo_venta (descripcion),
        venta_detalle (
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