import { NextResponse } from "next/server"
import { supabaseDelUsuario } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { arcaPara } from "@/lib/arca/servidor"
import {
  tipoComprobante, documentoReceptor, importes, fechaArca, numeroComprobante, LETRA, ErrorFiscal,
  type CondicionEmisor,
} from "@/lib/arca/fiscal"

export const runtime = "nodejs"
export const maxDuration = 30

const NUMERO_DESINCRONIZADO = 10016 // otro comprobante tomó el número entre la consulta y el pedido

// Pide el CAE de una venta ya guardada. Idempotente: si ya está autorizada, devuelve lo que hay.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await supabaseDelUsuario()

  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: "Iniciá sesión de nuevo." }, { status: 401 })

  const { data: venta } = await db
    .from("venta")
    .select("id, total, estado_fiscal, condicion_iva_receptor, cliente_cuit, doc_nro, cae, vto_cae, cbte_tipo, pto_vta, cbte_nro")
    .eq("id", id)
    .maybeSingle()
  if (!venta) return NextResponse.json({ error: "No encontramos esa venta." }, { status: 404 })
  if (venta.estado_fiscal === "autorizada") return NextResponse.json({ venta })

  const { data: fiscal } = await db.from("comercio_fiscal").select("*").eq("user_id", user.id).maybeSingle()
  if (!fiscal)
    return NextResponse.json({ error: "Completá tus datos fiscales en Mi cuenta → Facturación." }, { status: 400 })

  // La lectura de arriba pasó por RLS, así que la venta es del usuario. Las escrituras fiscales van con
  // service role porque la política de venta bloquea updates en cajas cerradas, y una factura pendiente
  // (ARCA caída a la noche) tiene que poder emitirse después del cierre. Solo se tocan campos fiscales.
  const ventas = () => supabaseAdmin.from("venta")

  // Reservar la venta: evita pedir dos CAE si se aprieta "facturar" dos veces a la vez.
  // ponytail: si el proceso muere entre el CAE y el guardado, la venta queda en "procesando";
  // en ese caso verificá en ARCA (Comprobantes en línea) antes de reintentar.
  const { data: reservada } = await ventas()
    .update({ estado_fiscal: "procesando", error_fiscal: null, id_tipo_venta: 2 })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("estado_fiscal", ["no_aplica", "pendiente", "error"])
    .select("id")
    .maybeSingle()
  if (!reservada)
    return NextResponse.json({ error: "Esta venta ya se está facturando. Esperá unos segundos y recargá." }, { status: 409 })

  const fallar = async (mensaje: string, status: number) => {
    await ventas().update({ estado_fiscal: "error", error_fiscal: mensaje }).eq("id", id).eq("user_id", user.id)
    return NextResponse.json({ error: mensaje }, { status })
  }

  try {
    const condicion = venta.condicion_iva_receptor ?? 5
    const cbteTipo = tipoComprobante(fiscal.condicion_iva as CondicionEmisor, condicion)
    const doc = documentoReceptor(
      { condicion, cuit: venta.cliente_cuit, dni: venta.cliente_cuit ? null : venta.doc_nro?.toString() },
      Number(venta.total)
    )
    const imp = importes(cbteTipo, Number(venta.total), Number(fiscal.alicuota_iva))
    const arca = arcaPara(fiscal.cuit, fiscal.produccion).electronicBillingService

    const pedido = {
      CantReg: 1, PtoVta: fiscal.punto_venta, CbteTipo: cbteTipo, Concepto: 1, // 1 = productos
      ...doc, CbteFch: fechaArca(new Date()), ...imp, MonId: "PES", MonCotiz: 1,
      CondicionIVAReceptorId: condicion,
    }

    for (let intento = 1; ; intento++) {
      const res = await arca.createNextVoucher(pedido)
      const det = res.response.FeDetResp?.FECAEDetResponse?.[0]
      if (res.cae && det?.CbteDesde) {
        const autorizada = {
          estado_fiscal: "autorizada",
          error_fiscal: null,
          cae: res.cae,
          vto_cae: `${res.caeFchVto.slice(0, 4)}-${res.caeFchVto.slice(4, 6)}-${res.caeFchVto.slice(6, 8)}`,
          cbte_tipo: cbteTipo,
          pto_vta: fiscal.punto_venta,
          cbte_nro: det.CbteDesde,
          doc_tipo: doc.DocTipo,
          doc_nro: doc.DocNro,
          condicion_iva_receptor: condicion,
          imp_neto: imp.ImpNeto,
          imp_iva: imp.ImpIVA,
          emisor_cuit: fiscal.cuit,
          tipo_comprobante: `Factura ${LETRA[cbteTipo]}`,
          nro_comprobante: numeroComprobante(fiscal.punto_venta, det.CbteDesde),
        }
        const { data: guardada, error } = await ventas().update(autorizada).eq("id", id).eq("user_id", user.id).select().single()
        if (error) {
          // El CAE existe en ARCA aunque no se haya guardado: dejarlo registrado en el log del servidor.
          console.error("CAE obtenido pero no guardado", { venta: id, ...autorizada, error })
          return NextResponse.json({ error: `ARCA autorizó la factura (CAE ${res.cae}) pero no se pudo guardar. Anotá el CAE.` }, { status: 500 })
        }
        return NextResponse.json({ venta: guardada })
      }

      const errores = [...(res.response.Errors?.Err ?? []), ...(det?.Observaciones?.Obs ?? [])]
      if (errores.some((e) => e.Code === NUMERO_DESINCRONIZADO) && intento < 3) continue
      const motivo = errores.map((e) => `${e.Code}: ${e.Msg}`).join(" · ") || "ARCA rechazó el comprobante sin indicar el motivo."
      return fallar(`ARCA rechazó la factura. ${motivo}`, 422)
    }
  } catch (e: any) {
    if (e instanceof ErrorFiscal) return fallar(e.message, 422)
    console.error("Error facturando venta", id, e)
    return fallar(`No se pudo conectar con ARCA: ${e?.message ?? "error desconocido"}. Reintentá en unos minutos.`, 502)
  }
}
