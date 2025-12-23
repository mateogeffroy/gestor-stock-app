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

export const ventaService = {
  // Mantenemos esta para el Dashboard (Inicio)
  async getUltimasVentas(limit = 10) {
    const { data, error } = await supabase
      .from("venta")
      .select(`
        *,
        tipo_venta (descripcion)
      `)
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Función paginada
  async getVentasPaginated(page = 1, pageSize = 5) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from("venta")
      .select(`
        *,
        tipo_venta (descripcion)
      `, { count: 'exact' }) 
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false })
      .range(from, to);

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

    // Actualizar Stock solo si hay ID de producto
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