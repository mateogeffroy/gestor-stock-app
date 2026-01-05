import { supabase } from "@/lib/supabase";

// 1. MEJORA: Agregamos los campos opcionales que vienen del form para evitar "as any"
export interface VentaDetalle {
  id_producto: number;
  cantidad: number;
  subtotal: number;
  // Campos auxiliares para la creación
  nombre_producto?: string;
  precio_unitario?: number;
  descuento_individual?: number;
  producto?: { nombre: string; codigo: string };
}

export interface NuevaVenta {
  total: number;
  id_tipo_venta: number;
  id_caja: number;
  detalles: VentaDetalle[];
  
  // Datos Fiscales (AFIP)
  cae?: string | null;
  vto_cae?: string | null;
  nro_comprobante?: string | null;
  tipo_comprobante?: string | null;

  // Datos del Cliente
  id_cliente?: number | null;
  cliente_nombre?: string | null;
  cliente_cuit?: string | null;
  cliente_direccion?: string | null;
}

interface FiltrosVenta {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  orden?: 'asc' | 'desc';
}

export const ventaService = {
  
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

  async getVentasPaginated(page = 1, pageSize = 5, filters?: FiltrosVenta) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("venta")
      .select(`*, tipo_venta (descripcion)`, { count: 'exact' });

    if (filters?.fecha) {
      query = query.eq('fecha', filters.fecha);
    }

    if (filters?.horaInicio) {
      query = query.gte('hora', filters.horaInicio);
    }

    if (filters?.horaFin) {
      query = query.lte('hora', filters.horaFin);
    }

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
    // 2. MEJORA: Usar fecha local para evitar errores de zona horaria (UTC vs Local)
    const fecha = now.toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const hora = now.toTimeString().split(' ')[0]; // HH:MM:SS local

    // INSERCIÓN CON TODOS LOS DATOS
    const { data: ventaData, error: ventaError } = await supabase
      .from("venta")
      .insert({
        fecha: fecha,
        hora: hora,
        total: venta.total,
        id_tipo_venta: venta.id_tipo_venta,
        id_caja: venta.id_caja,
        
        // Datos Fiscales
        cae: venta.cae,
        vto_cae: venta.vto_cae,
        nro_comprobante: venta.nro_comprobante,
        tipo_comprobante: venta.tipo_comprobante,

        // Datos del Cliente
        id_cliente: venta.id_cliente || null,
        cliente_nombre: venta.cliente_nombre || "Consumidor Final",
        cliente_cuit: venta.cliente_cuit || null,
        cliente_direccion: venta.cliente_direccion || null
      })
      .select()
      .single();

    if (ventaError) throw new Error(ventaError.message);

    const idVentaCreada = ventaData.id;

    // Mapeo limpio gracias a la interfaz actualizada
    const detallesParaInsertar = venta.detalles.map((d) => ({
      id_venta: idVentaCreada,
      id_producto: d.id_producto,
      descripcion: d.nombre_producto, // Ya no requiere 'as any'
      precio_unitario: d.precio_unitario, 
      descuento: d.descuento_individual || 0,
      cantidad: d.cantidad,
      subtotal: d.subtotal,
    }));

    const { error: detallesError } = await supabase
      .from("venta_detalle")
      .insert(detallesParaInsertar);

    if (detallesError) {
      // Rollback manual si falla el detalle
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
    // 1. Obtenemos los detalles de la venta Y el estado de la caja asociada
    // Nota: Usamos una consulta separada para la caja para asegurar robustez si no hay FK configurada en Supabase UI
    const { data: venta, error: fetchError } = await supabase
      .from("venta")
      .select("*, venta_detalle(id_producto, cantidad)")
      .eq("id", id)
      .single();
    
    if (fetchError) throw new Error("Venta no encontrada");

    // 2. VERIFICACIÓN DE SEGURIDAD (Gatekeeper)
    // Buscamos la caja asociada para ver si está cerrada
    const { data: caja, error: cajaError } = await supabase
        .from("caja")
        .select("estado")
        .eq("id", venta.id_caja)
        .single();

    if (cajaError) throw new Error("Error al verificar la caja");

    // AQUÍ ESTÁ LA MAGIA: Lanzamos el error manualmente si está cerrada
    if (caja && caja.estado === 'cerrada') {
        throw new Error("No se pueden borrar ventas de cajas ya cerradas.");
    }

    // 3. Si pasamos el control, ahora sí devolvemos el stock
    if (venta.venta_detalle) {
      for (const d of venta.venta_detalle) {
        if (d.id_producto) {
           await supabase.rpc("decrementar_stock", {
             p_id_producto: d.id_producto,
             p_cantidad: -d.cantidad // Negativo para devolver
           });
        }
      }
    }

    // 4. Finalmente borramos la venta
    const { error: deleteError } = await supabase
      .from("venta")
      .delete()
      .eq("id", id);

    if (deleteError) {
        // Si falla el borrado real (raro si pasó el check de caja), lanzamos error
        throw new Error(deleteError.message);
    }
  },
  
  async updateTipoVenta(idVenta: number, idTipoVenta: number) {
      const { error } = await supabase
        .from("venta")
        .update({ id_tipo_venta: idTipoVenta })
        .eq("id", idVenta);

      if (error) throw new Error(error.message);
    }
};