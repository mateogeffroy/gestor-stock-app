import { NextResponse } from "next/server"
import { supabaseDelUsuario } from "@/lib/supabase-server"
import { arcaPara } from "@/lib/arca/servidor"
import { CBTE, tipoComprobante, CONDICION_RECEPTOR, type CondicionEmisor } from "@/lib/arca/fiscal"

export const runtime = "nodejs"

// "Probar conexión" de Mi cuenta: confirma que ARCA responde y que la delegación del comercio funciona.
export async function GET() {
  const db = await supabaseDelUsuario()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Iniciá sesión de nuevo." }, { status: 401 })

  const { data: fiscal } = await db.from("comercio_fiscal").select("*").eq("user_id", user.id).maybeSingle()
  if (!fiscal) return NextResponse.json({ error: "Guardá primero tus datos fiscales." }, { status: 400 })

  try {
    const arca = arcaPara(fiscal.cuit, fiscal.produccion).electronicBillingService
    const servidor = await arca.getServerStatus()
    // Consultar el último comprobante exige ticket válido + delegación + punto de venta habilitado
    const tipo = tipoComprobante(fiscal.condicion_iva as CondicionEmisor, CONDICION_RECEPTOR.CONSUMIDOR_FINAL)
    const ultimo = await arca.getLastVoucher(fiscal.punto_venta, tipo)
    return NextResponse.json({
      ok: true,
      entorno: fiscal.produccion ? "producción" : "homologación",
      servidor,
      ultimoComprobante: { tipo: tipo === CBTE.C ? "C" : "B", numero: ultimo.cbteNro ?? 0 },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error desconocido" }, { status: 502 })
  }
}
