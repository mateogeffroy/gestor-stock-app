import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Asegúrate de que esta importación funcione en el servidor
import Afip from "@afipsdk/afip.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total, userId, tipo_venta_afip } = body; 
    // tipo_venta_afip debe ser: 11 (Factura C), 6 (Factura B), 1 (Factura A)

    // 1. OBTENER DATOS FISCALES DEL USUARIO DESDE SUPABASE
    // (Necesitamos las claves para firmar en nombre de ESTE usuario)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("cuit, punto_venta, certificado_crt, clave_privada, condicion_iva")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "No se encontró configuración fiscal para este usuario." }, { status: 400 });
    }

    if (!profile.certificado_crt || !profile.clave_privada) {
      return NextResponse.json({ error: "Faltan certificados digitales (.crt o .key)." }, { status: 400 });
    }

    // 2. INICIALIZAR LIBRERÍA AFIP
    const afip = new Afip({
      CUIT: parseInt(profile.cuit),
      cert: profile.certificado_crt,
      key: profile.clave_privada,
      production: false, // ¡IMPORTANTE! False para pruebas, True para la vida real
    });

    // 3. OBTENER ÚLTIMO NÚMERO DE COMPROBANTE
    // Le preguntamos a AFIP: "¿Cuál fue la última factura que hizo este usuario en este punto de venta?"
    const puntoVenta = profile.punto_venta;
    const tipoComprobante = tipo_venta_afip; // Ej: 11 = Factura C

    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);
    const proximoNumero = lastVoucher + 1;

    // 4. PREPARAR EL PAQUETE DE DATOS PARA AFIP
    const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]
      .replace(/-/g, ""); // Formato YYYYMMDD

    // Detectamos si es Monotributo (Factura C) o Responsable Inscripto (A/B)
    // En Factura C, el neto es el total y el IVA es 0 visualmente para el WSFE
    let impNeto = 0;
    let impIVA = 0;
    
    if (tipoComprobante === 11) { // FACTURA C
        impNeto = total;
        impIVA = 0;
    } else {
        // Lógica simplificada para Responsable Inscripto (Asumiendo todo al 21%)
        // Total = Neto * 1.21  =>  Neto = Total / 1.21
        impNeto = parseFloat((total / 1.21).toFixed(2));
        impIVA = parseFloat((total - impNeto).toFixed(2));
    }

    const data = {
      "CantReg": 1, // Cantidad de facturas a enviar
      "PtoVta": puntoVenta,
      "CbteTipo": tipoComprobante,
      "Concepto": 1, // 1 = Productos, 2 = Servicios, 3 = Ambos
      "DocTipo": 99, // 99 = Consumidor Final (Sin identificar), 80 = CUIT, 96 = DNI
      "DocNro": 0,   // 0 si es Consumidor Final menor a cierto monto
      "CbteDesde": proximoNumero,
      "CbteHasta": proximoNumero,
      "CbteFch": parseInt(date),
      "ImpTotal": total,
      "ImpTotConc": 0, // Importe neto no gravado
      "ImpNeto": impNeto,
      "ImpOpEx": 0, // Importe exento
      "ImpIVA": impIVA,
      "ImpTrib": 0, // Tributos
      "MonId": "PES", // Moneda
      "MonCotiz": 1, // Cotización
    };

    // Si hay IVA (Factura A o B), hay que detallarlo
    if (impIVA > 0) {
        data["Iva"] = [
            {
                "Id": 5, // 5 = 21%
                "BaseImp": impNeto,
                "Importe": impIVA
            }
        ];
    }

    // 5. ¡ENVIAR A ARCA!
    const res = await afip.ElectronicBilling.createVoucher(data);

    // 6. RETORNAR ÉXITO AL FRONTEND
    return NextResponse.json({
      success: true,
      cae: res.CAE,
      vencimiento_cae: res.CAEFchVto,
      numero_comprobante: proximoNumero,
      tipo_comprobante: tipoComprobante
    });

  } catch (error: any) {
    console.error("Error facturando:", error);
    return NextResponse.json({ 
        error: "Error al comunicarse con AFIP", 
        detalle: error.message || JSON.stringify(error) 
    }, { status: 500 });
  }
}