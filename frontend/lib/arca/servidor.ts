import { Arca, AccessTicket, type ArcaServiceName } from "@arcasdk/core"
import { supabaseAdmin } from "@/lib/supabase-admin"

// Certificado del SISTEMA (tu CUIT). Cada comercio te delega el servicio "wsfe" en ARCA,
// así que facturás en su nombre poniendo SU cuit en el pedido; nunca guardás claves de clientes.
// Homologación y producción usan certificados distintos.
function credenciales(produccion: boolean) {
  const cert = produccion ? process.env.ARCA_CERT : process.env.ARCA_CERT_HOMO
  const key = produccion ? process.env.ARCA_KEY : process.env.ARCA_KEY_HOMO
  if (!cert || !key)
    throw new Error(`Falta configurar ${produccion ? "ARCA_CERT/ARCA_KEY" : "ARCA_CERT_HOMO/ARCA_KEY_HOMO"} en las variables de entorno.`)
  // Vercel guarda los saltos de línea como "\n" literales
  return { cert: cert.replaceAll("\\n", "\n"), key: key.replaceAll("\\n", "\n") }
}

// El ticket de WSAA dura ~12 h y ARCA rechaza pedir otro mientras siga vigente,
// por eso se comparte entre todas las instancias serverless vía la tabla arca_ticket.
function almacenTicket(produccion: boolean) {
  return {
    async get(servicio: ArcaServiceName) {
      const { data } = await supabaseAdmin
        .from("arca_ticket")
        .select("datos")
        .eq("servicio", servicio)
        .eq("produccion", produccion)
        .maybeSingle()
      if (!data) return null
      const ticket = AccessTicket.create(data.datos)
      return ticket.isExpired() ? null : ticket
    },
    async save(ticket: AccessTicket, servicio: ArcaServiceName) {
      await supabaseAdmin.from("arca_ticket").upsert({
        servicio,
        produccion,
        datos: ticket.toLoginCredentials(),
        vence: ticket.getExpiration().toISOString(),
      })
    },
    async delete(servicio: ArcaServiceName) {
      await supabaseAdmin.from("arca_ticket").delete().eq("servicio", servicio).eq("produccion", produccion)
    },
  }
}

export function arcaPara(cuitComercio: string, produccion: boolean) {
  return new Arca({
    cuit: Number(cuitComercio),
    production: produccion,
    ...credenciales(produccion),
    ticketStorage: almacenTicket(produccion),
  })
}
