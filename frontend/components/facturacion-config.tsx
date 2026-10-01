"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cuitValido } from "@/lib/arca/fiscal"

const CUIT_SISTEMA = process.env.NEXT_PUBLIC_ARCA_CUIT_SISTEMA ?? ""

const vacio = {
  cuit: "", razon_social: "", condicion_iva: "MT", punto_venta: "", domicilio: "",
  ingresos_brutos: "", inicio_actividades: "", alicuota_iva: "21", produccion: false,
}

export function FacturacionConfig() {
  const { toast } = useToast()
  const [f, setF] = useState(vacio)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [probando, setProbando] = useState(false)
  const [prueba, setPrueba] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    supabase.from("comercio_fiscal").select("*").maybeSingle().then(({ data }) => {
      if (data)
        setF({
          ...vacio, ...data,
          punto_venta: String(data.punto_venta), alicuota_iva: String(data.alicuota_iva),
          domicilio: data.domicilio ?? "", ingresos_brutos: data.ingresos_brutos ?? "", inicio_actividades: data.inicio_actividades ?? "",
        })
      setCargando(false)
    })
  }, [])

  const set = (k: keyof typeof vacio) => (v: any) => setF((x) => ({ ...x, [k]: v }))

  const guardar = async () => {
    if (!cuitValido(f.cuit)) return toast({ title: "CUIT inválido", description: "Revisá los 11 dígitos, sin guiones.", variant: "destructive" })
    if (!f.razon_social || !Number(f.punto_venta))
      return toast({ title: "Faltan datos", description: "Completá razón social y punto de venta.", variant: "destructive" })
    setGuardando(true)
    const { error } = await supabase.from("comercio_fiscal").upsert({
      cuit: f.cuit, razon_social: f.razon_social, condicion_iva: f.condicion_iva, punto_venta: Number(f.punto_venta),
      domicilio: f.domicilio || null, ingresos_brutos: f.ingresos_brutos || null, inicio_actividades: f.inicio_actividades || null,
      alicuota_iva: Number(f.alicuota_iva), produccion: f.produccion, updated_at: new Date().toISOString(),
    })
    setGuardando(false)
    if (error) toast({ title: "No se guardó", description: error.message, variant: "destructive" })
    else toast({ title: "Datos fiscales guardados", description: "Probá la conexión con ARCA para confirmar." })
  }

  const probar = async () => {
    setProbando(true)
    setPrueba(null)
    try {
      const res = await fetch("/api/arca/estado")
      const j = await res.json()
      setPrueba(
        j.ok
          ? { ok: true, texto: `Conectado a ARCA (${j.entorno}). Última Factura ${j.ultimoComprobante.tipo} del punto de venta: Nº ${j.ultimoComprobante.numero}.` }
          : { ok: false, texto: j.error }
      )
    } finally {
      setProbando(false)
    }
  }

  if (cargando) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />

  return (
    <div className="space-y-6">
      <details className="rounded-md border p-4 text-sm" open={!f.cuit}>
        <summary className="cursor-pointer font-semibold">Cómo habilitar la facturación (una sola vez, en la web de ARCA)</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Entrá a arca.gob.ar con tu CUIT y clave fiscal (nivel 3 o superior).</li>
          <li>
            En <strong>Administración de puntos de venta y domicilios</strong>, creá un punto de venta del tipo
            <strong> "RECE para aplicativo y web services"</strong>. Anotá el número.
          </li>
          <li>
            En <strong>Administrador de Relaciones de Clave Fiscal</strong> → Nueva relación → buscá el servicio
            <strong> "Facturación Electrónica"</strong> (ARCA → WebServices) y delegalo al CUIT
            {CUIT_SISTEMA ? <strong> {CUIT_SISTEMA}</strong> : " del sistema"}.
          </li>
          <li>Avisanos: aceptamos la delegación desde nuestra cuenta de ARCA (suele quedar lista en el día).</li>
          <li>Completá estos datos, guardá y tocá <strong>Probar conexión</strong>.</li>
        </ol>
        <p className="mt-3 text-muted-foreground">No hace falta que generes certificados ni que nos pases tu clave fiscal.</p>
      </details>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="f-cuit">CUIT</Label>
          <Input id="f-cuit" inputMode="numeric" maxLength={11} placeholder="11 dígitos sin guiones" value={f.cuit} onChange={(e) => set("cuit")(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-rs">Razón social</Label>
          <Input id="f-rs" value={f.razon_social} onChange={(e) => set("razon_social")(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Condición frente al IVA</Label>
          <Select value={f.condicion_iva} onValueChange={set("condicion_iva")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MT">Monotributo (emite Factura C)</SelectItem>
              <SelectItem value="RI">Responsable inscripto (emite A y B)</SelectItem>
              <SelectItem value="EX">Exento (emite Factura C)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-pv">Punto de venta</Label>
          <Input id="f-pv" type="number" min={1} value={f.punto_venta} onChange={(e) => set("punto_venta")(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="f-dom">Domicilio comercial</Label>
          <Input id="f-dom" value={f.domicilio} onChange={(e) => set("domicilio")(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-iibb">Ingresos brutos <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Input id="f-iibb" value={f.ingresos_brutos} onChange={(e) => set("ingresos_brutos")(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-ini">Inicio de actividades</Label>
          <Input id="f-ini" type="date" value={f.inicio_actividades} onChange={(e) => set("inicio_actividades")(e.target.value)} />
        </div>
        {f.condicion_iva === "RI" && (
          <div className="space-y-2">
            <Label>IVA de tus productos</Label>
            <Select value={f.alicuota_iva} onValueChange={set("alicuota_iva")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["21", "10.5", "27", "5", "2.5", "0"].map((a) => <SelectItem key={a} value={a}>{a.replace(".", ",")} %</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border p-4">
        <div>
          <p className="font-medium">Facturas reales</p>
          <p className="text-sm text-muted-foreground">
            {f.produccion ? "Las facturas tienen validez fiscal." : "Modo prueba (homologación): las facturas no tienen validez fiscal."}
          </p>
        </div>
        <Switch checked={f.produccion} onCheckedChange={set("produccion")} aria-label="Facturas reales" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={guardar} disabled={guardando} className="font-semibold">
          {guardando && <Loader2 className="animate-spin" />} Guardar datos fiscales
        </Button>
        <Button variant="outline" onClick={probar} disabled={probando || !f.cuit}>
          {probando && <Loader2 className="animate-spin" />} Probar conexión
        </Button>
      </div>

      {prueba && (
        <p className="flex items-start gap-2 text-sm" role="status">
          {prueba.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
          {prueba.texto}
        </p>
      )}
    </div>
  )
}
