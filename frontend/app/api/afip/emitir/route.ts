import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Simulamos una pequeña espera de 1 segundo para que parezca real
  await new Promise(resolve => setTimeout(resolve, 1000));

  const body = await request.json();
  const { total, tipoComprobante } = body;

  console.log("🔶 MODO SIMULACIÓN: Generando factura virtual por $", total);

  // Generamos datos random verosímiles
  const caeFalso = "7" + Math.floor(Math.random() * 10000000000000);
  const numeroFalso = Math.floor(Math.random() * 9000) + 1;
  
  // Fecha de vencimiento dentro de 10 días
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 10);
  const vtoFalso = fecha.toISOString().split('T')[0];

  return NextResponse.json({ 
    success: true, 
    data: {
        cae: caeFalso, 
        vto_cae: vtoFalso, 
        nro_comprobante: `00001-${String(numeroFalso).padStart(8, '0')}`,
        tipo_comprobante: tipoComprobante || "Factura B"
    }
  });
}