import { supabase } from "@/lib/supabase";

export interface VentaDetalle {
  id_producto: number;
  cantidad: number;
  subtotal: number;
  producto?: { nombre: string; codigo: string };
}

export interface NuevaVenta {
  total: number;
  id_tipo_venta: number;
  id_caja: number;
  detalles: VentaDetalle[];
}

// Interfaz para los filtros
interface FiltrosVenta {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  orden?: 'asc' | 'desc'; // asc = más viejas, desc = más nuevas
}

export const ventaService = {
  // Mantenemos esta para el Dashboard
  async getUltimasVentas(limit = 10) {
    const { data, error } = await supabase
      .from("venta")
      .select(`*, tipo_venta (descripcion)`)
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // --- FUNCIÓN PAGINADA CON FILTROS ---
  async getVentasPaginated(page = 1, pageSize = 5, filters?: FiltrosVenta) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1. Iniciamos la consulta base
    let query = supabase
      .from("venta")
      .select(`*, tipo_venta (descripcion)`, { count: 'exact' });

    // 2. Aplicamos filtros dinámicamente si existen
    if (filters?.fecha) {
      query = query.eq('fecha', filters.fecha);
    }

    if (filters?.horaInicio) {
      // 'gte' = Greater Than or Equal (Mayor o igual que)
      query = query.gte('hora', filters.horaInicio);
    }

    if (filters?.horaFin) {
      // 'lte' = Less Than or Equal (Menor o igual que)
      query = query.lte('hora', filters.horaFin);
    }

    // 3. Aplicamos Ordenamiento
    // Por defecto es descendente (más nuevas primero)
    const ascending = filters?.orden === 'asc';
    
    query = query
      .order("fecha", { ascending: ascending })
      .order("hora", { ascending: ascending })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return {
      ventas: data || [],
      totalPages,
      totalResultados: count
    };
  },

  async getVentaById(id: number) {
    const { data, error } = await supabase
      .from("venta")
      .select(`
        *,
        tipo_venta ( descripcion ),
        venta_detalle (
          id,
          cantidad,
          subtotal,
          descripcion,
          precio_unitario,
          descuento,
          producto (nombre, codigo, precio_lista)
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createVenta(venta: NuevaVenta) {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().split(' ')[0];

    const { data: ventaData, error: ventaError } = await supabase
      .from("venta")
      .insert({
        fecha: fecha,
        hora: hora,
        total: venta.total,
        id_tipo_venta: venta.id_tipo_venta,
        id_caja: venta.id_caja,
      })
      .select()
      .single();

    if (ventaError) throw new Error(ventaError.message);

    const idVentaCreada = ventaData.id;

    const detallesParaInsertar = venta.detalles.map((d) => ({
      id_venta: idVentaCreada,
      id_producto: d.id_producto,
      descripcion: (d as any).nombre_producto, 
      precio_unitario: (d as any).precio_unitario, 
      descuento: (d as any).descuento_individual || 0,
      cantidad: d.cantidad,
      subtotal: d.subtotal,
    }));

    const { error: detallesError } = await supabase
      .from("venta_detalle")
      .insert(detallesParaInsertar);

    if (detallesError) {
      await supabase.from("venta").delete().eq("id", idVentaCreada);
      throw new Error(detallesError.message);
    }

    // Actualizar Stock
    for (const d of detallesParaInsertar) {
      if (d.id_producto) {
        await supabase.rpc("decrementar_stock", {
          p_id_producto: d.id_producto,
          p_cantidad: d.cantidad
        });
      }
    }

    return ventaData;
  },

  async deleteVenta(id: number) {
    const { data: venta, error: fetchError } = await supabase
      .from("venta")
      .select("*, venta_detalle(id_producto, cantidad)")
      .eq("id", id)
      .single();
    
    if (fetchError) throw new Error(fetchError.message);

    // Devolver stock
    if (venta.venta_detalle) {
      for (const d of venta.venta_detalle) {
        if (d.id_producto) {
           await supabase.rpc("decrementar_stock", {
             p_id_producto: d.id_producto,
             p_cantidad: -d.cantidad 
           });
        }
      }
    }

    const { error: deleteError } = await supabase
      .from("venta")
      .delete()
      .eq("id", id);

    if (deleteError) throw new Error(deleteError.message);
  },
  
  async updateTipoVenta(idVenta: number, idTipoVenta: number) {
      const { error } = await supabase
        .from("venta")
        .update({ id_tipo_venta: idTipoVenta })
        .eq("id", idVenta);

      if (error) throw new Error(error.message);
    }
};